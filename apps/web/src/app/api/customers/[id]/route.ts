import { NextRequest, NextResponse } from 'next/server'
import { updateCustomerSchema } from '@spid/shared'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse, parseBody } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null, tenantId: auth.tenantId },
    })
    if (!customer) return errorResponse('Customer not found', 404)

    const receivables = await prisma.receivable.findMany({
      where: { customerId: customer.id, status: 'OPEN', tenantId: auth.tenantId },
      orderBy: { dueDate: 'asc' },
    })

    const totalOpen = receivables.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    )

    return NextResponse.json({ ...customer, receivables, totalOpen })
  } catch (error) {
    console.error('Error in GET /api/customers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params
    const result = await parseBody(request, updateCustomerSchema.omit({ id: true }))
    if ('error' in result) return result.error

    const existing = await prisma.customer.findFirst({
      where: { id, deletedAt: null, tenantId: auth.tenantId },
    })
    if (!existing) return errorResponse('Customer not found', 404)

    const updated = await prisma.customer.update({
      where: { id },
      data: result.data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error in PUT /api/customers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const existing = await prisma.customer.findFirst({
      where: { id, deletedAt: null, tenantId: auth.tenantId },
    })
    if (!existing) return errorResponse('Customer not found', 404)

    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/customers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
