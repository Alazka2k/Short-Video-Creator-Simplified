"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { createDebugger } from '@/lib/debug';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/lib/auth/AuthContext';

const debug = createDebugger('Auth0Provider');

export function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;

  if (!(domain && clientId && audience)) {
    debug.error('Auth0 configuration missing');
    return null;
  }

  const onRedirectCallback = (appState: any) => {
    try {
      debug.log('Auth redirect callback', { appState });
      router.push(appState?.returnTo || '/dashboard');
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
        scope: "openid profile email offline_access"
      }}
      onRedirectCallback={onRedirectCallback}
      skipRedirectCallback={typeof window === 'undefined'}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </Auth0Provider>
  );
} 