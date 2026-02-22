import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// List all subcategories - used by frontend product creation form
export async function GET() {
  try {
    const subcategories = await prisma.subcategory.findMany({
      orderBy: { name: 'asc' },
      include: { category: true },
    })

    return NextResponse.json(subcategories)
  } catch (error) {
    console.error('Error in GET /api/subcategories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
