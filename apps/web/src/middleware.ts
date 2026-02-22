import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'spid-dev-jwt-secret-change-in-production'
)

const COOKIE_NAME = 'spid_token'

// Rotas que NAO precisam de auth
const PUBLIC_PATHS = ['/login', '/registro', '/api/auth/', '/api/health']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p))
}

async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET_KEY)
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths - allow through
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Check cookie (web pages and API)
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value
  if (cookieToken && await verifyTokenEdge(cookieToken)) {
    return NextResponse.next()
  }

  // Check Bearer header (mobile API calls)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    if (await verifyTokenEdge(token)) {
      return NextResponse.next()
    }
  }

  // Not authenticated
  if (pathname.startsWith('/api/')) {
    // API routes: return 401
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Web pages: redirect to login
  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    // Match all paths except static files and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
