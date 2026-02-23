import { NextRequest, NextResponse } from 'next/server'
import { convertToBase } from '@xpid/shared'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const purchase = await prisma.purchase.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: {
        supplier: true,
        items: { include: { product: true, unit: true } },
        costs: true,
        payments: true,
      },
    })
    if (!purchase) return errorResponse('Purchase not found', 404)

    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Error in GET /api/purchases/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const existing = await prisma.purchase.findFirst({
      where: { id, tenantId: auth.tenantId },
    })
    if (!existing) return errorResponse('Purchase not found', 404)

    let body: { notes?: string; status?: string }
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    const updated = await prisma.purchase.update({
      where: { id },
      data: {
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.status !== undefined && { status: body.status }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error in PUT /api/purchases/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params
    const tenantId = auth.tenantId

    const existing = await prisma.purchase.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: { items: { include: { unit: true, costLots: true } } },
    })
    if (!existing) return errorResponse('Purchase not found', 404)
    if (existing.status === 'CANCELLED') {
      return errorResponse('Purchase already cancelled', 400)
    }

    const deviceId = 'server'

    await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        const qtyBase = convertToBase(item.qty, item.unit.factorToBase)

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            date: new Date(),
            direction: 'OUT',
            qtyBase,
            reasonType: 'ADJUSTMENT',
            reasonId: existing.id,
            notes: `Cancelamento compra #${existing.id.slice(0, 8)}`,
            deviceId,
            tenantId,
          },
        })

        for (const lot of item.costLots) {
          await tx.costLot.update({
            where: { id: lot.id },
            data: { qtyRemainingBase: 0 },
          })
        }
      }

      await tx.purchase.update({
        where: { id: existing.id },
        data: { status: 'CANCELLED' },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/purchases/[id]:', error)
    const message = error instanceof Error ? error.message : 'Failed to cancel purchase'
    return errorResponse(message, 500)
  }
}
