import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { parseBody } from '@/lib/api-utils'

const financeCategorySchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  name: z.string().min(1).max(100),
})

export async function GET() {
  const categories = await prisma.financeCategory.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  const result = await parseBody(request, financeCategorySchema)
  if ('error' in result) return result.error

  const category = await prisma.financeCategory.create({ data: result.data })
  return NextResponse.json(category, { status: 201 })
}
