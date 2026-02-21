import { NextRequest, NextResponse } from 'next/server'
import { convertToBase } from '@spid/shared'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { product: true, unit: true } },
      costs: true,
      payments: true,
    },
  })
  if (!purchase) return errorResponse('Purchase not found', 404)

  return NextResponse.json(purchase)
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.purchase.findUnique({ where: { id } })
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
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.purchase.findUnique({
    where: { id },
    include: { items: { include: { unit: true, costLots: true } } },
  })
  if (!existing) return errorResponse('Purchase not found', 404)
  if (existing.status === 'CANCELLED') {
    return errorResponse('Purchase already cancelled', 400)
  }

  const deviceId = 'server'

  try {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel purchase'
    return errorResponse(message, 500)
  }
}
