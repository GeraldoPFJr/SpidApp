import { NextRequest, NextResponse } from 'next/server'
import { updateProductSchema } from '@spid/shared'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params
    const tenantId = auth.tenantId

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null, tenantId },
      include: {
        units: { orderBy: { sortOrder: 'asc' } },
        prices: { include: { tier: true, unit: true } },
        category: true,
        subcategory: true,
      },
    })
    if (!product) return errorResponse('Product not found', 404)

    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

    const [inSum, outSum, recentMovements, salesItems] = await Promise.all([
      prisma.inventoryMovement.aggregate({
        where: { productId: id, direction: 'IN', tenantId },
        _sum: { qtyBase: true },
      }),
      prisma.inventoryMovement.aggregate({
        where: { productId: id, direction: 'OUT', tenantId },
        _sum: { qtyBase: true },
      }),
      prisma.inventoryMovement.findMany({
        where: { productId: id, direction: 'IN', tenantId },
        orderBy: { date: 'desc' },
        take: 20,
        select: { id: true, date: true, direction: true, qtyBase: true, reasonType: true, notes: true },
      }),
      prisma.saleItem.findMany({
        where: {
          productId: id,
          tenantId,
          sale: { status: 'CONFIRMED', date: { gte: threeMonthsAgo } },
        },
        select: { qty: true, total: true, sale: { select: { date: true } } },
      }),
    ])

    const stockBase = (inSum._sum.qtyBase ?? 0) - (outSum._sum.qtyBase ?? 0)

    // Agrupar vendas por mês (últimos 3 meses)
    const monthlyMap = new Map<string, { revenue: number; qty: number }>()
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      monthlyMap.set(monthKey, { revenue: 0, qty: 0 })
    }
    for (const item of salesItems) {
      const saleDate = new Date(item.sale.date)
      const monthKey = saleDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      const entry = monthlyMap.get(monthKey)
      if (entry) {
        entry.revenue += Number(item.total)
        entry.qty += item.qty
      }
    }
    const salesLast3Months = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      qty: data.qty,
    }))

    return NextResponse.json({ ...product, stockBase, recentMovements, salesLast3Months })
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params
    const tenantId = auth.tenantId

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    const parsed = updateProductSchema.safeParse({ ...(body as object), id })
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null, tenantId },
      include: { units: true },
    })
    if (!existing) return errorResponse('Product not found', 404)

    const { id: _id, units, prices, ...data } = parsed.data

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update basic product fields
      await tx.product.update({ where: { id }, data })

      // 2. Sync units if provided
      if (units) {
        const incomingIds = units.filter((u) => u.id).map((u) => u.id as string)
        const existingIds = existing.units.map((u) => u.id)

        // Delete units that were removed (only if no FK references)
        const removedIds = existingIds.filter((eid) => !incomingIds.includes(eid))
        for (const rid of removedIds) {
          const saleRefs = await tx.saleItem.count({ where: { unitId: rid } })
          const purchaseRefs = await tx.purchaseItem.count({ where: { unitId: rid } })
          if (saleRefs === 0 && purchaseRefs === 0) {
            await tx.productPrice.deleteMany({ where: { unitId: rid } })
            await tx.productUnit.delete({ where: { id: rid } })
          }
        }

        // Upsert units
        for (const u of units) {
          const { id: unitId, ...unitData } = u
          if (unitId && existingIds.includes(unitId)) {
            await tx.productUnit.update({ where: { id: unitId }, data: unitData })
          } else {
            await tx.productUnit.create({
              data: { ...unitData, productId: id, tenantId, ...(unitId ? { id: unitId } : {}) },
            })
          }
        }
      }

      // 3. Sync prices if provided
      if (prices) {
        await tx.productPrice.deleteMany({ where: { productId: id } })
        if (prices.length > 0) {
          await tx.productPrice.createMany({
            data: prices.map((p) => ({ ...p, productId: id, tenantId })),
          })
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: { units: true, prices: true, category: true },
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error in PUT /api/products/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null, tenantId: auth.tenantId },
    })
    if (!existing) return errorResponse('Product not found', 404)

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/products/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
