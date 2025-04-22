import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${apiBaseUrl}${endpoint}`;

    // Forward the request to the backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || '',
        'X-Request-ID': crypto.randomUUID(),
        'X-Security-Token': process.env.API_SECURITY_TOKEN || '',
      },
    });

    // Get the response data
    const data = await response.json();

    // Create a new response with the same status and data
    const newResponse = NextResponse.json(data, { status: response.status });

    // Add security headers to the response
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-XSS-Protection', '1; mode=block');
    newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Only set restrictive CSP for data-focused API endpoints
    // Skip setting CSP for media-related endpoints that might affect video embeds
    if (!endpoint.includes('/media') && !endpoint.includes('/video') && !endpoint.includes('/embed')) {
      newResponse.headers.set('X-Frame-Options', 'DENY');
      newResponse.headers.set('Content-Security-Policy', "default-src 'self'");
    }

    return newResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${apiBaseUrl}${endpoint}`;

    // Get the request body
    const body = await request.json();
    
    // Forward the request to the backend without encryption
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        'X-Real-IP': request.headers.get('x-real-ip') || '',
        'X-Request-ID': crypto.randomUUID(),
        'X-Security-Token': process.env.API_SECURITY_TOKEN || '',
      },
      body: JSON.stringify(body),
    });

    // Get the response data
    const data = await response.json();

    // Create a new response with the same status and data
    const newResponse = NextResponse.json(data, { status: response.status });

    // Add security headers to the response
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-XSS-Protection', '1; mode=block');
    newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Only set restrictive CSP for data-focused API endpoints
    // Skip setting CSP for media-related endpoints that might affect video embeds
    if (!endpoint.includes('/media') && !endpoint.includes('/video') && !endpoint.includes('/embed')) {
      newResponse.headers.set('X-Frame-Options', 'DENY');
      newResponse.headers.set('Content-Security-Policy', "default-src 'self'");
    }

    return newResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 