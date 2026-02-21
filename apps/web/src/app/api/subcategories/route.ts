import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// List all subcategories - used by frontend product creation form
export async function GET() {
  const subcategories = await prisma.subcategory.findMany({
    orderBy: { name: 'asc' },
    include: { category: true },
  })

  return NextResponse.json(subcategories)
}
