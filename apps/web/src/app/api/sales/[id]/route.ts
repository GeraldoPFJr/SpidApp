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

    const sale = await prisma.sale.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: {
        customer: true,
        items: { include: { product: true, unit: true } },
        payments: true,
        receivables: { include: { settlements: true } },
      },
    })
    if (!sale) return errorResponse('Sale not found', 404)

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error in GET /api/sales/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params
    const tenantId = auth.tenantId

    const sale = await prisma.sale.findFirst({
      where: { id, tenantId },
    })
    if (!sale) return errorResponse('Sale not found', 404)
    if (sale.status !== 'DRAFT') {
      return errorResponse('Only draft sales can be updated', 400)
    }

    let body: {
      customerId?: string | null
      notes?: string | null
      subtotal?: number
      discount?: number
      freight?: number
      total?: number
      items?: Array<{ productId: string; unitId: string; qty: number; unitPrice: number; total: number }>
    }

    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (body.items) {
        await tx.saleItem.deleteMany({ where: { saleId: sale.id } })
        for (const item of body.items) {
          await tx.saleItem.create({ data: { ...item, saleId: sale.id, tenantId } })
        }
      }

      const { items: _, ...updateData } = body
      return tx.sale.update({
        where: { id: sale.id },
        data: updateData,
        include: {
          customer: true,
          items: { include: { product: true, unit: true } },
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error in PUT /api/sales/[id]:', error)
    const message = error instanceof Error ? error.message : 'Failed to update sale'
    return errorResponse(message, 500)
  }
}
