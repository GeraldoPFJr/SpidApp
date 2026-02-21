import { NextRequest, NextResponse } from 'next/server'
import { updateCustomerSchema } from '@spid/shared'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const customer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
  })
  if (!customer) return errorResponse('Customer not found', 404)

  const receivables = await prisma.receivable.findMany({
    where: { customerId: customer.id, status: 'OPEN' },
    orderBy: { dueDate: 'asc' },
  })

  const totalOpen = receivables.reduce(
    (sum, r) => sum + Number(r.amount),
    0,
  )

  return NextResponse.json({ ...customer, receivables, totalOpen })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const result = await parseBody(request, updateCustomerSchema.omit({ id: true }))
  if ('error' in result) return result.error

  const existing = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
  })
  if (!existing) return errorResponse('Customer not found', 404)

  const updated = await prisma.customer.update({
    where: { id },
    data: result.data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
  })
  if (!existing) return errorResponse('Customer not found', 404)

  await prisma.customer.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
