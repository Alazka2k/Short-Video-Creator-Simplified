import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function to forward the request
async function forwardRequest(request: NextRequest) {
  try {
    const body = request.method === 'GET' ? null : await request.json();
    const endpoint = request.nextUrl.searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'No endpoint specified' },
        { status: 400 }
      );
    }

    // Forward all relevant headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward Authorization header if present
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: request.method,
      headers,
      ...(body && { body: JSON.stringify(body) }),
      credentials: 'include',
    });

    const data = await response.json();

    // Forward response with original status and cookies
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Set-Cookie': response.headers.get('set-cookie') || '',
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return forwardRequest(request);
}

export async function POST(request: NextRequest) {
  return forwardRequest(request);
} 