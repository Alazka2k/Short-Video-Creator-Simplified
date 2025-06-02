"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { createDebugger } from '@/lib/debug';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { useEffect, useState } from 'react';

const debug = createDebugger('Auth0Provider');

export function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [returnTo, setReturnTo] = useState<string | null>(null);
  
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
  }, [pathname, searchParams]);

  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID;

  if (!(domain && clientId && audience)) {
    debug.error('Auth0 configuration missing');
    return null;
  }

  const onRedirectCallback = (appState: any) => {
    try {
      debug.log('Auth0 redirect callback', { 
        appState, 
        pathname,
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'undefined'
      });
      
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

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
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