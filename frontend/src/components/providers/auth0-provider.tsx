"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { createDebugger } from '@/lib/debug';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { useEffect, useState, useRef } from 'react';

const debug = createDebugger('Auth0Provider');

// Helper to check if we're in a new tab or window
const isNewTabOrWindow = () => {
  try {
    return !document.referrer.includes(window.location.host);
  } catch (e) {
    return false;
  }
};

// Helper to check if we've just been redirected from Auth0
const isPostAuthRedirect = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for presence of Auth0 transaction ID in storage
  try {
    return !!localStorage.getItem('a0.spajs.txs');
  } catch (e) {
    return false;
  }
};

export function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const isNewTab = useRef<boolean>(isNewTabOrWindow());
  const isPostRedirect = useRef<boolean>(Boolean(isPostAuthRedirect()));
  
  // Capture returnTo parameter from URL or use current path
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
    
    // Mark initialization as complete
    setIsInitializing(false);
  }, [pathname, searchParams]);

  // For auth callback, expedite initialization
  useEffect(() => {
    if (pathname.includes('/api/auth/callback')) {
      debug.log('On callback page, expediting initialization');
      setIsInitializing(false);
    }
  }, [pathname]);

  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID;
  
  /*debug.log('Initializing Auth0Provider with config:', {
    domain: domain ? 'set' : 'missing',
    clientId: clientId ? 'set' : 'missing',
    audience: audience ? 'set' : 'missing',
    pathname,
    returnTo,
    isNewTab: isNewTab.current
  });*/

  if (!(domain && clientId && audience)) {
    debug.error('Auth0 configuration missing');
    return null;
  }

  const onRedirectCallback = (appState: any) => {
    try {
      debug.log('Auth redirect callback', { appState });
      
      // If appState has a returnTo, use that, otherwise default to dashboard
      let returnUrl = appState?.returnTo || '/dashboard';
      
      // Make sure the URL starts with a slash
      if (!returnUrl.startsWith('/')) {
        returnUrl = '/' + returnUrl;
      }
      
      debug.log(`Redirecting to ${returnUrl}`);
      router.push(returnUrl);
    } catch (error) {
      debug.error('Redirect error:', error);
      router.push('/dashboard');
    }
  };

  // While we're initializing, show a blank screen to avoid flashing content
  // But don't wait for initialization on first load or post-redirect to reduce delay
  if (isInitializing && !isNewTab.current && !isPostRedirect.current) {
    return null;
  }

  // Log key diagnostics before rendering provider
  if (isPostRedirect.current) {
    debug.log('Rendering Auth0Provider post-redirect', { pathname });
  }

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
      skipRedirectCallback={typeof window === 'undefined' || pathname.includes('/api/auth/callback')}
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