import { NextRequest, NextResponse } from 'next/server'
import { createPurchaseSchema, convertToBase } from '@spid/shared'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const supplierId = searchParams.get('supplier_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const where: Record<string, unknown> = {}

    if (supplierId) where.supplierId = supplierId
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.date = dateFilter
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: { supplier: true, items: true, costs: true },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(purchases)
  } catch (error) {
    console.error('Error in GET /api/purchases:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseBody(request, createPurchaseSchema)
    if ('error' in result) return result.error

    const { items, costs, payments, ...headerData } = result.data
    const deviceId = 'server'

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({ data: headerData })

      for (const item of items) {
        const unit = await tx.productUnit.findUnique({ where: { id: item.unitId } })
        if (!unit) throw new Error(`Unit ${item.unitId} not found`)

        const purchaseItem = await tx.purchaseItem.create({
          data: { ...item, purchaseId: created.id },
        })

        const qtyBase = convertToBase(item.qty, unit.factorToBase)

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            date: created.date,
            direction: 'IN',
            qtyBase,
            reasonType: 'PURCHASE',
            reasonId: created.id,
            deviceId,
          },
        })

        const unitCostBase = Number(item.totalCost) / qtyBase
        await tx.costLot.create({
          data: {
            productId: item.productId,
            purchaseItemId: purchaseItem.id,
            qtyRemainingBase: qtyBase,
            unitCostBase,
          },
        })
      }

      if (costs?.length) {
        for (const cost of costs) {
          await tx.purchaseCost.create({ data: { ...cost, purchaseId: created.id } })
        }
      }

      if (payments?.length) {
        for (const pmt of payments) {
          await tx.payment.create({
            data: {
              purchaseId: created.id,
              date: created.date,
              method: pmt.method,
              amount: pmt.amount,
              accountId: pmt.accountId,
            },
          })

          await tx.financeEntry.create({
            data: {
              type: 'EXPENSE',
              accountId: pmt.accountId,
              amount: pmt.amount,
              status: 'PAID',
              paidAt: created.date,
              notes: `Compra #${created.id.slice(0, 8)}`,
            },
          })
        }
      }

      return tx.purchase.findUnique({
        where: { id: created.id },
        include: {
          supplier: true,
          items: { include: { product: true, unit: true } },
          costs: true,
          payments: true,
        },
      })
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/purchases:', error)
    const message = error instanceof Error ? error.message : 'Failed to create purchase'
    return errorResponse(message, 500)
  }
}
