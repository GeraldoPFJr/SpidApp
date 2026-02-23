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

    // Get default price tier for sale value calculation
    const defaultTier = await prisma.priceTier.findFirst({
      where: { tenantId: auth.tenantId, isDefault: true },
    })

    const products = await prisma.product.findMany({
      where: { deletedAt: null, tenantId: auth.tenantId },
      include: { units: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { name: 'asc' },
    })

    // Batch-load cost lots and base-unit prices for all products
    const productIds = products.map((p) => p.id)

    const costLots = await prisma.costLot.findMany({
      where: { productId: { in: productIds }, tenantId: auth.tenantId, qtyRemainingBase: { gt: 0 } },
      select: { productId: true, qtyRemainingBase: true, unitCostBase: true },
    })

    // Group cost lots by product
    const costByProduct = new Map<string, number>()
    for (const lot of costLots) {
      const prev = costByProduct.get(lot.productId) ?? 0
      costByProduct.set(lot.productId, prev + lot.qtyRemainingBase * Number(lot.unitCostBase))
    }

    // Get base-unit prices (factorToBase = 1) from default tier
    let basePriceByProduct = new Map<string, number>()
    if (defaultTier) {
      const baseUnits = products.flatMap((p) =>
        p.units.filter((u) => u.factorToBase === 1).map((u) => ({ productId: p.id, unitId: u.id })),
      )
      if (baseUnits.length > 0) {
        const prices = await prisma.productPrice.findMany({
          where: {
            tenantId: auth.tenantId,
            tierId: defaultTier.id,
            unitId: { in: baseUnits.map((u) => u.unitId) },
          },
          select: { productId: true, unitId: true, price: true },
        })
        for (const p of prices) {
          basePriceByProduct.set(p.productId, Number(p.price))
        }
      }
    }

    const result = await Promise.all(
      products.map(async (product) => {
        const qtyBase = await getProductStockBase(product.id, auth.tenantId)

        const units = product.units.map((unit) => ({
          unitId: unit.id,
          nameLabel: unit.nameLabel,
          factorToBase: unit.factorToBase,
          available: Math.floor(qtyBase / unit.factorToBase),
        }))

        const costValue = costByProduct.get(product.id) ?? 0
        const basePrice = basePriceByProduct.get(product.id) ?? 0
        const saleValue = qtyBase * basePrice

        return {
          productId: product.id,
          productName: product.name,
          qtyBase,
          minStock: product.minStock,
          belowMin: product.minStock !== null && qtyBase < product.minStock,
          units,
          costValue,
          saleValue,
        }
      }),
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/inventory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
