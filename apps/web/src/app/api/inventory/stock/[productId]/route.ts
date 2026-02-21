import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ productId: string }> }

async function getProductStockBase(productId: string): Promise<number> {
  const inSum = await prisma.inventoryMovement.aggregate({
    where: { productId, direction: 'IN' },
    _sum: { qtyBase: true },
  })
  const outSum = await prisma.inventoryMovement.aggregate({
    where: { productId, direction: 'OUT' },
    _sum: { qtyBase: true },
  })
  return (inSum._sum.qtyBase ?? 0) - (outSum._sum.qtyBase ?? 0)
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { productId } = await params

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    include: { units: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!product) return errorResponse('Product not found', 404)

  const qtyBase = await getProductStockBase(product.id)

  const units = product.units.map((unit) => ({
    unitId: unit.id,
    nameLabel: unit.nameLabel,
    factorToBase: unit.factorToBase,
    available: Math.floor(qtyBase / unit.factorToBase),
  }))

  return NextResponse.json({
    productId: product.id,
    productName: product.name,
    qtyBase,
    minStock: product.minStock,
    belowMin: product.minStock !== null && qtyBase < product.minStock,
    units,
  })
}
