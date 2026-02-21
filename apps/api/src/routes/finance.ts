import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createFinanceEntrySchema } from '@spid/shared/schemas/index.js'
import { prisma } from '../lib/prisma.js'

const accountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['CASH', 'BANK', 'OTHER']),
  active: z.boolean().default(true),
})

const financeCategorySchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  name: z.string().min(1).max(100),
})

const closureSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  accountId: z.string().uuid(),
  countedClosing: z.number().optional(),
  notes: z.string().max(1000).optional(),
})

export async function financeRoutes(app: FastifyInstance) {
  // --- Accounts CRUD ---

  app.get('/accounts', async () => {
    return prisma.account.findMany({ orderBy: { name: 'asc' } })
  })

  app.get<{ Params: { id: string } }>('/accounts/:id', async (request, reply) => {
    const account = await prisma.account.findUnique({ where: { id: request.params.id } })
    if (!account) return reply.status(404).send({ error: 'Account not found' })
    return account
  })

  app.post('/accounts', async (request, reply) => {
    const parsed = accountSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })
    return reply.status(201).send(await prisma.account.create({ data: parsed.data }))
  })

  app.put<{ Params: { id: string } }>('/accounts/:id', async (request, reply) => {
    const parsed = accountSchema.partial().safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const existing = await prisma.account.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Account not found' })

    return prisma.account.update({ where: { id: request.params.id }, data: parsed.data })
  })

  app.delete<{ Params: { id: string } }>('/accounts/:id', async (request, reply) => {
    const existing = await prisma.account.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Account not found' })

    await prisma.account.update({ where: { id: request.params.id }, data: { active: false } })
    return { success: true }
  })

  // --- Finance Categories CRUD ---

  app.get('/categories', async () => {
    return prisma.financeCategory.findMany({ orderBy: { name: 'asc' } })
  })

  app.post('/categories', async (request, reply) => {
    const parsed = financeCategorySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })
    return reply.status(201).send(await prisma.financeCategory.create({ data: parsed.data }))
  })

  app.put<{ Params: { id: string } }>('/categories/:id', async (request, reply) => {
    const parsed = financeCategorySchema.partial().safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const existing = await prisma.financeCategory.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Finance category not found' })

    return prisma.financeCategory.update({ where: { id: request.params.id }, data: parsed.data })
  })

  app.delete<{ Params: { id: string } }>('/categories/:id', async (request, reply) => {
    const existing = await prisma.financeCategory.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Finance category not found' })

    await prisma.financeCategory.delete({ where: { id: request.params.id } })
    return { success: true }
  })

  // --- Finance Entries ---

  // GET /finance/entries - list with filters
  app.get<{
    Querystring: {
      type?: string
      status?: string
      account_id?: string
      date_from?: string
      date_to?: string
    }
  }>('/entries', async (request) => {
    const { type, status, account_id, date_from, date_to } = request.query
    const where: Record<string, unknown> = {}

    if (type) where.type = type
    if (status) where.status = status
    if (account_id) where.accountId = account_id

    if (date_from || date_to) {
      const dateFilter: Record<string, Date> = {}
      if (date_from) dateFilter.gte = new Date(date_from)
      if (date_to) dateFilter.lte = new Date(date_to)
      where.createdAt = dateFilter
    }

    return prisma.financeEntry.findMany({
      where,
      include: { category: true, account: true },
      orderBy: { createdAt: 'desc' },
    })
  })

  // POST /finance/entries - create entry
  app.post('/entries', async (request, reply) => {
    const parsed = createFinanceEntrySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    return reply.status(201).send(
      await prisma.financeEntry.create({
        data: parsed.data,
        include: { category: true, account: true },
      }),
    )
  })

  // PUT /finance/entries/:id - update
  app.put<{ Params: { id: string } }>('/entries/:id', async (request, reply) => {
    const parsed = createFinanceEntrySchema.partial().safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const existing = await prisma.financeEntry.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Finance entry not found' })

    return prisma.financeEntry.update({
      where: { id: request.params.id },
      data: parsed.data,
      include: { category: true, account: true },
    })
  })

  // POST /finance/entries/:id/pay - mark as paid
  app.post<{ Params: { id: string } }>('/entries/:id/pay', async (request, reply) => {
    const existing = await prisma.financeEntry.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Finance entry not found' })
    if (existing.status === 'PAID') {
      return reply.status(400).send({ error: 'Entry already paid' })
    }

    return prisma.financeEntry.update({
      where: { id: request.params.id },
      data: { status: 'PAID', paidAt: new Date() },
      include: { category: true, account: true },
    })
  })

  // GET /finance/entries/due - list overdue (SCHEDULED -> DUE)
  app.get('/entries/due', async () => {
    const now = new Date()

    // Update scheduled entries that are past due date
    await prisma.financeEntry.updateMany({
      where: {
        status: 'SCHEDULED',
        dueDate: { lte: now },
      },
      data: { status: 'DUE' },
    })

    return prisma.financeEntry.findMany({
      where: { status: 'DUE' },
      include: { category: true, account: true },
      orderBy: { dueDate: 'asc' },
    })
  })

  // --- Monthly Closure ---

  // POST /finance/closures - create monthly closure
  app.post('/closures', async (request, reply) => {
    const parsed = closureSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const { month, accountId, countedClosing, notes } = parsed.data

    // Parse month to get date range
    const [yearStr, monthStr] = month.split('-')
    const year = parseInt(yearStr!, 10)
    const monthNum = parseInt(monthStr!, 10)
    const startOfMonth = new Date(year, monthNum - 1, 1)
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999)

    // Get previous closure or default to 0
    const previousClosure = await prisma.monthlyClosure.findFirst({
      where: { accountId },
      orderBy: { month: 'desc' },
    })
    const openingBalance = previousClosure
      ? Number(previousClosure.countedClosing ?? previousClosure.expectedClosing)
      : 0

    // Calculate entries for the month
    const paidEntries = await prisma.financeEntry.findMany({
      where: {
        accountId,
        status: 'PAID',
        paidAt: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    let totalIncome = 0
    let totalExpense = 0

    for (const entry of paidEntries) {
      const amount = Number(entry.amount)
      if (entry.type === 'INCOME' || entry.type === 'APORTE') {
        totalIncome += amount
      } else if (entry.type === 'EXPENSE' || entry.type === 'RETIRADA') {
        totalExpense += amount
      }
    }

    const expectedClosing = openingBalance + totalIncome - totalExpense

    const closure = await prisma.monthlyClosure.create({
      data: {
        month,
        accountId,
        openingBalance,
        expectedClosing,
        countedClosing: countedClosing ?? null,
        notes: notes ?? null,
      },
      include: { account: true },
    })

    return reply.status(201).send({
      ...closure,
      totalIncome,
      totalExpense,
      difference: countedClosing !== undefined ? countedClosing - expectedClosing : null,
    })
  })

  // GET /finance/closures
  app.get<{
    Querystring: { account_id?: string }
  }>('/closures', async (request) => {
    const { account_id } = request.query
    const where: Record<string, unknown> = {}
    if (account_id) where.accountId = account_id

    return prisma.monthlyClosure.findMany({
      where,
      include: { account: true },
      orderBy: { month: 'desc' },
    })
  })
}
