import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse, parseBody } from '@/lib/api-utils'

const accountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['CASH', 'BANK', 'OTHER']),
  active: z.boolean().default(true),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const result = await parseBody(request, accountSchema.partial())
  if ('error' in result) return result.error

  const existing = await prisma.account.findUnique({ where: { id } })
  if (!existing) return errorResponse('Account not found', 404)

  const updated = await prisma.account.update({
    where: { id },
    data: result.data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.account.findUnique({ where: { id } })
  if (!existing) return errorResponse('Account not found', 404)

  await prisma.account.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ success: true })
}
