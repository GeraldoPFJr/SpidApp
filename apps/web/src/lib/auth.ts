import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

// ── Password Hashing (Node built-in scrypt) ──────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':')
  const salt = parts[0]
  const hash = parts[1]
  if (!salt || !hash) return false
  const hashBuffer = Buffer.from(hash, 'hex')
  const computed = scryptSync(password, salt, 64)
  return timingSafeEqual(hashBuffer, computed)
}

// ── JWT ──────────────────────────────────────────────────

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'spid-dev-jwt-secret-change-in-production'
)

const JWT_EXPIRATION = '30d'

export async function createToken(tenantId: string): Promise<string> {
  return new SignJWT({ sub: tenantId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET_KEY)
}

export async function verifyToken(token: string): Promise<{ tenantId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY)
    if (!payload.sub) return null
    return { tenantId: payload.sub }
  } catch {
    return null
  }
}

// ── Cookie Management ────────────────────────────────────

const COOKIE_NAME = 'spid_token'

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

// ── Request Auth Extraction ──────────────────────────────

export interface AuthContext {
  tenantId: string
}

/**
 * Extract auth from request. Checks cookie first, then Bearer header.
 * Returns AuthContext or a 401 NextResponse.
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  // Try cookie first (web)
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value
  if (cookieToken) {
    const result = await verifyToken(cookieToken)
    if (result) return { tenantId: result.tenantId }
  }

  // Try Bearer header (mobile)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const result = await verifyToken(token)
    if (result) return { tenantId: result.tenantId }
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/**
 * Helper type guard to check if requireAuth returned an error
 */
export function isAuthError(result: AuthContext | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
