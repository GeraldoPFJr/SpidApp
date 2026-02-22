import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const existing = await prisma.financeEntry.findFirst({
      where: { id, tenantId: auth.tenantId },
    })
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
  } catch (error) {
    console.error('Error in POST /api/finance/entries/[id]/pay:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
