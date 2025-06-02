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
  try {
    const { searchParams, origin } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/dashboard';
    
    AuthLogger.log('Callback handler started', {
      returnTo,
      searchParams: Object.fromEntries(searchParams.entries()),
      origin
    });

    // Check if we have Auth0 callback parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (!code) {
      AuthLogger.error('No authorization code in callback');
      return NextResponse.redirect(`${origin}/login?error=no_code`);
    }

    AuthLogger.log('Authorization code found, exchanging for tokens');

    // Exchange authorization code for tokens using Auth0's token endpoint
    const tokenResponse = await fetch(`https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID,
        code,
        redirect_uri: `${origin}/api/auth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      AuthLogger.error('Token exchange failed', { status: tokenResponse.status, error });
      return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();
    AuthLogger.log('Token exchange successful');

    // Get user profile using the access token
    const userResponse = await fetch(`https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      AuthLogger.error('Failed to get user profile');
      return NextResponse.redirect(`${origin}/login?error=profile_fetch_failed`);
    }

    const auth0User = await userResponse.json();
    AuthLogger.log('Got Auth0 user profile', {
      sub: auth0User.sub,
      email: auth0User.email,
      provider: auth0User.sub?.split('|')[0]
    });

    // Extract provider and prepare for backend
    const provider = auth0User.sub?.split('|')[0] || 'unknown';
    
    if (provider !== 'google-oauth2') {
      AuthLogger.log('Not a social login, redirecting to login');
      return NextResponse.redirect(`${origin}/login?error=unsupported_provider`);
    }

    // Send to your backend social auth endpoint
    AuthLogger.log('Sending social auth data to backend');
    
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/social`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: tokens.access_token,
        provider: 'google',
        profile: {
          sub: auth0User.sub,
          email: auth0User.email,
          name: auth0User.name,
          picture: auth0User.picture,
        },
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      AuthLogger.error('Backend social auth failed', {
        status: backendResponse.status,
        error: errorData
      });
      return NextResponse.redirect(`${origin}/login?error=backend_auth_failed`);
    }

    const backendData = await backendResponse.json();
    AuthLogger.log('Backend social auth successful', {
      userId: backendData.user?.user_id,
      email: backendData.user?.email
    });

    // Create response with redirect
    const redirectUrl = `${origin}${returnTo}?auth_callback=true&auth_time=${Date.now()}`;
    const response = NextResponse.redirect(redirectUrl);

    // Set auth cookies from backend response
    if (backendData.tokens) {
      if (backendData.tokens.access_token) {
        response.cookies.set('access_token', backendData.tokens.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: backendData.tokens.expires_in || 3600,
          path: '/'
        });
      }
      
      if (backendData.tokens.refresh_token) {
        response.cookies.set('refresh_token', backendData.tokens.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/'
        });
      }
    }

    // Store user data in localStorage via a temporary cookie
    // (since we can't directly access localStorage from server-side)
    if (backendData.user) {
      response.cookies.set('temp_user_data', JSON.stringify(backendData.user), {
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60, // 1 minute - just long enough to transfer to localStorage
        path: '/'
      });
    }

    AuthLogger.log('Redirecting to final destination', { redirectUrl });
    return response;

  } catch (error) {
    AuthLogger.error('Callback handler error:', error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/login?error=callback_error`);
  }
} 