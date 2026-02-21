import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

const updateSubcategorySchema = z.object({
  name: z.string().min(1).max(200),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const result = await parseBody(request, updateSubcategorySchema)
  if ('error' in result) return result.error

  const existing = await prisma.subcategory.findUnique({ where: { id } })
  if (!existing) return errorResponse('Subcategory not found', 404)

  const updated = await prisma.subcategory.update({
    where: { id },
    data: result.data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.subcategory.findUnique({ where: { id } })
  if (!existing) return errorResponse('Subcategory not found', 404)

  await prisma.subcategory.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
