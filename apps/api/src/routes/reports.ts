import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

function getMonthRange(monthStr: string): { start: Date; end: Date } {
  const [yearStr, mStr] = monthStr.split('-')
  const year = parseInt(yearStr!, 10)
  const month = parseInt(mStr!, 10)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  return { start, end }
}

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

export async function reportsRoutes(app: FastifyInstance) {
  // GET /reports/dashboard?month=YYYY-MM
  app.get<{ Querystring: { month?: string } }>('/dashboard', async (request) => {
    const month = request.query.month ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const { start, end } = getMonthRange(month)

    // Sales in the month (CONFIRMED)
    const confirmedSales = await prisma.sale.findMany({
      where: { status: 'CONFIRMED', date: { gte: start, lte: end } },
      include: { items: true },
    })

    const faturamento = confirmedSales.reduce((sum, s) => sum + Number(s.total), 0)
    const qtdVendas = confirmedSales.length
    const ticketMedio = qtdVendas > 0 ? faturamento / qtdVendas : 0

    // COGS: sum of cost lots consumed in the month (approximation via sale items)
    // We approximate COGS by looking at inventory movements for SALE in the period
    // and matching them with cost lot consumption
    const saleMovements = await prisma.inventoryMovement.findMany({
      where: { reasonType: 'SALE', date: { gte: start, lte: end }, direction: 'OUT' },
    })

    // For COGS, we calculate from consumed cost lots
    // Simplified: get all cost lots with updates in the period
    let custoProdutos = 0
    for (const mov of saleMovements) {
      // Get average cost for this product from cost lots
      const lots = await prisma.costLot.findMany({
        where: { productId: mov.productId },
      })
      const totalQty = lots.reduce((s, l) => s + l.qtyRemainingBase, 0)
      const totalCost = lots.reduce((s, l) => s + Number(l.unitCostBase) * l.qtyRemainingBase, 0)
      const avgCost = totalQty > 0 ? totalCost / totalQty : 0
      custoProdutos += mov.qtyBase * avgCost
    }

    const lucroBruto = faturamento - custoProdutos

    // Expenses in the month (PAID)
    const expenseEntries = await prisma.financeEntry.findMany({
      where: { type: 'EXPENSE', status: 'PAID', paidAt: { gte: start, lte: end } },
    })
    const despesas = expenseEntries.reduce((sum, e) => sum + Number(e.amount), 0)

    const lucroLiquido = faturamento - custoProdutos - despesas

    // New customers
    const clientesNovos = await prisma.customer.count({
      where: { createdAt: { gte: start, lte: end }, deletedAt: null },
    })

    // Received (payments in the month)
    const payments = await prisma.payment.findMany({
      where: { date: { gte: start, lte: end } },
    })
    const recebido = payments.reduce((sum, p) => sum + Number(p.amount), 0)

    // Receivables still open
    const openReceivables = await prisma.receivable.findMany({
      where: { status: 'OPEN' },
    })
    const aReceber = openReceivables.reduce((sum, r) => sum + Number(r.amount), 0)

    return {
      month,
      faturamento: Math.round(faturamento * 100) / 100,
      lucroBruto: Math.round(lucroBruto * 100) / 100,
      despesas: Math.round(despesas * 100) / 100,
      lucroLiquido: Math.round(lucroLiquido * 100) / 100,
      qtdVendas,
      clientesNovos,
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      recebido: Math.round(recebido * 100) / 100,
      aReceber: Math.round(aReceber * 100) / 100,
    }
  })

  // GET /reports/products-3m
  app.get('/products-3m', async () => {
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

    return result
  })

  // GET /reports/customers-3m
  app.get('/customers-3m', async () => {
    const ranges = getLastNMonthsRanges(3)
    const threeMonthsAgo = ranges[0]!.start

    // Get customers with confirmed sales in the last 3 months
    const sales = await prisma.sale.findMany({
      where: {
        status: 'CONFIRMED',
        date: { gte: threeMonthsAgo },
        customerId: { not: null },
      },
      include: { items: true, receivables: { include: { settlements: true } } },
    })

    // Group by customer
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

      // Calculate payment term for receivables
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

    // Fetch customer names
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

    return result
  })

  // GET /reports/cashflow?month=YYYY-MM
  app.get<{ Querystring: { month?: string } }>('/cashflow', async (request) => {
    const month = request.query.month ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const { start, end } = getMonthRange(month)

    const accounts = await prisma.account.findMany({ where: { active: true }, orderBy: { name: 'asc' } })

    // Per account
    const byAccount = await Promise.all(
      accounts.map(async (account) => {
        // Get previous closure for opening balance
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

    // By category
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

    // Consolidated
    const totalEntradas = byAccount.reduce((s, a) => s + a.entradas, 0)
    const totalSaidas = byAccount.reduce((s, a) => s + a.saidas, 0)
    const totalSaldoInicial = byAccount.reduce((s, a) => s + a.saldoInicial, 0)

    return {
      month,
      byAccount,
      byCategory,
      consolidated: {
        saldoInicial: Math.round(totalSaldoInicial * 100) / 100,
        entradas: Math.round(totalEntradas * 100) / 100,
        saidas: Math.round(totalSaidas * 100) / 100,
        saldoFinal: Math.round((totalSaldoInicial + totalEntradas - totalSaidas) * 100) / 100,
      },
    }
  })
}
