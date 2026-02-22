import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'

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
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const tenantId = auth.tenantId
    const month = request.nextUrl.searchParams.get('month') ?? getCurrentMonth()
    const { start, end } = getMonthRange(month)

    const confirmedSales = await prisma.sale.findMany({
      where: { status: 'CONFIRMED', date: { gte: start, lte: end }, tenantId },
      include: { items: true },
    })

    const faturamento = confirmedSales.reduce((sum, s) => sum + Number(s.total), 0)
    const qtdVendas = confirmedSales.length
    const ticketMedio = qtdVendas > 0 ? faturamento / qtdVendas : 0

    const saleMovements = await prisma.inventoryMovement.findMany({
      where: { reasonType: 'SALE', date: { gte: start, lte: end }, direction: 'OUT', tenantId },
    })

    let custoProdutos = 0
    for (const mov of saleMovements) {
      const lots = await prisma.costLot.findMany({
        where: { productId: mov.productId, tenantId },
      })
      const totalQty = lots.reduce((s, l) => s + l.qtyRemainingBase, 0)
      const totalCost = lots.reduce((s, l) => s + Number(l.unitCostBase) * l.qtyRemainingBase, 0)
      const avgCost = totalQty > 0 ? totalCost / totalQty : 0
      custoProdutos += mov.qtyBase * avgCost
    }

    const lucroBruto = faturamento - custoProdutos

    const expenseEntries = await prisma.financeEntry.findMany({
      where: { type: 'EXPENSE', status: 'PAID', paidAt: { gte: start, lte: end }, tenantId },
    })
    const despesas = expenseEntries.reduce((sum, e) => sum + Number(e.amount), 0)

    const lucroLiquido = faturamento - custoProdutos - despesas

    const clientesNovos = await prisma.customer.count({
      where: { createdAt: { gte: start, lte: end }, deletedAt: null, tenantId },
    })

    const payments = await prisma.payment.findMany({
      where: { date: { gte: start, lte: end }, tenantId },
    })
    const recebido = payments.reduce((sum, p) => sum + Number(p.amount), 0)

    const openReceivables = await prisma.receivable.findMany({
      where: { status: 'OPEN', tenantId },
    })
    const aReceber = openReceivables.reduce((sum, r) => sum + Number(r.amount), 0)

    // Overdue receivables
    const now = new Date()
    const overdueReceivables = await prisma.receivable.findMany({
      where: { status: 'OPEN', dueDate: { lt: now }, tenantId },
    })
    const overdueCount = overdueReceivables.length
    const overdueTotal = overdueReceivables.reduce((sum, r) => sum + Number(r.amount), 0)

    // Recent sales (last 10)
    const recentSales = await prisma.sale.findMany({
      where: { date: { gte: start, lte: end }, tenantId },
      include: { customer: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      month,
      revenue: Math.round(faturamento * 100) / 100,
      grossProfit: Math.round(lucroBruto * 100) / 100,
      expenses: Math.round(despesas * 100) / 100,
      netProfit: Math.round(lucroLiquido * 100) / 100,
      salesCount: qtdVendas,
      newCustomers: clientesNovos,
      averageTicket: Math.round(ticketMedio * 100) / 100,
      received: Math.round(recebido * 100) / 100,
      toReceive: Math.round(aReceber * 100) / 100,
      overdueCount,
      overdueTotal: Math.round(overdueTotal * 100) / 100,
      recentSales: recentSales.map((s) => ({
        id: s.id,
        date: s.date.toISOString(),
        customerName: s.customer?.name ?? null,
        total: Number(s.total),
        status: s.status,
        couponNumber: s.couponNumber,
      })),
    })
  } catch (error) {
    console.error('Error in GET /api/reports/dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
