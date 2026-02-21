import type { FastifyInstance } from 'fastify'
import { createCustomerSchema, updateCustomerSchema } from '@spid/shared/schemas/index.js'
import { prisma } from '../lib/prisma.js'

export async function customersRoutes(app: FastifyInstance) {
  // GET /customers - list (exclude soft-deleted)
  app.get<{
    Querystring: { search?: string }
  }>('/', async (request) => {
    const { search } = request.query
    const where: Record<string, unknown> = { deletedAt: null }

    if (search) where.name = { contains: search, mode: 'insensitive' }

    return prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    })
  })

  // GET /customers/:id - by id with pending receivables
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const customer = await prisma.customer.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!customer) return reply.status(404).send({ error: 'Customer not found' })

    const receivables = await prisma.receivable.findMany({
      where: { customerId: customer.id, status: 'OPEN' },
      orderBy: { dueDate: 'asc' },
    })

    const totalOpen = receivables.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    )

    return { ...customer, receivables, totalOpen }
  })

  // POST /customers
  app.post('/', async (request, reply) => {
    const parsed = createCustomerSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    return reply.status(201).send(await prisma.customer.create({ data: parsed.data }))
  })

  // PUT /customers/:id
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const parsed = updateCustomerSchema.omit({ id: true }).safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const existing = await prisma.customer.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!existing) return reply.status(404).send({ error: 'Customer not found' })

    return prisma.customer.update({ where: { id: request.params.id }, data: parsed.data })
  })

  // DELETE /customers/:id - soft delete
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const existing = await prisma.customer.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!existing) return reply.status(404).send({ error: 'Customer not found' })

    await prisma.customer.update({
      where: { id: request.params.id },
      data: { deletedAt: new Date() },
    })
    return { success: true }
  })

  // GET /customers/:id/sales - sales history
  app.get<{ Params: { id: string } }>('/:id/sales', async (request, reply) => {
    const existing = await prisma.customer.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!existing) return reply.status(404).send({ error: 'Customer not found' })

    return prisma.sale.findMany({
      where: { customerId: request.params.id },
      include: { items: true, payments: true },
      orderBy: { date: 'desc' },
    })
  })

  // GET /customers/:id/receivables
  app.get<{ Params: { id: string } }>('/:id/receivables', async (request, reply) => {
    const existing = await prisma.customer.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!existing) return reply.status(404).send({ error: 'Customer not found' })

    return prisma.receivable.findMany({
      where: { customerId: request.params.id },
      include: { settlements: true },
      orderBy: { dueDate: 'asc' },
    })
  })
}
