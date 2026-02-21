import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { convertToBase } from '@spid/shared/utils/index.js'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

const cancelSaleSchema = z.object({
  merchandiseAction: z.string().min(1),
  merchandiseNotes: z.string().optional(),
  moneyAction: z.string().min(1),
  moneyNotes: z.string().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const result = await parseBody(request, cancelSaleSchema)
  if ('error' in result) return result.error

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: { include: { unit: true } }, payments: true, receivables: true },
  })
  if (!sale) return errorResponse('Sale not found', 404)
  if (sale.status === 'CANCELLED') {
    return errorResponse('Sale already cancelled', 400)
  }

  const { merchandiseAction, merchandiseNotes, moneyAction, moneyNotes } = result.data
  const deviceId = sale.deviceId

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Handle merchandise
      if (sale.status === 'CONFIRMED') {
        for (const item of sale.items) {
          const qtyBase = convertToBase(item.qty, item.unit.factorToBase)

          if (merchandiseAction === 'returned') {
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                date: new Date(),
                direction: 'IN',
                qtyBase,
                reasonType: 'RETURN',
                reasonId: sale.id,
                notes: merchandiseNotes ?? `Devolucao venda #${sale.couponNumber}`,
                deviceId,
              },
            })
          } else if (merchandiseAction === 'loss') {
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                date: new Date(),
                direction: 'OUT',
                qtyBase,
                reasonType: 'LOSS',
                reasonId: sale.id,
                notes: merchandiseNotes ?? `Perda venda #${sale.couponNumber}`,
                deviceId,
              },
            })
          }
        }
      }

      // Cancel pending receivables
      for (const receivable of sale.receivables) {
        if (receivable.status === 'OPEN') {
          await tx.receivable.update({
            where: { id: receivable.id },
            data: { status: 'CANCELLED' },
          })
        }
      }

      // Handle money refund
      if (moneyAction === 'refunded') {
        const totalPaid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0)
        if (totalPaid > 0) {
          const firstPayment = sale.payments[0]
          if (firstPayment) {
            await tx.financeEntry.create({
              data: {
                type: 'EXPENSE',
                accountId: firstPayment.accountId,
                amount: totalPaid,
                status: 'PAID',
                paidAt: new Date(),
                notes: moneyNotes ?? `Estorno venda #${sale.couponNumber}`,
              },
            })
          }
        }
      }

      return tx.sale.update({
        where: { id: sale.id },
        data: {
          status: 'CANCELLED',
          notes: [
            sale.notes,
            `[CANCELAMENTO] Mercadoria: ${merchandiseAction}. Dinheiro: ${moneyAction}.`,
            merchandiseNotes ? `Merc. obs: ${merchandiseNotes}` : null,
            moneyNotes ? `Din. obs: ${moneyNotes}` : null,
          ]
            .filter(Boolean)
            .join(' | '),
        },
        include: {
          customer: true,
          items: { include: { product: true, unit: true } },
          payments: true,
          receivables: true,
        },
      })
    })

    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel sale'
    return errorResponse(message, 500)
  }
}
