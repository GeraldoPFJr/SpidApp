import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const customerId = searchParams.get('customer_id')
    const dueDateFrom = searchParams.get('due_date_from')
    const dueDateTo = searchParams.get('due_date_to')
    const overdue = searchParams.get('overdue')

    const where: Record<string, unknown> = { tenantId: auth.tenantId }

    if (status) where.status = status
    if (customerId) where.customerId = customerId

    if (dueDateFrom || dueDateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dueDateFrom) dateFilter.gte = new Date(dueDateFrom)
      if (dueDateTo) dateFilter.lte = new Date(dueDateTo)
      where.dueDate = dateFilter
    }

    if (overdue === 'true') {
      where.status = 'OPEN'
      where.dueDate = { lt: new Date() }
    }

    const receivables = await prisma.receivable.findMany({
      where,
      include: { customer: true, sale: true, settlements: true },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(receivables)
  } catch (error) {
    console.error('Error in GET /api/receivables:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
