import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.supplier.findFirst({
    where: { id, deletedAt: null },
  })
  if (!existing) return errorResponse('Supplier not found', 404)

  const purchases = await prisma.purchase.findMany({
    where: { supplierId: id },
    include: { items: true, costs: true },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(purchases)
}
