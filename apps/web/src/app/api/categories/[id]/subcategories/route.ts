import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { errorResponse, parseBody } from '@/lib/api-utils'

const createSubcategorySchema = z.object({
  name: z.string().min(1).max(200),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const category = await prisma.category.findFirst({
      where: { id, tenantId: auth.tenantId },
    })
    if (!category) return errorResponse('Category not found', 404)

    const subcategories = await prisma.subcategory.findMany({
      where: { categoryId: id, tenantId: auth.tenantId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(subcategories)
  } catch (error) {
    console.error('Error in GET /api/categories/[id]/subcategories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const { id } = await params
    const result = await parseBody(request, createSubcategorySchema)
    if ('error' in result) return result.error

    const category = await prisma.category.findFirst({
      where: { id, tenantId: auth.tenantId },
    })
    if (!category) return errorResponse('Category not found', 404)

    const subcategory = await prisma.subcategory.create({
      data: { ...result.data, categoryId: id, tenantId: auth.tenantId },
    })

    return NextResponse.json(subcategory, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/categories/[id]/subcategories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
