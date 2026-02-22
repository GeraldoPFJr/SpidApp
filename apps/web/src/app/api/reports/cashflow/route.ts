import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getMonthRange(monthStr: string): { start: Date; end: Date } {
  const [yearStr, mStr] = monthStr.split('-')
  const year = parseInt(yearStr!, 10)
  const month = parseInt(mStr!, 10)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  return { start, end }
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const month = request.nextUrl.searchParams.get('month') ?? getCurrentMonth()
    const { start, end } = getMonthRange(month)

    const accounts = await prisma.account.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })

    const byAccount = await Promise.all(
      accounts.map(async (account) => {
        const prevClosure = await prisma.monthlyClosure.findFirst({
          where: { accountId: account.id, month: { lt: month } },
          orderBy: { month: 'desc' },
        })
        const saldoInicial = prevClosure
          ? Number(prevClosure.countedClosing ?? prevClosure.expectedClosing)
          : 0

        const entries = await prisma.financeEntry.findMany({
          where: { accountId: account.id, status: 'PAID', paidAt: { gte: start, lte: end } },
          include: { category: true },
        })

        let entradas = 0
        let saidas = 0

        for (const entry of entries) {
          const amount = Number(entry.amount)
          if (entry.type === 'INCOME' || entry.type === 'APORTE') {
            entradas += amount
          } else if (entry.type === 'EXPENSE' || entry.type === 'RETIRADA') {
            saidas += amount
          }
        }

        return {
          account: { id: account.id, name: account.name, type: account.type },
          saldoInicial: Math.round(saldoInicial * 100) / 100,
          entradas: Math.round(entradas * 100) / 100,
          saidas: Math.round(saidas * 100) / 100,
          saldoFinal: Math.round((saldoInicial + entradas - saidas) * 100) / 100,
        }
      }),
    )

    const allPaidEntries = await prisma.financeEntry.findMany({
      where: { status: 'PAID', paidAt: { gte: start, lte: end } },
      include: { category: true },
    })

    const categoryMap = new Map<string, { name: string; type: string; total: number }>()
    for (const entry of allPaidEntries) {
      const catName = entry.category?.name ?? 'Sem categoria'
      const catType = entry.category?.type ?? entry.type
      const key = `${catType}:${catName}`
      const existing = categoryMap.get(key)
      if (existing) {
        existing.total += Number(entry.amount)
      } else {
        categoryMap.set(key, { name: catName, type: catType, total: Number(entry.amount) })
      }
    }

    const byCategory = Array.from(categoryMap.values()).map((c) => ({
      ...c,
      total: Math.round(c.total * 100) / 100,
    }))

    const totalEntradas = byAccount.reduce((s, a) => s + a.entradas, 0)
    const totalSaidas = byAccount.reduce((s, a) => s + a.saidas, 0)
    const totalSaldoInicial = byAccount.reduce((s, a) => s + a.saldoInicial, 0)

    return NextResponse.json({
      month,
      byAccount,
      byCategory,
      consolidated: {
        saldoInicial: Math.round(totalSaldoInicial * 100) / 100,
        entradas: Math.round(totalEntradas * 100) / 100,
        saidas: Math.round(totalSaidas * 100) / 100,
        saldoFinal: Math.round((totalSaldoInicial + totalEntradas - totalSaidas) * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/reports/cashflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
