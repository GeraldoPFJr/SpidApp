import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'

// List all subcategories - used by frontend product creation form
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const subcategories = await prisma.subcategory.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { name: 'asc' },
      include: { category: true },
    })

    return NextResponse.json(subcategories)
  } catch (error) {
    console.error('Error in GET /api/subcategories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
