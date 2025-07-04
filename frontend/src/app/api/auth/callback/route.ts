/**
 * ============================================================================
 * CUSTOM AUTH CALLBACK ROUTE - BACKEND OAUTH APPROACH
 * ============================================================================
 * 
 * This file handles OAuth callbacks when using backend-initiated OAuth flow.
 * It is NOT used by the current Auth0 SPA SDK implementation.
 * 
 * CURRENT STATUS: INACTIVE
 * - Auth0 SPA SDK handles callbacks automatically at the root domain
 * - This route remains for potential future backend OAuth implementations
 * 
 * WHEN THIS ROUTE IS USED:
 * - Backend-initiated OAuth flow (redirect to /api/auth/oauth/google)
 * - Custom OAuth implementations that bypass Auth0 SPA SDK
 * - Alternative authentication flows that require server-side processing
 * 
 * WHEN THIS ROUTE IS NOT USED:
 * - Auth0 SPA SDK authentication (current implementation)
 * - Standard social login via frontend Auth0 SDK
 * - Email/password authentication flows
 * 
 * FLOW WHEN ACTIVE:
 * 1. Backend redirects user to Auth0 with callback URL pointing here
 * 2. Auth0 redirects back to this route with authorization code
 * 3. Route exchanges code for tokens using Auth0 token endpoint
 * 4. Route fetches user profile from Auth0 userinfo endpoint
 * 5. Route calls backend /api/auth/social with user data
 * 6. Route sets authentication cookies and redirects to frontend
 * 
 * CURRENT IMPLEMENTATION: Auth0 SPA SDK bypasses this entirely
 * 
 * DEPENDENCIES WHEN ACTIVE:
 * - Auth0 domain, client ID configuration
 * - Backend /api/auth/social endpoint
 * - Proper Auth0 redirect URI configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthLogger } from '@/lib/debug/auth-logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Get the return URL from the state parameter or default to dashboard
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  // Handle authentication errors
  if (error) {
    console.error('Auth0 callback error:', { error, errorDescription });
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
  }
  
  // Parse state parameter to get return URL
  let returnTo = '/dashboard';
  if (state) {
    try {
      // Auth0 state parameter might contain our returnTo URL
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      returnTo = stateData.returnTo || '/dashboard';
    } catch (e) {
      console.warn('Could not parse Auth0 state parameter:', e);
    }
  }
  
  // Ensure the return URL is safe (same origin only)
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    returnTo = '/dashboard';
  }
  
  // Add auth callback parameter to help frontend handle the authentication
  const callbackUrl = new URL(returnTo, request.url);
  callbackUrl.searchParams.set('auth_callback', 'true');
  callbackUrl.searchParams.set('auth_time', Date.now().toString());
  
  console.log('Auth0 callback redirect:', { returnTo, callbackUrl: callbackUrl.toString() });
  
  return NextResponse.redirect(callbackUrl);
} 