import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { ZodSchema, ZodError } from 'zod'

export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export function zodErrorResponse(error: ZodError): NextResponse {
  return NextResponse.json({ error: error.flatten() }, { status: 400 })
}

export async function parseBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return { error: zodErrorResponse(parsed.error) }
    }

    return { data: parsed.data }
  } catch {
    return { error: errorResponse('Invalid JSON body', 400) }
  }
}
