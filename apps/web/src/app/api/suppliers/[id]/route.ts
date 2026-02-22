import { NextRequest, NextResponse } from 'next/server'
import { updateSupplierSchema } from '@spid/shared'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const supplier = await prisma.supplier.findFirst({
      where: { id, deletedAt: null },
    })
    if (!supplier) return errorResponse('Supplier not found', 404)

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error in GET /api/suppliers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await parseBody(request, updateSupplierSchema.omit({ id: true }))
    if ('error' in result) return result.error

    const existing = await prisma.supplier.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) return errorResponse('Supplier not found', 404)

    const updated = await prisma.supplier.update({
      where: { id },
      data: result.data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error in PUT /api/suppliers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const existing = await prisma.supplier.findFirst({
      where: { id, deletedAt: null },
    })
    if (!existing) return errorResponse('Supplier not found', 404)

    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/suppliers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
