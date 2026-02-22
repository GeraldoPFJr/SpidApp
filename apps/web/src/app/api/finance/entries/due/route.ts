import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const now = new Date()

    // Update scheduled entries that are past due date
    await prisma.financeEntry.updateMany({
      where: {
        status: 'SCHEDULED',
        dueDate: { lte: now },
        tenantId: auth.tenantId,
      },
      data: { status: 'DUE' },
    })

    const entries = await prisma.financeEntry.findMany({
      where: { status: 'DUE', tenantId: auth.tenantId },
      include: { category: true, account: true },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error in GET /api/finance/entries/due:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
