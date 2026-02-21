import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
  })
  if (!existing) return errorResponse('Customer not found', 404)

  const receivables = await prisma.receivable.findMany({
    where: { customerId: id },
    include: { settlements: true },
    orderBy: { dueDate: 'asc' },
  })

  return NextResponse.json(receivables)
}
