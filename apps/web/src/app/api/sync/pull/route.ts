import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isAuthError(auth)) return auth

  try {
    const searchParams = request.nextUrl.searchParams
    const deviceId = searchParams.get('device_id')
    const since = searchParams.get('since')
    const sinceDate = since ? new Date(since) : new Date(0)

    const tenantFilter = { tenantId: auth.tenantId, updatedAt: { gt: sinceDate } }

    const [products, customers, suppliers, categories, subcategories, sales, receivables] =
      await Promise.all([
        prisma.product.findMany({ where: tenantFilter }),
        prisma.customer.findMany({ where: tenantFilter }),
        prisma.supplier.findMany({ where: tenantFilter }),
        prisma.category.findMany({ where: tenantFilter }),
        prisma.subcategory.findMany({ where: tenantFilter }),
        prisma.sale.findMany({
          where: tenantFilter,
          include: { items: true, payments: true },
        }),
        prisma.receivable.findMany({ where: tenantFilter }),
      ])

    const now = new Date().toISOString()

    if (deviceId) {
      await prisma.syncCursor.upsert({
        where: { deviceId },
        update: { lastCursor: new Date() },
        create: { deviceId, lastCursor: new Date(), tenantId: auth.tenantId },
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
  } catch (error) {
    console.error('Error in GET /api/sync/pull:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
