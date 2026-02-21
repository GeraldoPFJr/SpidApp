import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const overdueReceivables = await prisma.receivable.findMany({
    where: {
      status: 'OPEN',
      dueDate: { lt: new Date() },
    },
    include: { customer: true, sale: true },
    orderBy: { dueDate: 'asc' },
  })

  const grouped = new Map<string, {
    customerId: string
    customerName: string
    totalOpen: number
    invoiceCount: number
    maxDaysOverdue: number
    lastPurchaseDate: Date | null
    receivables: typeof overdueReceivables
  }>()

  const now = new Date()

  for (const r of overdueReceivables) {
    const key = r.customerId
    const existing = grouped.get(key)
    const daysOverdue = Math.floor(
      (now.getTime() - r.dueDate.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (existing) {
      existing.totalOpen += Number(r.amount)
      existing.invoiceCount += 1
      existing.maxDaysOverdue = Math.max(existing.maxDaysOverdue, daysOverdue)
      existing.receivables.push(r)
    } else {
      const lastSale = await prisma.sale.findFirst({
        where: { customerId: key, status: 'CONFIRMED' },
        orderBy: { date: 'desc' },
        select: { date: true },
      })

      grouped.set(key, {
        customerId: key,
        customerName: r.customer.name,
        totalOpen: Number(r.amount),
        invoiceCount: 1,
        maxDaysOverdue: daysOverdue,
        lastPurchaseDate: lastSale?.date ?? null,
        receivables: [r],
      })
    }
  }

  const result = Array.from(grouped.values()).sort(
    (a, b) => b.maxDaysOverdue - a.maxDaysOverdue,
  )

  return NextResponse.json(result)
}
