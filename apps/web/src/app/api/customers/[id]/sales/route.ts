import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const existing = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) return errorResponse('Customer not found', 404)

    const sales = await prisma.sale.findMany({
      where: { customerId: id },
      include: { items: true, payments: true },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Error in GET /api/customers/[id]/sales:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
