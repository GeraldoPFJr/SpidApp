import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createSaleSchema } from '@vendi/shared/schemas/index.js'
import {
  convertToBase,
  generateInstallments,
  generateCouponNumber,
} from '@vendi/shared/utils/index.js'
import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

const cancelSaleSchema = z.object({
  merchandiseAction: z.string().min(1),
  merchandiseNotes: z.string().optional(),
  moneyAction: z.string().min(1),
  moneyNotes: z.string().optional(),
})

const IMMEDIATE_METHODS = ['CASH', 'PIX', 'DEBIT_CARD']

async function getNextCouponNumber(tx: TxClient): Promise<number> {
  const lastSale = await tx.sale.findFirst({
    where: { couponNumber: { not: null } },
    orderBy: { couponNumber: 'desc' },
    select: { couponNumber: true },
  })
  return generateCouponNumber(lastSale?.couponNumber ?? 0)
}

async function consumeFIFO(
  tx: TxClient,
  productId: string,
  qtyBase: number,
): Promise<number> {
  const lots = await tx.costLot.findMany({
    where: { productId, qtyRemainingBase: { gt: 0 } },
    orderBy: { createdAt: 'asc' },
  })

  let remaining = qtyBase
  let totalCost = 0

  for (const lot of lots) {
    if (remaining <= 0) break

    const take = Math.min(lot.qtyRemainingBase, remaining)
    const cost = take * Number(lot.unitCostBase)
    totalCost += cost
    remaining -= take

    await tx.costLot.update({
      where: { id: lot.id },
      data: { qtyRemainingBase: lot.qtyRemainingBase - take },
    })
  }

  return totalCost
}

async function confirmSale(
  tx: TxClient,
  saleId: string,
  items: Array<{ productId: string; unitId: string; qty: number; unitPrice: number; total: number }>,
  payments: Array<{
    method: string
    amount: number
    accountId: string
    cardType?: string | null
    installments?: number | null
    installmentIntervalDays?: number | null
  }> | undefined,
  saleDate: Date,
  customerId: string | null | undefined,
  deviceId: string,
) {
  // 1. Inventory movements + FIFO for each item
  for (const item of items) {
    const unit = await tx.productUnit.findUnique({ where: { id: item.unitId } })
    if (!unit) throw new Error(`Unit ${item.unitId} not found`)

    const qtyBase = convertToBase(item.qty, unit.factorToBase)

    await tx.inventoryMovement.create({
      data: {
        productId: item.productId,
        date: saleDate,
        direction: 'OUT',
        qtyBase,
        reasonType: 'SALE',
        reasonId: saleId,
        deviceId,
      },
    })

    // Consume FIFO cost lots
    await consumeFIFO(tx, item.productId, qtyBase)
  }

  // 2. Generate coupon number
  const couponNumber = await getNextCouponNumber(tx)
  await tx.sale.update({
    where: { id: saleId },
    data: { status: 'CONFIRMED', couponNumber },
  })

  // 3. Process payments
  if (payments?.length) {
    for (const pmt of payments) {
      const isImmediate = IMMEDIATE_METHODS.includes(pmt.method)
      const isCreditNoInstallments = pmt.method === 'CREDIT_CARD' && (!pmt.installments || pmt.installments <= 1)

      if (isImmediate || isCreditNoInstallments) {
        // Immediate payment
        await tx.payment.create({
          data: {
            saleId,
            date: saleDate,
            method: pmt.method,
            amount: pmt.amount,
            accountId: pmt.accountId,
            cardType: pmt.cardType,
          },
        })

        await tx.financeEntry.create({
          data: {
            type: 'INCOME',
            accountId: pmt.accountId,
            amount: pmt.amount,
            status: 'PAID',
            paidAt: saleDate,
            notes: `Venda cupom #${couponNumber}`,
          },
        })
      } else if (pmt.method === 'CREDIT_CARD' && pmt.installments && pmt.installments > 1) {
        // Credit card installments -> receivables
        const installments = generateInstallments(
          pmt.amount,
          pmt.installments,
          30,
          saleDate,
        )

        for (const inst of installments) {
          if (!customerId) throw new Error('Customer required for installment payments')
          await tx.receivable.create({
            data: {
              saleId,
              customerId,
              dueDate: inst.dueDate,
              amount: inst.amount,
              status: 'OPEN',
              kind: 'CARD_INSTALLMENT',
            },
          })
        }
      } else {
        // Crediario, boleto, cheque -> receivables with installments
        if (!customerId) throw new Error('Customer required for credit payments')

        const count = pmt.installments ?? 1
        const intervalDays = pmt.installmentIntervalDays ?? 30
        const installments = generateInstallments(pmt.amount, count, intervalDays, saleDate)

        const kindMap: Record<string, string> = {
          CREDIARIO: 'CREDIARIO',
          BOLETO: 'BOLETO',
          CHEQUE: 'CHEQUE',
        }

        for (const inst of installments) {
          await tx.receivable.create({
            data: {
              saleId,
              customerId,
              dueDate: inst.dueDate,
              amount: inst.amount,
              status: 'OPEN',
              kind: kindMap[pmt.method] ?? 'CREDIARIO',
            },
          })
        }
      }
    }
  }
}

export async function salesRoutes(app: FastifyInstance) {
  // GET /sales - list with filters
  app.get<{
    Querystring: { status?: string; customer_id?: string; date_from?: string; date_to?: string }
  }>('/', async (request) => {
    const { status, customer_id, date_from, date_to } = request.query
    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (customer_id) where.customerId = customer_id
    if (date_from || date_to) {
      const dateFilter: Record<string, Date> = {}
      if (date_from) dateFilter.gte = new Date(date_from)
      if (date_to) dateFilter.lte = new Date(date_to)
      where.date = dateFilter
    }

    return prisma.sale.findMany({
      where,
      include: { customer: true, items: true, payments: true },
      orderBy: { date: 'desc' },
    })
  })

  // GET /sales/:id - by id with full relations
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const sale = await prisma.sale.findUnique({
      where: { id: request.params.id },
      include: {
        customer: true,
        items: { include: { product: true, unit: true } },
        payments: true,
        receivables: { include: { settlements: true } },
      },
    })
    if (!sale) return reply.status(404).send({ error: 'Sale not found' })
    return sale
  })

  // POST /sales - create sale (DRAFT or CONFIRMED)
  app.post('/', async (request, reply) => {
    const parsed = createSaleSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const { items, payments, ...headerData } = parsed.data
    const deviceId = headerData.deviceId

    const result = await prisma.$transaction(async (tx) => {
      // Create sale header + items
      const sale = await tx.sale.create({
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

      // If CONFIRMED, do full flow
      if (headerData.status === 'CONFIRMED') {
        await confirmSale(tx, sale.id, items, payments, sale.date, headerData.customerId, deviceId)
      }

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

    return reply.status(201).send(result)
  })

  // PUT /sales/:id - update (only draft)
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const sale = await prisma.sale.findUnique({ where: { id: request.params.id } })
    if (!sale) return reply.status(404).send({ error: 'Sale not found' })
    if (sale.status !== 'DRAFT') {
      return reply.status(400).send({ error: 'Only draft sales can be updated' })
    }

    const body = request.body as {
      customerId?: string | null
      notes?: string | null
      subtotal?: number
      discount?: number
      surcharge?: number
      freight?: number
      total?: number
      items?: Array<{ productId: string; unitId: string; qty: number; unitPrice: number; total: number }>
    }

    const result = await prisma.$transaction(async (tx) => {
      if (body.items) {
        await tx.saleItem.deleteMany({ where: { saleId: sale.id } })
        for (const item of body.items) {
          await tx.saleItem.create({ data: { ...item, saleId: sale.id } })
        }
      }

      const { items: _, ...updateData } = body
      return tx.sale.update({
        where: { id: sale.id },
        data: updateData,
        include: {
          customer: true,
          items: { include: { product: true, unit: true } },
        },
      })
    })

    return result
  })

  // POST /sales/:id/confirm - confirm a draft
  app.post<{ Params: { id: string } }>('/:id/confirm', async (request, reply) => {
    const sale = await prisma.sale.findUnique({
      where: { id: request.params.id },
      include: { items: true },
    })
    if (!sale) return reply.status(404).send({ error: 'Sale not found' })
    if (sale.status !== 'DRAFT') {
      return reply.status(400).send({ error: 'Only draft sales can be confirmed' })
    }

    const body = request.body as {
      payments?: Array<{
        method: string
        amount: number
        accountId: string
        cardType?: string | null
        installments?: number | null
        installmentIntervalDays?: number | null
      }>
    } | undefined

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

    return result
  })

  // POST /sales/:id/cancel - cancel sale with questionnaire
  app.post<{ Params: { id: string } }>('/:id/cancel', async (request, reply) => {
    const parsed = cancelSaleSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const sale = await prisma.sale.findUnique({
      where: { id: request.params.id },
      include: { items: { include: { unit: true } }, payments: true, receivables: true },
    })
    if (!sale) return reply.status(404).send({ error: 'Sale not found' })
    if (sale.status === 'CANCELLED') {
      return reply.status(400).send({ error: 'Sale already cancelled' })
    }

    const { merchandiseAction, merchandiseNotes, moneyAction, moneyNotes } = parsed.data
    const deviceId = sale.deviceId

    const result = await prisma.$transaction(async (tx) => {
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
          // 'credit' or 'other' -> no inventory movement
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

      // Handle money
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

    return result
  })
}
