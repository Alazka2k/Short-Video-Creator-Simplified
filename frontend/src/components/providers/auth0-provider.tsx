/**
 * ============================================================================
 * AUTH0 PROVIDER WRAPPER - CLIENT-SIDE AUTHENTICATION INITIALIZATION
 * ============================================================================
 * 
 * This component configures and provides the Auth0 authentication context
 * for the entire application. It wraps the Auth0Provider with our application's
 * specific configuration and handles client-side authentication setup.
 * 
 * CONFIGURATION DETAILS:
 * 
 * 1. DOMAIN & CLIENT_ID
 *    - Retrieved from environment variables
 *    - Points to your Auth0 tenant and application
 * 
 * 2. REDIRECT_URI
 *    - Set to '/api/auth/callback' for server-side callback handling
 *    - Enables proper integration with our backend authentication flow
 * 
 * 3. AUDIENCE
 *    - Defines the API audience for access tokens
 *    - Required for API authorization and M2M token generation
 * 
 * 4. SCOPE
 *    - 'openid profile email offline_access' for user info and refresh tokens
 *    - offline_access enables refresh token rotation
 * 
 * 5. USE_REFRESH_TOKENS
 *    - Enables refresh token rotation for enhanced security
 *    - Allows long-term authentication without re-login
 * 
 * 6. CACHE_LOCATION
 *    - 'localstorage' for persistent authentication across tabs
 *    - Alternative: 'memory' for session-only authentication
 * 
 * RETURN-TO FUNCTIONALITY:
 * - Captures intended destination from URL parameters or current path
 * - Preserves user's intended navigation after authentication
 * - Excludes auth-related pages from return-to logic
 * 
 * AUTHENTICATION FLOW:
 * 1. User clicks login → Auth0 loginWithRedirect()
 * 2. Auth0 handles OAuth flow with configured providers
 * 3. Auth0 redirects to /api/auth/callback with authorization code
 * 4. Our backend processes the callback and handles user creation/login
 * 5. onRedirectCallback() routes user to intended destination
 * 
 * INTEGRATION WITH AUTHCONTEXT:
 * - This provider enables useAuth0() hook in AuthContext
 * - AuthContext detects Auth0 authentication and syncs with backend
 * - Provides seamless hybrid authentication experience
 * 
 * DEPENDENCIES:
 * - @auth0/auth0-react: Official Auth0 React SDK
 * - Environment variables: AUTH0_DOMAIN, AUTH0_SPA_CLIENT_ID, AUTH0_AUDIENCE
 * - Next.js navigation hooks for redirect handling
 * 
 * USAGE:
 * This component should wrap your entire application at the root level,
 * typically in layout.tsx.
 * 
 * ```tsx
 * <Auth0ProviderWrapper>
 *   <YourApp />
 * </Auth0ProviderWrapper>
 * ```
 * 
 * TROUBLESHOOTING:
 * - 'Invalid state' errors: Check redirect_uri configuration
 * - Token issues: Verify audience and scope settings
 * - Login loops: Check domain and client_id environment variables
 * - CORS errors: Verify Auth0 application URLs and callback settings
 * - Redirect issues: Check onRedirectCallback logic and returnTo handling
 * 
 * Last Updated: 2025-06-30
 * Architecture: Auth0 React SDK Wrapper with Custom Navigation
 */

"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { createDebugger } from '@/lib/debug';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { useEffect, useState } from 'react';

const debug = createDebugger('Auth0Provider');

/**
 * Auth0 Provider wrapper component that configures authentication for the entire application.
 * Handles return-to URL preservation and Auth0 redirect callback processing.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with Auth0 context
 * @returns {JSX.Element} Auth0Provider configured with app-specific settings
 */
export function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [returnTo, setReturnTo] = useState<string | null>(null);
  
  /**
   * Capture returnTo parameter from URL or use current path.
   * This preserves the user's intended destination after authentication.
   * Excludes auth-related pages to prevent redirect loops.
   */
  useEffect(() => {
    const queryReturnTo = searchParams.get('returnTo');
    
    if (queryReturnTo) {
      const decodedReturnTo = decodeURIComponent(queryReturnTo);
      debug.log('Found returnTo in query params', { returnTo: decodedReturnTo });
      setReturnTo(decodedReturnTo);
    } else if (pathname !== '/login' && pathname !== '/signup' && !pathname.includes('/reset-password')) {
      debug.log('Using current path as returnTo', { pathname });
      setReturnTo(pathname);
    }
  }, [pathname, searchParams]);

  // Load Auth0 configuration from environment variables
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID;

  // Verify required configuration is present
  if (!(domain && clientId && audience)) {
    debug.error('Auth0 configuration missing - check environment variables');
    return null;
  }

  /**
   * Handle Auth0 redirect callback after successful authentication.
   * Routes the user to their intended destination or dashboard fallback.
   * 
   * @param {any} appState - Auth0 app state containing returnTo information
   */
  const onRedirectCallback = (appState: any) => {
    try {
      debug.log('Auth0 redirect callback', { 
        appState, 
        pathname,
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'undefined'
      });
      
      // If appState has a returnTo, use that, otherwise default to dashboard
      let returnUrl = appState?.returnTo || '/dashboard';
      
      // Ensure the URL starts with a slash for proper routing
      if (!returnUrl.startsWith('/')) {
        returnUrl = '/' + returnUrl;
      }
      
      debug.log(`Redirecting to ${returnUrl}`);
      router.push(returnUrl);
    } catch (error) {
      debug.error('Redirect error:', error);
      // Fallback to dashboard if redirect fails
      router.push('/dashboard');
    }
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined,
        audience: audience,
        scope: "openid profile email offline_access",
        // Include return path in appState for return after login
        ...(returnTo && { appState: { returnTo } })
      }}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      useRefreshTokensFallback={true}
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </Auth0Provider>
  );
} 