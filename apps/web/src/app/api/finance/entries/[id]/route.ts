import { NextRequest, NextResponse } from 'next/server'
import { createFinanceEntrySchema } from '@spid/shared'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse, parseBody } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params
    const result = await parseBody(request, createFinanceEntrySchema.partial())
    if ('error' in result) return result.error

    const existing = await prisma.financeEntry.findFirst({
      where: { id, tenantId: auth.tenantId },
    })
    if (!existing) return errorResponse('Finance entry not found', 404)

    const updated = await prisma.financeEntry.update({
      where: { id },
      data: result.data,
      include: { category: true, account: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error in PUT /api/finance/entries/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
