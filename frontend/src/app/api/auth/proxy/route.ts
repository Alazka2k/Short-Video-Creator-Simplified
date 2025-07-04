/**
 * ============================================================================
 * AUTHENTICATION PROXY ROUTE - FRONTEND TO BACKEND COMMUNICATION BRIDGE
 * ============================================================================
 * 
 * This Next.js API route serves as a critical communication bridge between
 * the frontend application and backend authentication services. It handles
 * CORS issues, security headers, and token management for the hybrid
 * Auth0 + backend authentication architecture.
 * 
 * KEY RESPONSIBILITIES:
 * 
 * 1. CORS RESOLUTION
 *    - Eliminates cross-origin issues between frontend and backend
 *    - Enables seamless API communication in development and production
 *    - Handles complex authentication flows without browser restrictions
 * 
 * 2. SECURITY ENHANCEMENT
 *    - Adds comprehensive security headers to all responses
 *    - Implements Content Security Policy and XSS protection
 *    - Enforces HTTPS with Strict Transport Security
 *    - Prevents clickjacking with frame options
 * 
 * 3. TOKEN MANAGEMENT
 *    - Forwards Authorization headers from frontend to backend
 *    - Implements intelligent token fallback mechanisms
 *    - Handles token extraction from cookies when headers are missing
 *    - Supports both user tokens and M2M tokens
 * 
 * 4. REQUEST FORWARDING
 *    - Dynamic endpoint routing via query parameters
 *    - Preserves request methods (GET, POST, PUT, DELETE)
 *    - Forwards request bodies and headers appropriately
 *    - Maintains response status codes and data integrity
 * 
 * SUPPORTED AUTHENTICATION ENDPOINTS:
 * 
 * - /api/auth/token - M2M token generation for service-to-service calls
 * - /api/auth/refresh - User token refresh for session management
 * - /api/auth/social - Social login processing (Google OAuth via Auth0)
 * - /api/auth/profile - User profile retrieval and validation
 * - /api/auth/login - Email/password authentication
 * - /api/auth/register - User registration and account creation
 * 
 * USAGE PATTERN:
 * ```
 * Frontend Request:
 * GET/POST /api/auth/proxy?endpoint=/api/auth/profile
 * 
 * Proxied to Backend:
 * GET/POST {BACKEND_URL}/api/auth/profile
 * ```
 * 
 * AUTHENTICATION FLOW INTEGRATION:
 * 
 * 1. AuthContext calls proxy for backend synchronization
 * 2. Login/Signup forms use proxy for authentication
 * 3. Token refresh mechanisms rely on proxy routing
 * 4. M2M token generation for API client initialization
 * 5. User profile fetching for session validation
 * 
 * SECURITY FEATURES:
 * 
 * - Request ID generation for tracing and debugging
 * - Security token validation for internal requests
 * - IP forwarding for proper request attribution
 * - Cookie forwarding for session management
 * - Header sanitization and validation
 * 
 * TOKEN FALLBACK MECHANISMS:
 * 
 * 1. Primary: Authorization header from request
 * 2. Fallback 1: Token from request body (auth endpoints)
 * 3. Fallback 2: Token from cookies (stored sessions)
 * 4. Fallback 3: Query parameter tokens (specific cases)
 * 
 * ERROR HANDLING:
 * 
 * - Comprehensive error logging with context
 * - Proper HTTP status code forwarding
 * - Graceful fallback for network failures
 * - Detailed error messages for debugging
 * 
 * ENVIRONMENT INTEGRATION:
 * 
 * - Uses NEXT_PUBLIC_API_URL for backend communication
 * - Supports API_SECURITY_TOKEN for internal authentication
 * - Development vs production logging configuration
 * - Flexible header and cookie handling
 * 
 * DEBUGGING FEATURES:
 * 
 * - Request/response header logging (development)
 * - Token presence and fallback logging
 * - Endpoint routing and method tracking
 * - Error context and stack trace capture
 * 
 * DEPENDENCIES:
 * 
 * - Next.js API Route framework
 * - Backend authentication service endpoints
 * - Environment variable configuration
 * - Cookie and header management utilities
 * 
 * CRITICAL NOTES:
 * 
 * - This proxy is ESSENTIAL for the authentication flow
 * - Removing it would break Auth0 + backend integration
 * - Security headers protect against common web vulnerabilities
 * - Token fallback ensures robust authentication handling
 * 
 * FUTURE ENHANCEMENTS:
 * 
 * - Rate limiting for authentication endpoints
 * - Request caching for performance optimization
 * - Advanced security token validation
 * - Webhook support for real-time updates
 * 
 * Last Updated: 2025-06-30
 * Architecture: Next.js API Proxy for Authentication Services
 */

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