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
    const threeMonthsAgo = ranges[0]!.start

    const sales = await prisma.sale.findMany({
      where: {
        status: 'CONFIRMED',
        date: { gte: threeMonthsAgo },
        customerId: { not: null },
      },
      include: { items: true, receivables: { include: { settlements: true } } },
    })

    const customerMap = new Map<string, {
      totalComprado: number
      qtdVendas: number
      totalPrazoDias: number
      countPrazo: number
    }>()

    for (const sale of sales) {
      if (!sale.customerId) continue
      const existing = customerMap.get(sale.customerId) ?? {
        totalComprado: 0,
        qtdVendas: 0,
        totalPrazoDias: 0,
        countPrazo: 0,
      }

      existing.totalComprado += Number(sale.total)
      existing.qtdVendas += 1

      for (const rec of sale.receivables) {
        if (rec.status === 'PAID') {
          const lastSettlement = rec.settlements.sort(
            (a, b) => b.paidAt.getTime() - a.paidAt.getTime(),
          )[0]
          if (lastSettlement) {
            const days = Math.floor(
              (lastSettlement.paidAt.getTime() - sale.date.getTime()) / (1000 * 60 * 60 * 24),
            )
            existing.totalPrazoDias += Math.max(0, days)
            existing.countPrazo += 1
          }
        }
      }

      customerMap.set(sale.customerId, existing)
    }

    const customerIds = Array.from(customerMap.keys())
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
    })

    const result = customers
      .map((c) => {
        const data = customerMap.get(c.id)!
        const prazoMedioPagamento = data.countPrazo > 0
          ? Math.round(data.totalPrazoDias / data.countPrazo)
          : 0

        return {
          customer: { id: c.id, name: c.name },
          totalComprado: Math.round(data.totalComprado * 100) / 100,
          qtdVendas: data.qtdVendas,
          prazoMedioPagamento,
        }
      })
      .sort((a, b) => b.totalComprado - a.totalComprado)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/reports/customers-3m:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
