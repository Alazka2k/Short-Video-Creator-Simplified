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
    
    // Initialize API client with token getter
    const client = initializeApiClient(async () => {
      try {
        // Make sure we're not in loading state
        if (auth.isLoading) {
          AuthLogger.warning('Auth is still loading, cannot get token', {
            isLoading: auth.isLoading,
            isAuthenticated: auth.isAuthenticated
          });
          throw new Error('Auth is still loading');
        }
        
        // Get user access token if authenticated
        const accessToken = localStorage.getItem("access_token");
        if (auth.isAuthenticated && accessToken) {
          try {
            // Verify token hasn't expired
            const tokenData = JSON.parse(atob(accessToken.split('.')[1]));
            if (tokenData.exp * 1000 > Date.now()) {
              AuthLogger.log('Using valid user access token');
              return accessToken;
            }
            AuthLogger.warning('Access token expired, removing from storage');
            localStorage.removeItem("access_token");
            // Try to refresh the token
            try {
              await auth.refreshToken();
              const newToken = localStorage.getItem("access_token");
              if (newToken) {
                AuthLogger.log('Successfully refreshed user token');
                return newToken;
              }
            } catch (refreshError) {
              AuthLogger.error('Failed to refresh token:', refreshError);
            }
          } catch (error) {
            AuthLogger.error('Error parsing access token:', error);
            localStorage.removeItem("access_token");
          }
        }

        // Only fall back to M2M token if not authenticated or no valid user token
        if (!auth.isAuthenticated) {
          AuthLogger.log('Not authenticated, falling back to M2M token');
          const token = await auth.getM2MToken();
          if (!token) {
            AuthLogger.error('M2M token is null or undefined');
            throw new Error('Failed to get M2M token');
          }
          return token;
        }

        // If we're authenticated but don't have a valid token, try to get a new one
        try {
          await auth.refreshToken();
          const newToken = localStorage.getItem("access_token");
          if (newToken) {
            AuthLogger.log('Successfully obtained new user token');
            return newToken;
          }
        } catch (refreshError) {
          AuthLogger.error('Failed to get new token:', refreshError);
        }

        // Last resort: M2M token
        AuthLogger.log('Falling back to M2M token as last resort');
        const token = await auth.getM2MToken();
        if (!token) {
          throw new Error('Failed to get M2M token');
        }
        return token;
      } catch (error) {
        AuthLogger.error('Failed to get token:', error);
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