import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAuth, isAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authResult = validateAuth(request)
  if (isAuthError(authResult)) return authResult.error

  const searchParams = request.nextUrl.searchParams
  const deviceId = searchParams.get('device_id')
  const since = searchParams.get('since')
  const sinceDate = since ? new Date(since) : new Date(0)

  const [products, customers, suppliers, categories, subcategories, sales, receivables] =
    await Promise.all([
      prisma.product.findMany({ where: { updatedAt: { gt: sinceDate } } }),
      prisma.customer.findMany({ where: { updatedAt: { gt: sinceDate } } }),
      prisma.supplier.findMany({ where: { updatedAt: { gt: sinceDate } } }),
      prisma.category.findMany({ where: { updatedAt: { gt: sinceDate } } }),
      prisma.subcategory.findMany({ where: { updatedAt: { gt: sinceDate } } }),
      prisma.sale.findMany({
        where: { updatedAt: { gt: sinceDate } },
        include: { items: true, payments: true },
      }),
      prisma.receivable.findMany({ where: { updatedAt: { gt: sinceDate } } }),
    ])

  const now = new Date().toISOString()

  if (deviceId) {
    await prisma.syncCursor.upsert({
      where: { deviceId },
      update: { lastCursor: new Date() },
      create: { deviceId, lastCursor: new Date() },
    })
  }

  return NextResponse.json({
    products,
    customers,
    suppliers,
    categories,
    subcategories,
    sales,
    receivables,
    cursor: now,
  })
}
