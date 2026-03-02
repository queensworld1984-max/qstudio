import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://72.62.165.54:8000'

export async function handler(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api', '')
  const authHeader = request.headers.get('authorization')
  
  const response = await fetch(`${API_URL}${path}${request.nextUrl.search}`, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
  })

  const data = await response.text()
  return new NextResponse(data, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const OPTIONS = () => new NextResponse(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
