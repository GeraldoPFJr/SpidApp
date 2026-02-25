import { NextRequest, NextResponse } from 'next/server'
import { createProductSchema } from '@xpid/shared'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse, parseBody } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const searchParams = request.nextUrl.searchParams
    const active = searchParams.get('active')
    const categoryId = searchParams.get('category_id')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { deletedAt: null, tenantId: auth.tenantId }

    if (active !== null) where.active = active === 'true'
    if (categoryId) where.categoryId = categoryId
    if (search) where.name = { contains: search, mode: 'insensitive' }

    // Find the default price tier
    const defaultTier = await prisma.priceTier.findFirst({
      where: { isDefault: true, tenantId: auth.tenantId },
    })

    const products = await prisma.product.findMany({
      where,
      include: {
        units: { include: { prices: { include: { tier: true } } } },
        prices: true,
        category: true,
        subcategory: true,
      },
      orderBy: { name: 'asc' },
    })

    // Enrich each unit with the default tier price
    const enriched = products.map((product) => ({
      ...product,
      units: product.units.map((unit) => {
        const defaultPrice = unit.prices.find((p) => p.tierId === defaultTier?.id)
        return {
          ...unit,
          price: defaultPrice ? Number(defaultPrice.price) : null,
          prices: unit.prices,
        }
      }),
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error in GET /api/products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const result = await parseBody(request, createProductSchema)
    if ('error' in result) return result.error

    const { units, prices, ...productData } = result.data
    const tenantId = auth.tenantId

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: { ...productData, tenantId },
      })

      const createdUnits = await Promise.all(
        units.map((u) =>
          tx.productUnit.create({ data: { ...u, productId: created.id, tenantId } }),
        ),
      )

      if (prices?.length) {
        const sortOrderToId = new Map(createdUnits.map((u) => [u.sortOrder, u.id]))
        await Promise.all(
          prices.map((p) => {
            const unitId = sortOrderToId.get(p.unitSortOrder)
            if (!unitId) throw new Error(`Unit with sortOrder ${p.unitSortOrder} not found`)
            return tx.productPrice.create({
              data: { unitId, tierId: p.tierId, price: p.price, productId: created.id, tenantId },
            })
          }),
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
