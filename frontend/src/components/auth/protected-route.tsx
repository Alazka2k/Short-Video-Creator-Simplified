'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/ui/loading';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setIsInitializing(false);
      if (!isAuthenticated) {
        router.replace('/');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  // Show nothing during SSR and initial client-side render
  if (isInitializing || isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <>{children}</> : null;
} 