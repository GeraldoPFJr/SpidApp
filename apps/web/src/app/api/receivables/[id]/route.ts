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

    const receivable = await prisma.receivable.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: {
        customer: true,
        sale: true,
        settlements: { include: { payment: true } },
      },
    })
    if (!receivable) return errorResponse('Receivable not found', 404)

    return NextResponse.json(receivable)
  } catch (error) {
    console.error('Error in GET /api/receivables/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
