import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth'
import { registerSchema } from '@xpid/shared'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { email, password, companyName } = parsed.data

    // Check if email already exists
    const existing = await prisma.tenant.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email ja cadastrado' }, { status: 409 })
    }

    const { tenant } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          email,
          passwordHash: hashPassword(password),
          companyName,
        },
      })

      const priceTier = await tx.priceTier.create({
        data: { name: 'Padrão', isDefault: true, tenantId: tenant.id },
      })

      await tx.account.create({
        data: {
          name: 'Carteira', type: 'CASH', tenantId: tenant.id,
          defaultPaymentMethods: ['CASH', 'CHEQUE'],
        },
      })

      await tx.account.create({
        data: {
          name: 'Banco', type: 'BANK', tenantId: tenant.id,
          defaultPaymentMethods: ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CREDIARIO', 'BOLETO'],
        },
      })

      await tx.appSettings.create({
        data: {
          tenantId: tenant.id,
          data: {
            company: {
              tradeName: '', legalName: '', cnpj: '', ie: '',
              address: '', city: '', state: '', cep: '',
              phone1: '', phone2: '', sellerName: '',
            },
            costMethod: 'FIFO',
            defaultPrintFormat: '80mm',
            defaultPriceTierId: priceTier.id,
          },
        },
      })

      return { tenant }
    })

    const token = await createToken(tenant.id)

    const response = NextResponse.json({
      token,
      tenant: { id: tenant.id, email: tenant.email, companyName: tenant.companyName },
    }, { status: 201 })

    setAuthCookie(response, token)
    return response
  } catch (error) {
    console.error('Error in POST /api/auth/register:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
