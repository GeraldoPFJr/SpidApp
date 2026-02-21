import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const receivable = await prisma.receivable.findUnique({
    where: { id },
    include: {
      customer: true,
      sale: true,
      settlements: { include: { payment: true } },
    },
  })
  if (!receivable) return errorResponse('Receivable not found', 404)

  return NextResponse.json(receivable)
}
