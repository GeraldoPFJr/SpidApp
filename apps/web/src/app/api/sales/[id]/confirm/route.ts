import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-utils'
import { confirmSale } from '@/lib/sales-logic'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!sale) return errorResponse('Sale not found', 404)
    if (sale.status !== 'DRAFT') {
      return errorResponse('Only draft sales can be confirmed', 400)
    }

    let body: {
      payments?: Array<{
        method: string
        amount: number
        accountId: string
        cardType?: string | null
        installments?: number | null
        installmentIntervalDays?: number | null
      }>
    } | undefined

    try {
      body = await request.json()
    } catch {
      body = undefined
    }

    const deviceId = sale.deviceId

    const result = await prisma.$transaction(async (tx) => {
      const items = sale.items.map((i) => ({
        productId: i.productId,
        unitId: i.unitId,
        qty: i.qty,
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
      }))

      await confirmSale(tx, sale.id, items, body?.payments, sale.date, sale.customerId, deviceId)

      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          customer: true,
          items: { include: { product: true, unit: true } },
          payments: true,
          receivables: true,
        },
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST /api/sales/[id]/confirm:', error)
    const message = error instanceof Error ? error.message : 'Failed to confirm sale'
    return errorResponse(message, 500)
  }
}
