import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth'
import { loginSchema } from '@xpid/shared'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { email, password } = parsed.data

    const tenant = await prisma.tenant.findUnique({ where: { email } })
    if (!tenant || !verifyPassword(password, tenant.passwordHash)) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 })
    }

    const token = await createToken(tenant.id)

    const response = NextResponse.json({
      token,
      tenant: { id: tenant.id, email: tenant.email, companyName: tenant.companyName },
    })

    setAuthCookie(response, token)
    return response
  } catch (error) {
    console.error('Error in POST /api/auth/login:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
