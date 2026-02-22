import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: { units: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    })

    const result = await Promise.all(
      products.map(async (product) => {
        const qtyBase = await getProductStockBase(product.id)

        const units = product.units.map((unit) => ({
          unitId: unit.id,
          nameLabel: unit.nameLabel,
          factorToBase: unit.factorToBase,
          available: Math.floor(qtyBase / unit.factorToBase),
        }))

        return {
          productId: product.id,
          productName: product.name,
          qtyBase,
          minStock: product.minStock,
          belowMin: product.minStock !== null && qtyBase < product.minStock,
          units,
        }
      }),
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/inventory/stock:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
