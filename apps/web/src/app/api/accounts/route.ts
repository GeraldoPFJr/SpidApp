import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'

// Alias for /api/finance/accounts - used by frontend pages
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const accounts = await prisma.account.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error in GET /api/accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
