import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { parseBody } from '@/lib/api-utils'

const accountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['CASH', 'BANK', 'OTHER']),
  active: z.boolean().default(true),
})

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error in GET /api/finance/accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseBody(request, accountSchema)
    if ('error' in result) return result.error

    const account = await prisma.account.create({ data: result.data })
    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/finance/accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
