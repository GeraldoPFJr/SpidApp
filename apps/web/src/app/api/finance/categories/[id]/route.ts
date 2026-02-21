import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

const financeCategorySchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  name: z.string().min(1).max(100),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const result = await parseBody(request, financeCategorySchema.partial())
  if ('error' in result) return result.error

  const existing = await prisma.financeCategory.findUnique({ where: { id } })
  if (!existing) return errorResponse('Finance category not found', 404)

  const updated = await prisma.financeCategory.update({
    where: { id },
    data: result.data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.financeCategory.findUnique({ where: { id } })
  if (!existing) return errorResponse('Finance category not found', 404)

  await prisma.financeCategory.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
