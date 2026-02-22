import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { units: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!product) return errorResponse('Product not found', 404)

    const inMovements = await prisma.inventoryMovement.aggregate({
      where: { productId: id, direction: 'IN' },
      _sum: { qtyBase: true },
    })
    const outMovements = await prisma.inventoryMovement.aggregate({
      where: { productId: id, direction: 'OUT' },
      _sum: { qtyBase: true },
    })

    const qtyBase = (inMovements._sum.qtyBase ?? 0) - (outMovements._sum.qtyBase ?? 0)

    const unitBreakdown = product.units.map((unit) => ({
      unitId: unit.id,
      nameLabel: unit.nameLabel,
      factorToBase: unit.factorToBase,
      available: Math.floor(qtyBase / unit.factorToBase),
    }))

    return NextResponse.json({
      productId: product.id,
      productName: product.name,
      qtyBase,
      units: unitBreakdown,
    })
  } catch (error) {
    console.error('Error in GET /api/products/[id]/stock:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
