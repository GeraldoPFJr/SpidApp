import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

const settleSchema = z.object({
  amount: z.number().positive(),
  accountId: z.string().uuid(),
  method: z.string().min(1),
  notes: z.string().max(500).optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const result = await parseBody(request, settleSchema)
  if ('error' in result) return result.error

  const receivable = await prisma.receivable.findUnique({
    where: { id },
    include: { settlements: true },
  })
  if (!receivable) return errorResponse('Receivable not found', 404)
  if (receivable.status !== 'OPEN') {
    return errorResponse('Receivable is not open', 400)
  }

  const now = new Date()
  const totalSettled = receivable.settlements.reduce(
    (sum, s) => sum + Number(s.amount),
    0,
  )
  const remaining = Number(receivable.amount) - totalSettled

  if (result.data.amount > remaining + 0.01) {
    return errorResponse(`Amount exceeds remaining (${remaining.toFixed(2)})`, 400)
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          saleId: receivable.saleId,
          date: now,
          method: result.data.method,
          amount: result.data.amount,
          accountId: result.data.accountId,
          notes: result.data.notes,
        },
      })

      await tx.receivableSettlement.create({
        data: {
          receivableId: receivable.id,
          paymentId: payment.id,
          amount: result.data.amount,
          paidAt: now,
        },
      })

      const newTotalSettled = totalSettled + result.data.amount
      const isPaid = newTotalSettled >= Number(receivable.amount) - 0.01

      if (isPaid) {
        await tx.receivable.update({
          where: { id: receivable.id },
          data: { status: 'PAID' },
        })
      }

      await tx.financeEntry.create({
        data: {
          type: 'INCOME',
          accountId: result.data.accountId,
          amount: result.data.amount,
          status: 'PAID',
          paidAt: now,
          notes: `Recebimento parcela #${receivable.id.slice(0, 8)}`,
        },
      })

      return tx.receivable.findUnique({
        where: { id: receivable.id },
        include: { settlements: true, customer: true },
      })
    })

    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to settle receivable'
    return errorResponse(message, 500)
  }
}
