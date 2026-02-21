import { NextRequest, NextResponse } from 'next/server'
import { createFinanceEntrySchema } from '@spid/shared/schemas/index.js'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const result = await parseBody(request, createFinanceEntrySchema.partial())
  if ('error' in result) return result.error

  const existing = await prisma.financeEntry.findUnique({ where: { id } })
  if (!existing) return errorResponse('Finance entry not found', 404)

  const updated = await prisma.financeEntry.update({
    where: { id },
    data: result.data,
    include: { category: true, account: true },
  })

  return NextResponse.json(updated)
}
