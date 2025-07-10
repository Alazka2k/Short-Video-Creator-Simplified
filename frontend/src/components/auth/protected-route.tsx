'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuth0 } from '@auth0/auth0-react';
import { LoadingScreen } from '@/components/ui/loading';
import { usePathname } from 'next/navigation';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { loginWithRedirect, isLoading: auth0IsLoading } = useAuth0();
  const pathname = usePathname();

  const totalIsLoading = isLoading || auth0IsLoading;

  useEffect(() => {
    if (!totalIsLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: {
          returnTo: pathname,
        },
      });
    }
  }, [totalIsLoading, isAuthenticated, loginWithRedirect, pathname]);

  if (totalIsLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Return null to prevent rendering anything while the redirect happens
  return null;
}