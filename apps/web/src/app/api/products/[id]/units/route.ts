import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse, parseBody } from '@/lib/api-utils'

const unitBodySchema = z.object({
  nameLabel: z.string().min(1),
  factorToBase: z.number().int().positive(),
  isSellable: z.boolean(),
  sortOrder: z.number().int().nonnegative().default(0),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params
    const result = await parseBody(request, unitBodySchema)
    if ('error' in result) return result.error

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null, tenantId: auth.tenantId },
    })
    if (!product) return errorResponse('Product not found', 404)

    const unit = await prisma.productUnit.create({
      data: { ...result.data, productId: id, tenantId: auth.tenantId },
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/products/[id]/units:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
