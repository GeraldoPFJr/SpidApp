import { NextRequest, NextResponse } from 'next/server'
import { updateProductSchema } from '@spid/shared'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        units: { orderBy: { sortOrder: 'asc' } },
        prices: { include: { tier: true, unit: true } },
        category: true,
        subcategory: true,
      },
    })
    if (!product) return errorResponse('Product not found', 404)

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    const parsed = updateProductSchema.safeParse({ ...(body as object), id })
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) return errorResponse('Product not found', 404)

    const { id: _id, units: _units, prices: _prices, ...data } = parsed.data

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: { units: true, prices: true, category: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error in PUT /api/products/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) return errorResponse('Product not found', 404)

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/products/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
