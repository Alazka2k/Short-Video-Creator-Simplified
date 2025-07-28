'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * An invisible component that checks for a specific query parameter
 * to force a refresh of the user's authentication session.
 */
export function SessionRefresher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();

  useEffect(() => {
    const action = searchParams.get('action');

    // Do not proceed until the auth state is fully loaded and stable.
    if (auth.isLoading) {
      return;
    }

    if (action === 'refresh_session' && auth.isAuthenticated) {
      // Force a refresh of the user's token to get the latest custom claims.
      auth.refreshUser();

      // Clean the URL by removing the query parameter.
      // This prevents the refresh from happening again on subsequent navigations.
      const newPath = window.location.pathname;
      router.replace(newPath, { scroll: false });
    }
  }, [searchParams, auth, router]);

  // This component renders nothing.
  return null;
} 