import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { parseBody } from '@/lib/api-utils'

const accountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['CASH', 'BANK', 'OTHER']),
  active: z.boolean().default(true),
  defaultPaymentMethods: z.array(z.enum(['CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CREDIARIO', 'BOLETO', 'CHEQUE'])).default([]),
})

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
    console.error('Error in GET /api/finance/accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const result = await parseBody(request, accountSchema)
    if ('error' in result) return result.error

    const account = await prisma.account.create({
      data: { ...result.data, tenantId: auth.tenantId },
    })
    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/finance/accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
