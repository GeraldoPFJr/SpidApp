import type { FastifyInstance } from 'fastify'
import { createPurchaseSchema } from '@spid/shared/schemas/index.js'
import { convertToBase } from '@spid/shared/utils/index.js'
import { prisma } from '../lib/prisma.js'

export async function purchasesRoutes(app: FastifyInstance) {
  // GET /purchases - list with filters
  app.get<{
    Querystring: { supplier_id?: string; date_from?: string; date_to?: string }
  }>('/', async (request) => {
    const { supplier_id, date_from, date_to } = request.query
    const where: Record<string, unknown> = {}

    if (supplier_id) where.supplierId = supplier_id
    if (date_from || date_to) {
      const dateFilter: Record<string, Date> = {}
      if (date_from) dateFilter.gte = new Date(date_from)
      if (date_to) dateFilter.lte = new Date(date_to)
      where.date = dateFilter
    }

    return prisma.purchase.findMany({
      where,
      include: { supplier: true, items: true, costs: true },
      orderBy: { date: 'desc' },
    })
  })

  // GET /purchases/:id - by id with full relations
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const purchase = await prisma.purchase.findUnique({
      where: { id: request.params.id },
      include: {
        supplier: true,
        items: { include: { product: true, unit: true } },
        costs: true,
        payments: true,
      },
    })
    if (!purchase) return reply.status(404).send({ error: 'Purchase not found' })
    return purchase
  })

  // POST /purchases - create complete purchase in transaction
  app.post('/', async (request, reply) => {
    const parsed = createPurchaseSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const { items, costs, payments, ...headerData } = parsed.data
    const deviceId = request.deviceId ?? 'server'

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create purchase header
      const purchase = await tx.purchase.create({ data: headerData })

      // 2. Create purchase items + inventory movements + cost lots
      for (const item of items) {
        const unit = await tx.productUnit.findUnique({ where: { id: item.unitId } })
        if (!unit) throw new Error(`Unit ${item.unitId} not found`)

        const purchaseItem = await tx.purchaseItem.create({
          data: { ...item, purchaseId: purchase.id },
        })

        const qtyBase = convertToBase(item.qty, unit.factorToBase)

        // 4. Create inventory movement (IN, PURCHASE)
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            date: purchase.date,
            direction: 'IN',
            qtyBase,
            reasonType: 'PURCHASE',
            reasonId: purchase.id,
            deviceId,
          },
        })

        // 5. Create cost lot for FIFO
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

      // 3. Create purchase costs (freight, tax, etc)
      if (costs?.length) {
        for (const cost of costs) {
          await tx.purchaseCost.create({ data: { ...cost, purchaseId: purchase.id } })
        }
      }

      // 6/7. Handle payments
      if (payments?.length) {
        for (const pmt of payments) {
          await tx.payment.create({
            data: {
              purchaseId: purchase.id,
              date: purchase.date,
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
              paidAt: purchase.date,
              notes: `Compra #${purchase.id.slice(0, 8)}`,
            },
          })
        }
      }

      return tx.purchase.findUnique({
        where: { id: purchase.id },
        include: {
          supplier: true,
          items: { include: { product: true, unit: true } },
          costs: true,
          payments: true,
        },
      })
    })

    return reply.status(201).send(result)
  })

  // PUT /purchases/:id - update (only notes/status)
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const existing = await prisma.purchase.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Purchase not found' })

    const body = request.body as { notes?: string; status?: string }

    return prisma.purchase.update({
      where: { id: request.params.id },
      data: {
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.status !== undefined && { status: body.status }),
      },
    })
  })

  // DELETE /purchases/:id - cancel (reverse movements)
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const existing = await prisma.purchase.findUnique({
      where: { id: request.params.id },
      include: { items: { include: { unit: true, costLots: true } } },
    })
    if (!existing) return reply.status(404).send({ error: 'Purchase not found' })
    if (existing.status === 'CANCELLED') {
      return reply.status(400).send({ error: 'Purchase already cancelled' })
    }

    const deviceId = request.deviceId ?? 'server'

    await prisma.$transaction(async (tx) => {
      // Reverse inventory movements
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

        // Zero out cost lots
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

    return { success: true }
  })
}
