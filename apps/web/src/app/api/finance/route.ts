import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Combined finance overview - used by frontend financeiro page
export async function GET() {
  try {
    const [accounts, entries] = await Promise.all([
      prisma.account.findMany({ orderBy: { name: 'asc' } }),
      prisma.financeEntry.findMany({
        include: { category: true, account: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ])

    // Calculate balance per account from paid entries
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const paidEntries = await prisma.financeEntry.findMany({
          where: { accountId: account.id, status: 'PAID' },
        })

        let balance = 0
        for (const entry of paidEntries) {
          const amount = Number(entry.amount)
          if (entry.type === 'INCOME' || entry.type === 'APORTE') {
            balance += amount
          } else if (entry.type === 'EXPENSE' || entry.type === 'RETIRADA') {
            balance -= amount
          }
        }

        return { ...account, balance: Math.round(balance * 100) / 100 }
      }),
    )

    const entriesWithNames = entries.map((e) => ({
      ...e,
      categoryName: e.category?.name ?? 'Sem categoria',
      accountName: e.account.name,
    }))

    return NextResponse.json({
      accounts: accountsWithBalance,
      entries: entriesWithNames,
    })
  } catch (error) {
    console.error('Error in GET /api/finance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
