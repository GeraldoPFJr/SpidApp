import { NextRequest, NextResponse } from 'next/server'

interface AuthResult {
  deviceId: string
}

interface AuthError {
  error: NextResponse
}

export function validateAuth(request: NextRequest): AuthResult | AuthError {
  const instanceId = request.headers.get('x-app-instance-id')
  const syncSecret = request.headers.get('x-sync-secret')

  if (!instanceId) {
    return {
      error: NextResponse.json(
        { error: 'Missing X-App-Instance-Id header' },
        { status: 401 },
      ),
    }
  }

  if (!syncSecret || syncSecret !== process.env.SYNC_SECRET) {
    return {
      error: NextResponse.json(
        { error: 'Invalid X-Sync-Secret header' },
        { status: 401 },
      ),
    }
  }

  return { deviceId: instanceId }
}

export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'error' in result
}
