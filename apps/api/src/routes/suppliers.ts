import type { FastifyInstance } from 'fastify'
import { createSupplierSchema, updateSupplierSchema } from '@vendi/shared/schemas/index.js'
import { prisma } from '../lib/prisma.js'

export async function suppliersRoutes(app: FastifyInstance) {
  // GET /suppliers - list (exclude soft-deleted)
  app.get<{
    Querystring: { search?: string }
  }>('/', async (request) => {
    const { search } = request.query
    const where: Record<string, unknown> = { deletedAt: null }

    if (search) where.name = { contains: search, mode: 'insensitive' }

    return prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    })
  })

  // GET /suppliers/:id
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const supplier = await prisma.supplier.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!supplier) return reply.status(404).send({ error: 'Supplier not found' })
    return supplier
  })

  // POST /suppliers
  app.post('/', async (request, reply) => {
    const parsed = createSupplierSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    return reply.status(201).send(await prisma.supplier.create({ data: parsed.data }))
  })

  // PUT /suppliers/:id
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const parsed = updateSupplierSchema.omit({ id: true }).safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const existing = await prisma.supplier.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!existing) return reply.status(404).send({ error: 'Supplier not found' })

    return prisma.supplier.update({ where: { id: request.params.id }, data: parsed.data })
  })

  // DELETE /suppliers/:id - soft delete
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const existing = await prisma.supplier.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!existing) return reply.status(404).send({ error: 'Supplier not found' })

    await prisma.supplier.update({
      where: { id: request.params.id },
      data: { deletedAt: new Date() },
    })
    return { success: true }
  })

  // GET /suppliers/:id/purchases - purchase history
  app.get<{ Params: { id: string } }>('/:id/purchases', async (request, reply) => {
    const existing = await prisma.supplier.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!existing) return reply.status(404).send({ error: 'Supplier not found' })

    return prisma.purchase.findMany({
      where: { supplierId: request.params.id },
      include: { items: true, costs: true },
      orderBy: { date: 'desc' },
    })
  })
}
