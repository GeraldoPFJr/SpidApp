import { NextRequest, NextResponse } from 'next/server'
import { createSupplierSchema } from '@xpid/shared'
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

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error in GET /api/suppliers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const result = await parseBody(request, createSupplierSchema)
    if ('error' in result) return result.error

    const supplier = await prisma.supplier.create({
      data: { ...result.data, tenantId: auth.tenantId },
    })
    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/suppliers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
