import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createProductSchema, updateProductSchema } from '@spid/shared/schemas/index.js'
import { prisma } from '../lib/prisma.js'

const priceTierSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().default(false),
})

const productPriceBodySchema = z.object({
  unitId: z.string().uuid(),
  tierId: z.string().uuid(),
  price: z.number().nonnegative(),
})

const unitBodySchema = z.object({
  nameLabel: z.string().min(1),
  factorToBase: z.number().int().positive(),
  isSellable: z.boolean(),
  sortOrder: z.number().int().nonnegative().default(0),
})

export async function productsRoutes(app: FastifyInstance) {
  // GET /products - list with filters
  app.get<{
    Querystring: { active?: string; category_id?: string; search?: string }
  }>('/', async (request) => {
    const { active, category_id, search } = request.query
    const where: Record<string, unknown> = { deletedAt: null }

    if (active !== undefined) where.active = active === 'true'
    if (category_id) where.categoryId = category_id
    if (search) where.name = { contains: search, mode: 'insensitive' }

    return prisma.product.findMany({
      where,
      include: { units: true, prices: true, category: true, subcategory: true },
      orderBy: { name: 'asc' },
    })
  })

  // GET /products/:id - by id with full relations
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const product = await prisma.product.findFirst({
      where: { id: request.params.id, deletedAt: null },
      include: {
        units: { orderBy: { sortOrder: 'asc' } },
        prices: { include: { tier: true, unit: true } },
        category: true,
        subcategory: true,
      },
    })
    if (!product) return reply.status(404).send({ error: 'Product not found' })
    return product
  })

  // POST /products - create with units and prices
  app.post('/', async (request, reply) => {
    const parsed = createProductSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const { units, prices, ...productData } = parsed.data

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({ data: productData })

      const createdUnits = await Promise.all(
        units.map((u) => tx.productUnit.create({ data: { ...u, productId: created.id } })),
      )

      if (prices?.length) {
        await Promise.all(
          prices.map((p) => tx.productPrice.create({ data: { ...p, productId: created.id } })),
        )
      }

      return tx.product.findUnique({
        where: { id: created.id },
        include: { units: true, prices: true, category: true },
      })
    })

    return reply.status(201).send(product)
  })

  // PUT /products/:id - update
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const parsed = updateProductSchema.safeParse({ ...request.body as object, id: request.params.id })
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const existing = await prisma.product.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!existing) return reply.status(404).send({ error: 'Product not found' })

    const { id, units, prices, ...data } = parsed.data

    return prisma.product.update({
      where: { id: request.params.id },
      data,
      include: { units: true, prices: true, category: true },
    })
  })

  // DELETE /products/:id - soft delete
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const existing = await prisma.product.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!existing) return reply.status(404).send({ error: 'Product not found' })

    await prisma.product.update({
      where: { id: request.params.id },
      data: { deletedAt: new Date() },
    })
    return { success: true }
  })

  // POST /products/:id/units - add sellable unit
  app.post<{ Params: { id: string } }>('/:id/units', async (request, reply) => {
    const parsed = unitBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const product = await prisma.product.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!product) return reply.status(404).send({ error: 'Product not found' })

    return reply.status(201).send(
      await prisma.productUnit.create({ data: { ...parsed.data, productId: request.params.id } }),
    )
  })

  // PUT /products/units/:id - update unit
  app.put<{ Params: { id: string } }>('/units/:id', async (request, reply) => {
    const parsed = unitBodySchema.partial().safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const existing = await prisma.productUnit.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Unit not found' })

    return prisma.productUnit.update({ where: { id: request.params.id }, data: parsed.data })
  })

  // DELETE /products/units/:id - remove unit
  app.delete<{ Params: { id: string } }>('/units/:id', async (request, reply) => {
    const existing = await prisma.productUnit.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Unit not found' })

    await prisma.productUnit.delete({ where: { id: request.params.id } })
    return { success: true }
  })

  // GET /products/:id/stock - calculate current stock
  app.get<{ Params: { id: string } }>('/:id/stock', async (request, reply) => {
    const product = await prisma.product.findFirst({
      where: { id: request.params.id, deletedAt: null },
      include: { units: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!product) return reply.status(404).send({ error: 'Product not found' })

    const movements = await prisma.inventoryMovement.aggregate({
      where: { productId: request.params.id },
      _sum: { qtyBase: true },
    })

    // Calculate net: IN adds, OUT subtracts
    const inMovements = await prisma.inventoryMovement.aggregate({
      where: { productId: request.params.id, direction: 'IN' },
      _sum: { qtyBase: true },
    })
    const outMovements = await prisma.inventoryMovement.aggregate({
      where: { productId: request.params.id, direction: 'OUT' },
      _sum: { qtyBase: true },
    })

    const qtyBase = (inMovements._sum.qtyBase ?? 0) - (outMovements._sum.qtyBase ?? 0)

    const unitBreakdown = product.units.map((unit) => ({
      unitId: unit.id,
      nameLabel: unit.nameLabel,
      factorToBase: unit.factorToBase,
      available: Math.floor(qtyBase / unit.factorToBase),
    }))

    return { productId: product.id, productName: product.name, qtyBase, units: unitBreakdown }
  })

  // --- Price Tiers ---

  // GET /price-tiers - list
  app.get('/price-tiers', async () => {
    return prisma.priceTier.findMany({ orderBy: { name: 'asc' } })
  })

  // POST /price-tiers - create
  app.post('/price-tiers', async (request, reply) => {
    const parsed = priceTierSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    return reply.status(201).send(await prisma.priceTier.create({ data: parsed.data }))
  })

  // PUT /price-tiers/:id - update
  app.put<{ Params: { id: string } }>('/price-tiers/:id', async (request, reply) => {
    const parsed = priceTierSchema.partial().safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const existing = await prisma.priceTier.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Price tier not found' })

    return prisma.priceTier.update({ where: { id: request.params.id }, data: parsed.data })
  })

  // POST /products/:id/prices - set/update price
  app.post<{ Params: { id: string } }>('/:id/prices', async (request, reply) => {
    const parsed = productPriceBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const product = await prisma.product.findFirst({
      where: { id: request.params.id, deletedAt: null },
    })
    if (!product) return reply.status(404).send({ error: 'Product not found' })

    // Upsert: find existing price for same product+unit+tier
    const existing = await prisma.productPrice.findFirst({
      where: {
        productId: request.params.id,
        unitId: parsed.data.unitId,
        tierId: parsed.data.tierId,
      },
    })

    if (existing) {
      return prisma.productPrice.update({
        where: { id: existing.id },
        data: { price: parsed.data.price },
      })
    }

    return reply.status(201).send(
      await prisma.productPrice.create({
        data: { ...parsed.data, productId: request.params.id },
      }),
    )
  })
}
