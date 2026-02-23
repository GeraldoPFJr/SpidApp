import { NextRequest, NextResponse } from 'next/server'
import { createCustomerSchema } from '@xpid/shared'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { parseBody } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const search = request.nextUrl.searchParams.get('search')
    const where: Record<string, unknown> = { deletedAt: null, tenantId: auth.tenantId }

    if (search) where.name = { contains: search, mode: 'insensitive' }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error in GET /api/customers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const result = await parseBody(request, createCustomerSchema)
    if ('error' in result) return result.error

    const customer = await prisma.customer.create({
      data: { ...result.data, tenantId: auth.tenantId },
    })
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/customers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
