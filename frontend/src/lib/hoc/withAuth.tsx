"use client";

import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRouter } from 'next/navigation';
import { ComponentType, useEffect } from 'react';

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: {
    requireAuth?: boolean;
    redirectTo?: string;
    LoadingComponent?: ComponentType;
  } = {}
) {
  const {
    requireAuth = true,
    redirectTo = '/login',
    LoadingComponent = LoadingSpinner
  } = options;

  return function AuthProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
      return <LoadingComponent />;
    }

    if (requireAuth && !isAuthenticated) {
      return null; // Component will be redirected
    }

    return <WrappedComponent {...props} />;
  };
} 