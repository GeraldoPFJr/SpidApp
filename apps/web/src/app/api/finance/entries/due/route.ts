import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const now = new Date()

  // Update scheduled entries that are past due date
  await prisma.financeEntry.updateMany({
    where: {
      status: 'SCHEDULED',
      dueDate: { lte: now },
    },
    data: { status: 'DUE' },
  })

  const entries = await prisma.financeEntry.findMany({
    where: { status: 'DUE' },
    include: { category: true, account: true },
    orderBy: { dueDate: 'asc' },
  })

  return NextResponse.json(entries)
}
