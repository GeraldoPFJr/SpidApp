import { NextRequest, NextResponse } from 'next/server'
import { createProductSchema } from '@spid/shared'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const active = searchParams.get('active')
    const categoryId = searchParams.get('category_id')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { deletedAt: null }

    if (active !== null) where.active = active === 'true'
    if (categoryId) where.categoryId = categoryId
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const products = await prisma.product.findMany({
      where,
      include: { units: true, prices: true, category: true, subcategory: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error in GET /api/products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseBody(request, createProductSchema)
    if ('error' in result) return result.error

    const { units, prices, ...productData } = result.data

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({ data: productData })

      await Promise.all(
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

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/products:', error)
    const message = error instanceof Error ? error.message : 'Failed to create product'
    return errorResponse(message, 500)
  }
}
