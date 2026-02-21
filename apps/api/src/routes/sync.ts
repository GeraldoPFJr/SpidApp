import type { FastifyInstance } from 'fastify'
import { syncPushSchema } from '@vendi/shared/schemas/index.js'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

type EntityHandler = (
  action: string,
  payload: Record<string, unknown>,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
) => Promise<void>

function buildEntityHandlers(): Record<string, EntityHandler> {
  return {
    product: async (action, payload, tx) => {
      if (action === 'create') {
        await tx.product.create({ data: payload as never })
      } else if (action === 'update') {
        const { id, ...data } = payload
        await tx.product.update({ where: { id: id as string }, data: data as never })
      } else if (action === 'delete') {
        await tx.product.update({
          where: { id: payload.id as string },
          data: { deletedAt: new Date() },
        })
      }
    },
    customer: async (action, payload, tx) => {
      if (action === 'create') {
        await tx.customer.create({ data: payload as never })
      } else if (action === 'update') {
        const { id, ...data } = payload
        await tx.customer.update({ where: { id: id as string }, data: data as never })
      } else if (action === 'delete') {
        await tx.customer.update({
          where: { id: payload.id as string },
          data: { deletedAt: new Date() },
        })
      }
    },
    supplier: async (action, payload, tx) => {
      if (action === 'create') {
        await tx.supplier.create({ data: payload as never })
      } else if (action === 'update') {
        const { id, ...data } = payload
        await tx.supplier.update({ where: { id: id as string }, data: data as never })
      } else if (action === 'delete') {
        await tx.supplier.update({
          where: { id: payload.id as string },
          data: { deletedAt: new Date() },
        })
      }
    },
    category: async (action, payload, tx) => {
      if (action === 'create') {
        await tx.category.create({ data: payload as never })
      } else if (action === 'update') {
        const { id, ...data } = payload
        await tx.category.update({ where: { id: id as string }, data: data as never })
      } else if (action === 'delete') {
        await tx.category.delete({ where: { id: payload.id as string } })
      }
    },
    subcategory: async (action, payload, tx) => {
      if (action === 'create') {
        await tx.subcategory.create({ data: payload as never })
      } else if (action === 'update') {
        const { id, ...data } = payload
        await tx.subcategory.update({ where: { id: id as string }, data: data as never })
      } else if (action === 'delete') {
        await tx.subcategory.delete({ where: { id: payload.id as string } })
      }
    },
  }
}

export async function syncRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware)

  // POST /sync/push - receive offline operations
  app.post('/push', async (request, reply) => {
    const parsed = syncPushSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const { deviceId, operations } = parsed.data
    const handlers = buildEntityHandlers()

    let applied = 0
    let skipped = 0
    const errors: Array<{ operationId: string; error: string }> = []

    for (const op of operations) {
      try {
        // Check deduplication
        const existing = await prisma.outboxOperation.findUnique({
          where: { operationId: op.operationId },
        })

        if (existing) {
          skipped++
          continue
        }

        const handler = handlers[op.entityType]
        if (!handler) {
          errors.push({ operationId: op.operationId, error: `Unknown entity type: ${op.entityType}` })
          continue
        }

        await prisma.$transaction(async (tx) => {
          await handler(op.action, op.payload as Record<string, unknown>, tx)

          await tx.outboxOperation.create({
            data: {
              operationId: op.operationId,
              entityType: op.entityType,
              action: op.action,
              payload: op.payload as object,
              deviceId,
              syncedAt: new Date(),
            },
          })
        })

        applied++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        errors.push({ operationId: op.operationId, error: message })
      }
    }

    return { applied, skipped, errors }
  })

  // GET /sync/pull - return changes since cursor
  app.get<{
    Querystring: { device_id?: string; since?: string }
  }>('/pull', async (request) => {
    const { device_id, since } = request.query
    const sinceDate = since ? new Date(since) : new Date(0)

    // Fetch updated records from all entity tables
    const [products, customers, suppliers, categories, subcategories, sales, receivables] =
      await Promise.all([
        prisma.product.findMany({ where: { updatedAt: { gt: sinceDate } } }),
        prisma.customer.findMany({ where: { updatedAt: { gt: sinceDate } } }),
        prisma.supplier.findMany({ where: { updatedAt: { gt: sinceDate } } }),
        prisma.category.findMany({ where: { updatedAt: { gt: sinceDate } } }),
        prisma.subcategory.findMany({ where: { updatedAt: { gt: sinceDate } } }),
        prisma.sale.findMany({
          where: { updatedAt: { gt: sinceDate } },
          include: { items: true, payments: true },
        }),
        prisma.receivable.findMany({ where: { updatedAt: { gt: sinceDate } } }),
      ])

    const now = new Date().toISOString()

    // Update sync cursor for this device
    if (device_id) {
      await prisma.syncCursor.upsert({
        where: { deviceId: device_id },
        update: { lastCursor: new Date() },
        create: { deviceId: device_id, lastCursor: new Date() },
      })
    }

    return {
      products,
      customers,
      suppliers,
      categories,
      subcategories,
      sales,
      receivables,
      cursor: now,
    }
  })
}
