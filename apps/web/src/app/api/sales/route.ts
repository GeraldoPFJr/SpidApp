import { NextRequest, NextResponse } from 'next/server'
import { createSaleSchema } from '@spid/shared'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'
import { confirmSale } from '@/lib/sales-logic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const customerId = searchParams.get('customer_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (customerId) where.customerId = customerId
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.date = dateFilter
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { customer: true, items: true, payments: true },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Error in GET /api/sales:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseBody(request, createSaleSchema)
    if ('error' in result) return result.error

    const { items, payments, ...headerData } = result.data
    const deviceId = headerData.deviceId

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          ...headerData,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              unitId: i.unitId,
              qty: i.qty,
              unitPrice: i.unitPrice,
              total: i.total,
            })),
          },
        },
        include: { items: true },
      })

      if (headerData.status === 'CONFIRMED') {
        await confirmSale(tx, created.id, items, payments, created.date, headerData.customerId, deviceId)
      }

      return tx.sale.findUnique({
        where: { id: created.id },
        include: {
          customer: true,
          items: { include: { product: true, unit: true } },
          payments: true,
          receivables: true,
        },
      })
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/sales:', error)
    const message = error instanceof Error ? error.message : 'Failed to create sale'
    return errorResponse(message, 500)
  }
}
