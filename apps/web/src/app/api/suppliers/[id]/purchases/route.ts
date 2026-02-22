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

    const existing = await prisma.supplier.findFirst({
      where: { id, deletedAt: null, tenantId: auth.tenantId },
    })
    if (!existing) return errorResponse('Supplier not found', 404)

    const purchases = await prisma.purchase.findMany({
      where: { supplierId: id, tenantId: auth.tenantId },
      include: { items: true, costs: true },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(purchases)
  } catch (error) {
    console.error('Error in GET /api/suppliers/[id]/purchases:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
