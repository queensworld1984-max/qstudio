import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://api:8000'

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname
  const authHeader = request.headers.get('authorization')
  
  const response = await fetch(`${API_URL}${path}${request.nextUrl.search}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
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

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname
  const authHeader = request.headers.get('authorization')
  const contentType = request.headers.get('Content-Type') || ''

  // Handle multipart/form-data (file uploads) differently
  const isMultipart = contentType.includes('multipart/form-data')

  let fetchHeaders: Record<string, string> = {}
  if (authHeader) fetchHeaders['Authorization'] = authHeader
  let body: BodyInit

  if (isMultipart) {
    // Forward the raw body with its boundary intact
    body = await request.arrayBuffer()
    fetchHeaders['Content-Type'] = contentType
  } else {
    body = await request.text()
    fetchHeaders['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: fetchHeaders,
    body,
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

export async function OPTIONS() {
  return new NextResponse(null, { 
    headers: { 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    } 
  })
}
