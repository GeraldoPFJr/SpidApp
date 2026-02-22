import { NextRequest, NextResponse } from 'next/server'
import { createFinanceEntrySchema } from '@spid/shared'
import { prisma } from '@/lib/prisma'
import { parseBody } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const accountId = searchParams.get('account_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const where: Record<string, unknown> = {}

    if (type) where.type = type
    if (status) where.status = status
    if (accountId) where.accountId = accountId

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.createdAt = dateFilter
    }

    const entries = await prisma.financeEntry.findMany({
      where,
      include: { category: true, account: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error in GET /api/finance/entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseBody(request, createFinanceEntrySchema)
    if ('error' in result) return result.error

    const entry = await prisma.financeEntry.create({
      data: result.data,
      include: { category: true, account: true },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/finance/entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
