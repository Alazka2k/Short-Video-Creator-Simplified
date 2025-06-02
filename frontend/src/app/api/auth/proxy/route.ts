import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function to debug headers
function logHeaders(headers: Headers, prefix: string) {
  //console.log(`${prefix} Headers:`);
  //headers.forEach((value, key) => {
  //  console.log(`  ${key}: ${key === 'authorization' ? '(hidden)' : value}`);
  //});
}

// Helper function to forward the request - NOT CURRENTLY USED
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

    // For debugging
    if (process.env.NODE_ENV === 'development') {
      //logHeaders(request.headers, 'Request');
    }

    // Forward the request to the backend
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
      'X-Real-IP': request.headers.get('x-real-ip') || '',
      'X-Request-ID': crypto.randomUUID(),
    };

    // Forward Authorization header if present
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log('Forwarding Authorization header');
    } else {
      console.log('No Authorization header found in request');
      
      // Check if there's a token in the cookies or query params as fallback
      const token = request.cookies.get('access_token')?.value || searchParams.get('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Using fallback token from cookies/query');
      }
    }
    
    // Add security token if available
    if (process.env.API_SECURITY_TOKEN) {
      headers['X-Security-Token'] = process.env.API_SECURITY_TOKEN;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    // For debugging
    if (process.env.NODE_ENV === 'development') {
      //logHeaders(response.headers, 'Response');
    }

    // Get the response data
    const data = await response.json();

    // Create a new response with the same status and data
    const newResponse = NextResponse.json(data, { status: response.status });

    // Add security headers to the response
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-Frame-Options', 'DENY');
    newResponse.headers.set('X-XSS-Protection', '1; mode=block');
    newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    newResponse.headers.set('Content-Security-Policy', "default-src 'self'");

    // Forward any cookies from the backend
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      newResponse.headers.set('Set-Cookie', setCookie);
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

    // For debugging
    if (process.env.NODE_ENV === 'development') {
      //logHeaders(request.headers, 'Request');
    }

    // Get the request body
    const body = await request.json();
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
      'X-Real-IP': request.headers.get('x-real-ip') || '',
      'X-Request-ID': crypto.randomUUID(),
    };
    
    // Forward Authorization header if present
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log('Forwarding Authorization header');
    } else {
      console.log('No Authorization header found in request');
      
      // Check if there's a token in the body for auth endpoints
      if (endpoint.includes('/auth/') && body.refreshToken) {
        // Don't need Authorization header for refresh token endpoint
        console.log('Using refresh token from body');
      } else if (body.token) {
        headers['Authorization'] = `Bearer ${body.token}`;
        console.log('Using token from request body');
      } else {
        // Check if there's a token in the cookies as fallback
        const token = request.cookies.get('access_token')?.value;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('Using fallback token from cookies');
        }
      }
    }
    
    // Add security token if available
    if (process.env.API_SECURITY_TOKEN) {
      headers['X-Security-Token'] = process.env.API_SECURITY_TOKEN;
    }

    // Forward the request to the backend
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });

    // For debugging
    if (process.env.NODE_ENV === 'development') {
      //logHeaders(response.headers, 'Response');
    }

    // Get the response data
    const data = await response.json();

    // Create a new response with the same status and data
    const newResponse = NextResponse.json(data, { status: response.status });

    // Add security headers to the response
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-Frame-Options', 'DENY');
    newResponse.headers.set('X-XSS-Protection', '1; mode=block');
    newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    newResponse.headers.set('Content-Security-Policy', "default-src 'self'");

    // Forward any cookies from the backend
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      newResponse.headers.set('Set-Cookie', setCookie);
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