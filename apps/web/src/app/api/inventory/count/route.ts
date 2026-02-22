import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse, parseBody } from '@/lib/api-utils'

const inventoryCountItemSchema = z.object({
  productId: z.string().uuid(),
  countedQtyBase: z.number().int().nonnegative(),
})

const inventoryCountSchema = z.object({
  items: z.array(inventoryCountItemSchema).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const result = await parseBody(request, inventoryCountSchema)
    if ('error' in result) return result.error

    const tenantId = auth.tenantId
    const deviceId = 'server'
    const now = new Date()

    const differences = await prisma.$transaction(async (tx) => {
      const results: Array<{
        productId: string
        currentQtyBase: number
        countedQtyBase: number
        difference: number
        direction: string
      }> = []

      for (const item of result.data.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, deletedAt: null, tenantId },
        })
        if (!product) continue

        const inSum = await tx.inventoryMovement.aggregate({
          where: { productId: item.productId, direction: 'IN', tenantId },
          _sum: { qtyBase: true },
        })
        const outSum = await tx.inventoryMovement.aggregate({
          where: { productId: item.productId, direction: 'OUT', tenantId },
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
              tenantId,
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

    return NextResponse.json(differences)
  } catch (error) {
    console.error('Error in POST /api/inventory/count:', error)
    const message = error instanceof Error ? error.message : 'Failed to process inventory count'
    return errorResponse(message, 500)
  }
}
