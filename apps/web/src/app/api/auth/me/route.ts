import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isAuthError(auth)) return auth

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenantId },
    select: { id: true, email: true, companyName: true, createdAt: true },
  })

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  return NextResponse.json(tenant)
}
