import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getLastNMonthsRanges(n: number): Array<{ label: string; start: Date; end: Date }> {
  const now = new Date()
  const ranges: Array<{ label: string; start: Date; end: Date }> = []

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    ranges.push({ label, start, end })
  }

  return ranges
}

export async function GET() {
  try {
    const ranges = getLastNMonthsRanges(3)
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })

    const result = await Promise.all(
      products.map(async (product) => {
        const monthlyData = await Promise.all(
          ranges.map(async (range) => {
            const saleItems = await prisma.saleItem.findMany({
              where: {
                productId: product.id,
                sale: { status: 'CONFIRMED', date: { gte: range.start, lte: range.end } },
              },
              include: { sale: true },
            })

            const faturamento = saleItems.reduce((s, i) => s + Number(i.total), 0)
            const itensVendidos = saleItems.reduce((s, i) => s + i.qty, 0)

            const customerIds = new Set(
              saleItems.map((i) => i.sale.customerId).filter(Boolean),
            )

            return {
              month: range.label,
              faturamento: Math.round(faturamento * 100) / 100,
              itensVendidos,
              clientesUnicos: customerIds.size,
            }
          }),
        )

        return { product: { id: product.id, name: product.name }, months: monthlyData }
      }),
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/reports/products-3m:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
