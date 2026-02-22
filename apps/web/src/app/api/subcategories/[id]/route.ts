import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse, parseBody } from '@/lib/api-utils'

const updateSubcategorySchema = z.object({
  name: z.string().min(1).max(200),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params
    const result = await parseBody(request, updateSubcategorySchema)
    if ('error' in result) return result.error

    const existing = await prisma.subcategory.findFirst({
      where: { id, tenantId: auth.tenantId },
    })
    if (!existing) return errorResponse('Subcategory not found', 404)

    const updated = await prisma.subcategory.update({
      where: { id },
      data: result.data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error in PUT /api/subcategories/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const existing = await prisma.subcategory.findFirst({
      where: { id, tenantId: auth.tenantId },
    })
    if (!existing) return errorResponse('Subcategory not found', 404)

    await prisma.subcategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/subcategories/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
