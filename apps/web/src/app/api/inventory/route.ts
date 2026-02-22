import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'

// Alias for /api/inventory/stock - used by frontend estoque page
async function getProductStockBase(productId: string, tenantId: string): Promise<number> {
  const inSum = await prisma.inventoryMovement.aggregate({
    where: { productId, direction: 'IN', tenantId },
    _sum: { qtyBase: true },
  })
  const outSum = await prisma.inventoryMovement.aggregate({
    where: { productId, direction: 'OUT', tenantId },
    _sum: { qtyBase: true },
  })
  return (inSum._sum.qtyBase ?? 0) - (outSum._sum.qtyBase ?? 0)
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const products = await prisma.product.findMany({
      where: { deletedAt: null, tenantId: auth.tenantId },
      include: { units: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    })

    const result = await Promise.all(
      products.map(async (product) => {
        const qtyBase = await getProductStockBase(product.id, auth.tenantId)

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
    console.error('Error in GET /api/inventory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
