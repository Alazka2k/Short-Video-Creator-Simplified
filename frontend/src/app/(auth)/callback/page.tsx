'use client';

import { LoadingScreen } from '@/components/ui/loading';

export default function AuthCallbackPage() {
  // This page's sole purpose is to provide a UI while the Auth0 SDK
  // processes the authentication code and redirects.
  // The actual redirect logic is handled by the `onRedirectCallback`
  // in `Auth0ProviderWrapper`.
  return <LoadingScreen />;
} 