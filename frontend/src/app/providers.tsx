import { AuthProvider } from '@/lib/auth/AuthContext';
import { initializeApiClient, ApiRequestConfig, ApiResponse, ApiError } from '@/lib/api/apiClient';
import { AuthLogger } from '@/lib/debug/auth-logger';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Auth0ProviderWrapper } from '@/components/providers/auth0-provider';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  console.log('Providers component rendered');

  const handleAuthInit = (auth: any) => {
    console.log('AuthProvider onInit called', {
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated
    });

    AuthLogger.log('Starting API client initialization', {
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated
    });
    
    // Initialize API client with M2M token getter
    const client = initializeApiClient(async () => {
      try {
        // Make sure we're not in loading state
        if (auth.isLoading) {
          AuthLogger.warning('Auth is still loading, cannot get M2M token', {
            isLoading: auth.isLoading,
            isAuthenticated: auth.isAuthenticated
          });
          throw new Error('Auth is still loading');
        }
        
        // Make sure we're authenticated
        if (!auth.isAuthenticated) {
          AuthLogger.warning('User is not authenticated, cannot get M2M token', {
            isLoading: auth.isLoading,
            isAuthenticated: auth.isAuthenticated
          });
          throw new Error('User is not authenticated');
        }

        AuthLogger.log('Attempting to get M2M token', {
          isLoading: auth.isLoading,
          isAuthenticated: auth.isAuthenticated
        });

        const token = await auth.getM2MToken();
        if (!token) {
          AuthLogger.error('M2M token is null or undefined');
          throw new Error('Failed to get M2M token');
        }

        AuthLogger.log('Successfully retrieved M2M token');
        return token;
      } catch (error) {
        AuthLogger.error('Failed to get M2M token:', error);
        throw error;
      }
    });
    
    // Add request timing
    client.addRequestInterceptor(async (config: ApiRequestConfig) => {
      (config as any)._startTime = Date.now();
      AuthLogger.log('Request interceptor added', { url: config.method });
      return config;
    });

    // Add response timing and logging
    client.addResponseInterceptor(async (response: ApiResponse) => {
      const config = response.config;
      if (config && (config as any)._startTime) {
        const duration = Date.now() - (config as any)._startTime;
        AuthLogger.log(`Request completed in ${duration}ms`, {
          url: config.method,
          status: 'success'
        });
      }
      return response;
    });

    // Add error handling
    client.addErrorInterceptor(async (error: ApiError): Promise<never> => {
      if (error.status === 401) {
        AuthLogger.error('Unauthorized request, redirecting to login', {
          status: error.status,
          message: error.message
        });
        auth.logout();
      }
      throw error;
    });

    AuthLogger.log('API client initialization complete', {
      isInitialized: true,
      hasToken: !!auth.getM2MToken
    });
  };

  return (
    <Auth0ProviderWrapper>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
        storageKey="video-creator-theme"
      >
        <AuthProvider onInit={handleAuthInit}>
          {children}
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </Auth0ProviderWrapper>
  );
} 