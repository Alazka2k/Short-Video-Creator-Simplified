'use client';

import { useEffect, useRef } from 'react';
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
  const initAttempted = useRef(false);
  const initSuccess = useRef(false);
  
  // Try to initialize immediately if we have a token
  useEffect(() => {
    const preInitialize = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token && !initSuccess.current) {
          AuthLogger.log('Found token in storage, pre-initializing API client');
          
          // Use token from localStorage for pre-initialization
          initializeApiClient(async () => {
            return token;
          });
          
          initSuccess.current = true;
        }
      } catch (error) {
        AuthLogger.error('Pre-initialization failed:', error);
        // Will be retried in regular initialization
      }
    };
    
    preInitialize();
  }, []);

  const handleAuthInit = (auth: any) => {
    if (initAttempted.current && initSuccess.current) {
      AuthLogger.log('API client already successfully initialized, skipping');
      return;
    }

    initAttempted.current = true;
    
    try {
      AuthLogger.log('Initializing API client with Auth tokens');
      
      const client = initializeApiClient(async () => {
        try {
          const token = await auth.getM2MToken();
          if (!token) {
            throw new Error('Failed to get M2M token');
          }
          return token;
        } catch (error) {
          AuthLogger.error('Failed to get M2M token:', error);
          
          // Fall back to access token if M2M token fails
          const fallbackToken = localStorage.getItem('access_token');
          if (fallbackToken) {
            AuthLogger.log('Using fallback access token');
            return fallbackToken;
          }
          
          throw error;
        }
      });

      initSuccess.current = true;
      AuthLogger.log('API client initialized successfully with Auth tokens');
    } catch (error) {
      AuthLogger.error('Failed to initialize API client:', error);
      
      // Retry initialization after a short delay (only if not already successful)
      setTimeout(() => {
        if (!initSuccess.current) {
          AuthLogger.log('Retrying API client initialization');
          handleAuthInit(auth);
        }
      }, 500);
    }
  };

  // Handle page visibility changes to reinitialize API client if needed
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !initSuccess.current) {
        AuthLogger.log('Page became visible, checking API client initialization');
        
        // Check if we have a token in localStorage but API client is not initialized
        const hasToken = !!localStorage.getItem('access_token');
        
        if (hasToken && !initSuccess.current) {
          AuthLogger.log('Token exists but API client not initialized');
          
          // Pre-initialize with token from localStorage
          initializeApiClient(async () => {
            return localStorage.getItem('access_token') || '';
          });
          
          initSuccess.current = true;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <AuthProvider onInit={handleAuthInit}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AuthProvider>
  );
} 