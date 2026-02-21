import { NextRequest, NextResponse } from 'next/server'
import { createCustomerSchema } from '@spid/shared/schemas/index.js'
import { prisma } from '@/lib/prisma'
import { parseBody } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search')
  const where: Record<string, unknown> = { deletedAt: null }

  if (search) where.name = { contains: search, mode: 'insensitive' }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(customers)
}

export async function POST(request: NextRequest) {
  const result = await parseBody(request, createCustomerSchema)
  if ('error' in result) return result.error

  const customer = await prisma.customer.create({ data: result.data })
  return NextResponse.json(customer, { status: 201 })
}
