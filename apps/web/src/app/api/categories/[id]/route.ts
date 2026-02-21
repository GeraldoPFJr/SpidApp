import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

const updateCategorySchema = z.object({
  name: z.string().min(1).max(200),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const category = await prisma.category.findUnique({
    where: { id },
    include: { subcategories: true },
  })
  if (!category) return errorResponse('Category not found', 404)

  return NextResponse.json(category)
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const result = await parseBody(request, updateCategorySchema)
  if ('error' in result) return result.error

  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) return errorResponse('Category not found', 404)

  const updated = await prisma.category.update({
    where: { id },
    data: result.data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) return errorResponse('Category not found', 404)

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
