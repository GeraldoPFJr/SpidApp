import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

const createSubcategorySchema = z.object({
  name: z.string().min(1).max(200),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) return errorResponse('Category not found', 404)

  const subcategories = await prisma.subcategory.findMany({
    where: { categoryId: id },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(subcategories)
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const result = await parseBody(request, createSubcategorySchema)
  if ('error' in result) return result.error

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) return errorResponse('Category not found', 404)

  const subcategory = await prisma.subcategory.create({
    data: { ...result.data, categoryId: id },
  })

  return NextResponse.json(subcategory, { status: 201 })
}
