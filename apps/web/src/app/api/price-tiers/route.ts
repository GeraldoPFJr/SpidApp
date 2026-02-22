import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'
import { parseBody } from '@/lib/api-utils'

const priceTierSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const tiers = await prisma.priceTier.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(tiers)
  } catch (error) {
    console.error('Error in GET /api/price-tiers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (isAuthError(auth)) return auth

    const result = await parseBody(request, priceTierSchema)
    if ('error' in result) return result.error

    const tier = await prisma.priceTier.create({
      data: { ...result.data, tenantId: auth.tenantId },
    })
    return NextResponse.json(tier, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/price-tiers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
