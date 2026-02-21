import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

const productPriceBodySchema = z.object({
  unitId: z.string().uuid(),
  tierId: z.string().uuid(),
  price: z.number().nonnegative(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const result = await parseBody(request, productPriceBodySchema)
  if ('error' in result) return result.error

  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  })
  if (!product) return errorResponse('Product not found', 404)

  const existing = await prisma.productPrice.findFirst({
    where: {
      productId: id,
      unitId: result.data.unitId,
      tierId: result.data.tierId,
    },
  })

  if (existing) {
    const updated = await prisma.productPrice.update({
      where: { id: existing.id },
      data: { price: result.data.price },
    })
    return NextResponse.json(updated)
  }

  const created = await prisma.productPrice.create({
    data: { ...result.data, productId: id },
  })

  return NextResponse.json(created, { status: 201 })
}
