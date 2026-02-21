import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.financeEntry.findUnique({ where: { id } })
  if (!existing) return errorResponse('Finance entry not found', 404)
  if (existing.status === 'PAID') {
    return errorResponse('Entry already paid', 400)
  }

  const updated = await prisma.financeEntry.update({
    where: { id },
    data: { status: 'PAID', paidAt: new Date() },
    include: { category: true, account: true },
  })

  return NextResponse.json(updated)
}
