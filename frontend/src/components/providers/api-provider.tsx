'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { initializeApiClient } from '@/lib/api/apiClient';
import { AuthLogger } from '@/lib/debug/auth-logger';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

export function ApiProvider({ children }: { children: React.ReactNode }) {
  console.log('API Provider rendered');

  const handleAuthInit = (auth: any) => {
    //console.log('Auth initialization started');
    
    const client = initializeApiClient(async () => {
      try {
        const token = await auth.getM2MToken();
        if (!token) {
          throw new Error('Failed to get M2M token');
        }
        return token;
      } catch (error) {
        AuthLogger.error('Failed to get M2M token:', error);
        throw error;
      }
    });

    AuthLogger.log('API client initialized');
  };

  return (
    <AuthProvider onInit={handleAuthInit}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AuthProvider>
  );
} 