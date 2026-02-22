import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { parseBody } from '@/lib/api-utils'

const financeCategorySchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  name: z.string().min(1).max(100),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const categories = await prisma.financeCategory.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error in GET /api/finance/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const result = await parseBody(request, financeCategorySchema)
    if ('error' in result) return result.error

    const category = await prisma.financeCategory.create({
      data: { ...result.data, tenantId: auth.tenantId },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/finance/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
