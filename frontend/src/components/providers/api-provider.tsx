'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { initializeApiClient } from '@/lib/api/apiClient';
import { AuthLogger } from '@/lib/debug/auth-logger';

export function ApiProvider({ children }: { children: React.ReactNode }) {
  console.log('API Provider rendered');

  const handleAuthInit = (auth: any) => {
    console.log('Auth initialization started');
    
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
      {children}
    </AuthProvider>
  );
} 