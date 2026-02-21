import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { parseBody } from '@/lib/api-utils'

const priceTierSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().default(false),
})

export async function GET() {
  const tiers = await prisma.priceTier.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(tiers)
}

export async function POST(request: NextRequest) {
  const result = await parseBody(request, priceTierSchema)
  if ('error' in result) return result.error

  const tier = await prisma.priceTier.create({ data: result.data })
  return NextResponse.json(tier, { status: 201 })
}
