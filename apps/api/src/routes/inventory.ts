import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const createMovementSchema = z.object({
  productId: z.string().uuid(),
  date: z.coerce.date(),
  direction: z.enum(['IN', 'OUT']),
  qtyBase: z.number().int().positive(),
  reasonType: z.enum([
    'ADJUSTMENT',
    'LOSS',
    'CONSUMPTION',
    'DONATION',
    'RETURN',
    'INVENTORY_COUNT',
  ]),
  notes: z.string().max(500).optional(),
})

const inventoryCountItemSchema = z.object({
  productId: z.string().uuid(),
  countedQtyBase: z.number().int().nonnegative(),
})

const inventoryCountSchema = z.object({
  items: z.array(inventoryCountItemSchema).min(1),
})

async function getProductStockBase(productId: string): Promise<number> {
  const inSum = await prisma.inventoryMovement.aggregate({
    where: { productId, direction: 'IN' },
    _sum: { qtyBase: true },
  })
  const outSum = await prisma.inventoryMovement.aggregate({
    where: { productId, direction: 'OUT' },
    _sum: { qtyBase: true },
  })
  return (inSum._sum.qtyBase ?? 0) - (outSum._sum.qtyBase ?? 0)
}

export async function inventoryRoutes(app: FastifyInstance) {
  // GET /inventory/movements - list with filters
  app.get<{
    Querystring: { product_id?: string; direction?: string; date_from?: string; date_to?: string }
  }>('/movements', async (request) => {
    const { product_id, direction, date_from, date_to } = request.query
    const where: Record<string, unknown> = {}

    if (product_id) where.productId = product_id
    if (direction) where.direction = direction
    if (date_from || date_to) {
      const dateFilter: Record<string, Date> = {}
      if (date_from) dateFilter.gte = new Date(date_from)
      if (date_to) dateFilter.lte = new Date(date_to)
      where.date = dateFilter
    }

    return prisma.inventoryMovement.findMany({
      where,
      include: { product: true },
      orderBy: { date: 'desc' },
    })
  })

  // POST /inventory/movements - create manual movement
  app.post('/movements', async (request, reply) => {
    const parsed = createMovementSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, deletedAt: null },
    })
    if (!product) return reply.status(404).send({ error: 'Product not found' })

    const deviceId = request.deviceId ?? 'server'

    return reply.status(201).send(
      await prisma.inventoryMovement.create({
        data: { ...parsed.data, deviceId },
      }),
    )
  })

  // GET /inventory/stock - stock of all products
  app.get('/stock', async () => {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: { units: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    })

    const result = await Promise.all(
      products.map(async (product) => {
        const qtyBase = await getProductStockBase(product.id)

        const units = product.units.map((unit) => ({
          unitId: unit.id,
          nameLabel: unit.nameLabel,
          factorToBase: unit.factorToBase,
          available: Math.floor(qtyBase / unit.factorToBase),
        }))

        return {
          productId: product.id,
          productName: product.name,
          qtyBase,
          minStock: product.minStock,
          belowMin: product.minStock !== null && qtyBase < product.minStock,
          units,
        }
      }),
    )

    return result
  })

  // GET /inventory/stock/:productId - stock of a single product
  app.get<{ Params: { productId: string } }>('/stock/:productId', async (request, reply) => {
    const product = await prisma.product.findFirst({
      where: { id: request.params.productId, deletedAt: null },
      include: { units: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!product) return reply.status(404).send({ error: 'Product not found' })

    const qtyBase = await getProductStockBase(product.id)

    const units = product.units.map((unit) => ({
      unitId: unit.id,
      nameLabel: unit.nameLabel,
      factorToBase: unit.factorToBase,
      available: Math.floor(qtyBase / unit.factorToBase),
    }))

    return {
      productId: product.id,
      productName: product.name,
      qtyBase,
      minStock: product.minStock,
      belowMin: product.minStock !== null && qtyBase < product.minStock,
      units,
    }
  })

  // POST /inventory/count - inventory count
  app.post('/count', async (request, reply) => {
    const parsed = inventoryCountSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const deviceId = request.deviceId ?? 'server'
    const now = new Date()

    const differences = await prisma.$transaction(async (tx) => {
      const results: Array<{
        productId: string
        currentQtyBase: number
        countedQtyBase: number
        difference: number
        direction: string
      }> = []

      for (const item of parsed.data.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, deletedAt: null },
        })
        if (!product) continue

        // Calculate current stock
        const inSum = await tx.inventoryMovement.aggregate({
          where: { productId: item.productId, direction: 'IN' },
          _sum: { qtyBase: true },
        })
        const outSum = await tx.inventoryMovement.aggregate({
          where: { productId: item.productId, direction: 'OUT' },
          _sum: { qtyBase: true },
        })
        const currentQtyBase = (inSum._sum.qtyBase ?? 0) - (outSum._sum.qtyBase ?? 0)
        const difference = item.countedQtyBase - currentQtyBase

        if (difference !== 0) {
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              date: now,
              direction: difference > 0 ? 'IN' : 'OUT',
              qtyBase: Math.abs(difference),
              reasonType: 'INVENTORY_COUNT',
              notes: `Inventario: contado ${item.countedQtyBase}, sistema ${currentQtyBase}`,
              deviceId,
            },
          })
        }

        results.push({
          productId: item.productId,
          currentQtyBase,
          countedQtyBase: item.countedQtyBase,
          difference,
          direction: difference > 0 ? 'IN' : difference < 0 ? 'OUT' : 'NONE',
        })
      }

      return results
    })

    return differences
  })
}
