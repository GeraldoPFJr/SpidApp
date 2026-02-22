import { NextRequest, NextResponse } from 'next/server'
import { syncPushSchema } from '@spid/shared'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { parseBody } from '@/lib/api-utils'

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

type EntityHandler = (
  action: string,
  payload: Record<string, unknown>,
  tx: TxClient,
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

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isAuthError(auth)) return auth

  const result = await parseBody(request, syncPushSchema)
  if ('error' in result) return result.error

  try {
    const { deviceId, operations } = result.data
    const handlers = buildEntityHandlers()

    let applied = 0
    let skipped = 0
    const errors: Array<{ operationId: string; error: string }> = []

    for (const op of operations) {
      try {
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
              tenantId: auth.tenantId,
            },
          })
        })

        applied++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        errors.push({ operationId: op.operationId, error: message })
      }
    }

    return NextResponse.json({ applied, skipped, errors })
  } catch (error) {
    console.error('Error in POST /api/sync/push:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
