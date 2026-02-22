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

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null, tenantId: auth.tenantId },
      include: {
        units: { orderBy: { sortOrder: 'asc' } },
        prices: { include: { tier: true, unit: true } },
        category: true,
        subcategory: true,
      },
    })
    if (!product) return errorResponse('Product not found', 404)

    return NextResponse.json(product)
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
