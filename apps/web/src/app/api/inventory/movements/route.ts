import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const productId = searchParams.get('product_id')
  const direction = searchParams.get('direction')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')

  const where: Record<string, unknown> = {}

  if (productId) where.productId = productId
  if (direction) where.direction = direction
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)
    where.date = dateFilter
  }

  const movements = await prisma.inventoryMovement.findMany({
    where,
    include: { product: true },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(movements)
}

export async function POST(request: NextRequest) {
  const result = await parseBody(request, createMovementSchema)
  if ('error' in result) return result.error

  const product = await prisma.product.findFirst({
    where: { id: result.data.productId, deletedAt: null },
  })
  if (!product) return errorResponse('Product not found', 404)

  const movement = await prisma.inventoryMovement.create({
    data: { ...result.data, deviceId: 'server' },
  })

  return NextResponse.json(movement, { status: 201 })
}
