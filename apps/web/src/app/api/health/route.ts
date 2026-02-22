import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in GET /api/health:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
