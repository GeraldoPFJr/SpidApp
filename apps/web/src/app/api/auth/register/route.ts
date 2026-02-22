import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth'
import { registerSchema } from '@spid/shared'

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

    const tenant = await prisma.tenant.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        companyName,
      },
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
