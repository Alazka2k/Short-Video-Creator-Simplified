"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { createDebugger } from '@/lib/debug';
import { useRouter } from 'next/navigation';

const debug = createDebugger('Auth0Provider');

export function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;

  if (typeof window === 'undefined') {
    return null;
  }

  if (!(domain && clientId && audience)) {
    debug.error('Auth0 configuration missing');
    return null;
  }

  const onRedirectCallback = (appState: any) => {
    debug.log('Auth redirect callback', { appState, pathname: window.location.pathname });
    
    // If we're already on the dashboard, don't redirect
    if (window.location.pathname === '/dashboard') {
      return;
    }
    
    // Otherwise, redirect to the intended destination
    router.replace(appState?.returnTo || '/dashboard');
  };

  // Add these options to customize the appearance
  const config = {
    auth: {
      params: {
        prompt: "select_account",
      },
      responseType: 'token id_token',
      scope: 'openid profile email',
    },
    theme: {
      colorPrimary: '#8B5CF6', // violet-500
      colorBackground: '#ffffff',
      colorText: '#111827',
      fontFamily: 'Inter, sans-serif',
      primaryButtonBorderRadius: '0.5rem',
      primaryButtonBackgroundColor: '#8B5CF6',
      primaryButtonHoverBackgroundColor: '#7C3AED',
      primaryButtonTextColor: '#ffffff',
      secondaryButtonBorderRadius: '0.5rem',
      secondaryButtonBorderColor: '#E5E7EB',
      secondaryButtonBackgroundColor: '#ffffff',
      secondaryButtonHoverBackgroundColor: '#F3F4F6',
      secondaryButtonTextColor: '#374151',
      inputBorderRadius: '0.5rem',
      inputBorderColor: '#E5E7EB',
      inputTextColor: '#111827',
      inputPlaceholderTextColor: '#9CA3AF',
    },
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/dashboard`,
        audience: audience
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      {...config}
    >
      {children}
    </Auth0Provider>
  );
} 