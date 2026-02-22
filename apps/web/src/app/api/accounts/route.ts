import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Alias for /api/finance/accounts - used by frontend pages
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error in GET /api/accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
