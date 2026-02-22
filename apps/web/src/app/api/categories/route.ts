import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { parseBody } from '@/lib/api-utils'

const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
})

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { subcategories: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error in GET /api/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseBody(request, createCategorySchema)
    if ('error' in result) return result.error

    const category = await prisma.category.create({ data: result.data })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
