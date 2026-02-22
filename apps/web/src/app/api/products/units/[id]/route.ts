import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

const unitBodySchema = z.object({
  nameLabel: z.string().min(1),
  factorToBase: z.number().int().positive(),
  isSellable: z.boolean(),
  sortOrder: z.number().int().nonnegative().default(0),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await parseBody(request, unitBodySchema.partial())
    if ('error' in result) return result.error

    const existing = await prisma.productUnit.findUnique({ where: { id } })
    if (!existing) return errorResponse('Unit not found', 404)

    const updated = await prisma.productUnit.update({
      where: { id },
      data: result.data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error in PUT /api/products/units/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const existing = await prisma.productUnit.findUnique({ where: { id } })
    if (!existing) return errorResponse('Unit not found', 404)

    await prisma.productUnit.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/products/units/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
