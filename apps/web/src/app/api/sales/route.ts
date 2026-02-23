import { NextRequest, NextResponse } from 'next/server'
import { createSaleSchema } from '@xpid/shared'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse, parseBody } from '@/lib/api-utils'
import { confirmSale } from '@/lib/sales-logic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const customerId = searchParams.get('customer_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const where: Record<string, unknown> = { tenantId: auth.tenantId }

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
      include: { customer: true, items: true, payments: true, receivables: true },
      orderBy: { date: 'desc' },
    })

    const now = new Date()
    const salesWithPaymentStatus = sales.map((sale) => {
      let paymentStatus: string = sale.status // DRAFT or CANCELLED
      if (sale.status === 'CONFIRMED') {
        const openReceivables = sale.receivables.filter((r) => r.status === 'OPEN')
        if (openReceivables.length === 0) {
          paymentStatus = 'PAID'
        } else if (openReceivables.some((r) => r.dueDate < now)) {
          paymentStatus = 'OVERDUE'
        } else {
          paymentStatus = 'OPEN'
        }
      }
      return { ...sale, paymentStatus }
    })

    return NextResponse.json(salesWithPaymentStatus)
  } catch (error) {
    console.error('Error in GET /api/sales:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const result = await parseBody(request, createSaleSchema)
    if ('error' in result) return result.error

    const { items, payments, ...headerData } = result.data
    const tenantId = auth.tenantId
    const deviceId = headerData.deviceId

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          ...headerData,
          tenantId,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              unitId: i.unitId,
              qty: i.qty,
              unitPrice: i.unitPrice,
              total: i.total,
              tenantId,
            })),
          },
        },
        include: { items: true },
      })

      if (headerData.status === 'CONFIRMED') {
        await confirmSale(tx, created.id, items, payments, created.date, headerData.customerId, deviceId, tenantId)
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
