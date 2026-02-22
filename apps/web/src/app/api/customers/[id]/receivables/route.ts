import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const existing = await prisma.customer.findFirst({
      where: { id, deletedAt: null, tenantId: auth.tenantId },
    })
    if (!existing) return errorResponse('Customer not found', 404)

    const receivables = await prisma.receivable.findMany({
      where: { customerId: id, tenantId: auth.tenantId },
      include: { settlements: true },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(receivables)
  } catch (error) {
    console.error('Error in GET /api/customers/[id]/receivables:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
