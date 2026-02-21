import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Alias for /api/finance/accounts - used by frontend pages
export async function GET() {
  const accounts = await prisma.account.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(accounts)
}
