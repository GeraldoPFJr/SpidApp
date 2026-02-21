import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const settleSchema = z.object({
  amount: z.number().positive(),
  accountId: z.string().uuid(),
  method: z.string().min(1),
  notes: z.string().max(500).optional(),
})

export async function receivablesRoutes(app: FastifyInstance) {
  // GET /receivables - list with filters
  app.get<{
    Querystring: {
      status?: string
      customer_id?: string
      due_date_from?: string
      due_date_to?: string
      overdue?: string
    }
  }>('/', async (request) => {
    const { status, customer_id, due_date_from, due_date_to, overdue } = request.query
    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (customer_id) where.customerId = customer_id

    if (due_date_from || due_date_to) {
      const dateFilter: Record<string, Date> = {}
      if (due_date_from) dateFilter.gte = new Date(due_date_from)
      if (due_date_to) dateFilter.lte = new Date(due_date_to)
      where.dueDate = dateFilter
    }

    if (overdue === 'true') {
      where.status = 'OPEN'
      where.dueDate = { lt: new Date() }
    }

    return prisma.receivable.findMany({
      where,
      include: { customer: true, sale: true, settlements: true },
      orderBy: { dueDate: 'asc' },
    })
  })

  // GET /receivables/:id - by id with details
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const receivable = await prisma.receivable.findUnique({
      where: { id: request.params.id },
      include: {
        customer: true,
        sale: true,
        settlements: { include: { payment: true } },
      },
    })
    if (!receivable) return reply.status(404).send({ error: 'Receivable not found' })
    return receivable
  })

  // POST /receivables/:id/settle - register partial or full payment
  app.post<{ Params: { id: string } }>('/:id/settle', async (request, reply) => {
    const parsed = settleSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const receivable = await prisma.receivable.findUnique({
      where: { id: request.params.id },
      include: { settlements: true },
    })
    if (!receivable) return reply.status(404).send({ error: 'Receivable not found' })
    if (receivable.status !== 'OPEN') {
      return reply.status(400).send({ error: 'Receivable is not open' })
    }

    const now = new Date()
    const totalSettled = receivable.settlements.reduce(
      (sum, s) => sum + Number(s.amount),
      0,
    )
    const remaining = Number(receivable.amount) - totalSettled

    if (parsed.data.amount > remaining + 0.01) {
      return reply.status(400).send({ error: `Amount exceeds remaining (${remaining.toFixed(2)})` })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          saleId: receivable.saleId,
          date: now,
          method: parsed.data.method,
          amount: parsed.data.amount,
          accountId: parsed.data.accountId,
          notes: parsed.data.notes,
        },
      })

      // Create settlement
      await tx.receivableSettlement.create({
        data: {
          receivableId: receivable.id,
          paymentId: payment.id,
          amount: parsed.data.amount,
          paidAt: now,
        },
      })

      // Check if fully paid
      const newTotalSettled = totalSettled + parsed.data.amount
      const isPaid = newTotalSettled >= Number(receivable.amount) - 0.01

      if (isPaid) {
        await tx.receivable.update({
          where: { id: receivable.id },
          data: { status: 'PAID' },
        })
      }

      // Create finance entry
      await tx.financeEntry.create({
        data: {
          type: 'INCOME',
          accountId: parsed.data.accountId,
          amount: parsed.data.amount,
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

    return result
  })

  // GET /receivables/overdue - overdue grouped by customer
  app.get('/overdue', async () => {
    const overdueReceivables = await prisma.receivable.findMany({
      where: {
        status: 'OPEN',
        dueDate: { lt: new Date() },
      },
      include: { customer: true, sale: true },
      orderBy: { dueDate: 'asc' },
    })

    // Group by customer
    const grouped = new Map<string, {
      customerId: string
      customerName: string
      totalOpen: number
      invoiceCount: number
      maxDaysOverdue: number
      lastPurchaseDate: Date | null
      receivables: typeof overdueReceivables
    }>()

    const now = new Date()

    for (const r of overdueReceivables) {
      const key = r.customerId
      const existing = grouped.get(key)
      const daysOverdue = Math.floor(
        (now.getTime() - r.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (existing) {
        existing.totalOpen += Number(r.amount)
        existing.invoiceCount += 1
        existing.maxDaysOverdue = Math.max(existing.maxDaysOverdue, daysOverdue)
        existing.receivables.push(r)
      } else {
        // Find last purchase (sale) date for this customer
        const lastSale = await prisma.sale.findFirst({
          where: { customerId: key, status: 'CONFIRMED' },
          orderBy: { date: 'desc' },
          select: { date: true },
        })

        grouped.set(key, {
          customerId: key,
          customerName: r.customer.name,
          totalOpen: Number(r.amount),
          invoiceCount: 1,
          maxDaysOverdue: daysOverdue,
          lastPurchaseDate: lastSale?.date ?? null,
          receivables: [r],
        })
      }
    }

    // Sort by max days overdue desc
    return Array.from(grouped.values()).sort(
      (a, b) => b.maxDaysOverdue - a.maxDaysOverdue,
    )
  })
}
