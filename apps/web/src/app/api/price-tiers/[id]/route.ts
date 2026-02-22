import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse, parseBody } from '@/lib/api-utils'

const priceTierSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().default(false),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params
    const result = await parseBody(request, priceTierSchema.partial())
    if ('error' in result) return result.error

    const existing = await prisma.priceTier.findFirst({
      where: { id, tenantId: auth.tenantId },
    })
    if (!existing) return errorResponse('Price tier not found', 404)

    const updated = await prisma.priceTier.update({
      where: { id },
      data: result.data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error in PUT /api/price-tiers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const existing = await prisma.priceTier.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: { _count: { select: { prices: true } } },
    })
    if (!existing) return errorResponse('Price tier not found', 404)

    if (existing._count.prices > 0) {
      return errorResponse(
        'Nao e possivel excluir: esta tabela possui precos vinculados a produtos.',
        409,
      )
    }

    await prisma.priceTier.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/price-tiers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
