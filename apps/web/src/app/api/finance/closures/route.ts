import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

const closureSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  accountId: z.string().uuid(),
  countedClosing: z.number().optional(),
  notes: z.string().max(1000).optional(),
})

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get('account_id')
  const where: Record<string, unknown> = {}
  if (accountId) where.accountId = accountId

  const closures = await prisma.monthlyClosure.findMany({
    where,
    include: { account: true },
    orderBy: { month: 'desc' },
  })

  return NextResponse.json(closures)
}

export async function POST(request: NextRequest) {
  const result = await parseBody(request, closureSchema)
  if ('error' in result) return result.error

  const { month, accountId, countedClosing, notes } = result.data

  const [yearStr, monthStr] = month.split('-')
  const year = parseInt(yearStr!, 10)
  const monthNum = parseInt(monthStr!, 10)
  const startOfMonth = new Date(year, monthNum - 1, 1)
  const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999)

  const previousClosure = await prisma.monthlyClosure.findFirst({
    where: { accountId },
    orderBy: { month: 'desc' },
  })
  const openingBalance = previousClosure
    ? Number(previousClosure.countedClosing ?? previousClosure.expectedClosing)
    : 0

  const paidEntries = await prisma.financeEntry.findMany({
    where: {
      accountId,
      status: 'PAID',
      paidAt: { gte: startOfMonth, lte: endOfMonth },
    },
  })

  let totalIncome = 0
  let totalExpense = 0

  for (const entry of paidEntries) {
    const amount = Number(entry.amount)
    if (entry.type === 'INCOME' || entry.type === 'APORTE') {
      totalIncome += amount
    } else if (entry.type === 'EXPENSE' || entry.type === 'RETIRADA') {
      totalExpense += amount
    }
  }

  const expectedClosing = openingBalance + totalIncome - totalExpense

  try {
    const closure = await prisma.monthlyClosure.create({
      data: {
        month,
        accountId,
        openingBalance,
        expectedClosing,
        countedClosing: countedClosing ?? null,
        notes: notes ?? null,
      },
      include: { account: true },
    })

    return NextResponse.json({
      ...closure,
      totalIncome,
      totalExpense,
      difference: countedClosing !== undefined ? countedClosing - expectedClosing : null,
    }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create closure'
    return errorResponse(message, 500)
  }
}
