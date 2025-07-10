# Frontend Implementation Guide

### Note: This documentation is deprecated.

## Overview

This document provides step-by-step instructions for updating the frontend to use JWT tokens with custom claims instead of the current M2M + x-user-token approach.

## Prerequisites

- Backend implementation completed ([05_Backend_Implementation.md](./05_Backend_Implementation.md))
- Auth0 configuration tested and working
- Frontend development environment set up
- Understanding of React hooks and contexts

## Implementation Steps

### Step 1: Update Environment Variables

#### 1.1 Update Frontend Configuration
```bash
# frontend/.env.local
NEXT_PUBLIC_AUTH0_DOMAIN=[your-tenant].auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=[your-spa-client-id]
NEXT_PUBLIC_AUTH0_AUDIENCE=https://narravid.io/api
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://narravid.io
NEXT_PUBLIC_AUTH0_SCOPE="openid profile email"

# Custom Claims Configuration
NEXT_PUBLIC_CUSTOM_CLAIMS_NAMESPACE=https://short-video-creator.com/

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://narravid.io/api
```

### Step 2: Update useAuth Hook

#### 2.1 Simplified Token Management
```typescript
// frontend/src/lib/hooks/useAuth.ts
import { useAuth0 } from '@auth0/auth0-react';
import { AuthLogger } from '@/lib/debug/auth-logger';

interface User {
  userId: number;
  email: string;
  name?: string;
  picture?: string;
  provider: string;
  isAdmin: boolean;
  permissions: string[];
  subscriptionPlanId: number;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  getToken: () => Promise<string>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const {
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0IsLoading,
    user: auth0User,
    getAccessTokenSilently,
    logout: auth0Logout,
  } = useAuth0();

  /**
   * Extract user information from Auth0 token with custom claims
   */
  const extractUserFromToken = async (): Promise<User | null> => {
    if (!auth0IsAuthenticated || !auth0User) {
      return null;
    }

    try {
      // Get token with custom claims
      const token = await getAccessTokenSilently();
      
      // Decode token to extract custom claims
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const namespace = process.env.NEXT_PUBLIC_CUSTOM_CLAIMS_NAMESPACE;
      
      if (!namespace) {
        throw new Error('Custom claims namespace not configured');
      }

      // Extract custom claims
      const customClaims = {
        userId: decoded[`${namespace}user_id`],
        email: decoded[`${namespace}email`],
        name: decoded[`${namespace}name`],
        picture: decoded[`${namespace}picture`],
        provider: decoded[`${namespace}provider`],
        isAdmin: decoded[`${namespace}is_admin`] || false,
        permissions: decoded[`${namespace}permissions`] || [],
        subscriptionPlanId: decoded[`${namespace}subscription_plan_id`] || 1
      };

      // Validate required fields
      if (!customClaims.userId || !customClaims.email) {
        AuthLogger.warn('Missing required custom claims in token', {
          hasUserId: !!customClaims.userId,
          hasEmail: !!customClaims.email,
          namespace
        });
        
        // Fallback to Auth0 user data
        return {
          userId: parseInt(auth0User.sub?.split('|')[1] || '0'),
          email: auth0User.email || '',
          name: auth0User.name,
          picture: auth0User.picture,
          provider: auth0User.sub?.split('|')[0] || 'unknown',
          isAdmin: false,
          permissions: [],
          subscriptionPlanId: 1
        };
      }

      AuthLogger.log('User extracted from custom claims:', {
        userId: customClaims.userId,
        email: customClaims.email,
        provider: customClaims.provider
      });

      return customClaims as User;

    } catch (error) {
      AuthLogger.error('Error extracting user from token:', error);
      
      // Fallback to Auth0 user data
      if (auth0User) {
        return {
          userId: parseInt(auth0User.sub?.split('|')[1] || '0'),
          email: auth0User.email || '',
          name: auth0User.name,
          picture: auth0User.picture,
          provider: auth0User.sub?.split('|')[0] || 'unknown',
          isAdmin: false,
          permissions: [],
          subscriptionPlanId: 1
        };
      }
      
      return null;
    }
  };

  /**
   * Get access token with custom claims
   */
  const getToken = async (): Promise<string> => {
    try {
      AuthLogger.log('Getting access token with custom claims');
      
      const token = await getAccessTokenSilently({
        cacheMode: 'off' // Ensure fresh token with latest claims
      });
      
      AuthLogger.log('Access token obtained successfully');
      return token;
      
    } catch (error) {
      AuthLogger.error('Error getting access token:', error);
      throw new Error('Failed to get access token');
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      AuthLogger.log('Logout initiated');
      
      await auth0Logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
      
      AuthLogger.log('Logout completed');
    } catch (error) {
      AuthLogger.error('Error during logout:', error);
      throw new Error('Failed to logout');
    }
  };

  // Use React Query or SWR for user data caching
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUser = async () => {
      if (auth0IsLoading) {
        return;
      }

      setIsLoading(true);
      
      try {
        if (auth0IsAuthenticated) {
          const userData = await extractUserFromToken();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        AuthLogger.error('Error loading user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [auth0IsAuthenticated, auth0IsLoading]);

  return {
    isAuthenticated: auth0IsAuthenticated && !!user,
    isLoading: auth0IsLoading || isLoading,
    user,
    getToken,
    logout
  };
}
```

### Step 3: Update API Client

#### 3.1 Simplified API Client
```typescript
// frontend/src/lib/api/apiClient.ts
import { useAuth } from '@/lib/hooks/useAuth';
import { AuthLogger } from '@/lib/debug/auth-logger';

interface ApiClientOptions {
  baseURL?: string;
  timeout?: number;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private getToken: (() => Promise<string>) | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
    this.timeout = options.timeout || 30000;
  }

  setAuthProvider(getToken: () => Promise<string>) {
    this.getToken = getToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;
    
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((fetchOptions.headers as Record<string, string>) || {})
    };

    // Add authentication if available and not skipped
    if (!skipAuth && this.getToken) {
      try {
        const token = await this.getToken();
        headers.Authorization = `Bearer ${token}`;
        
        AuthLogger.log('API request with authentication:', {
          endpoint,
          method: fetchOptions.method || 'GET',
          hasToken: !!token
        });
      } catch (error) {
        AuthLogger.error('Failed to get token for API request:', error);
        throw new Error('Authentication failed');
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      AuthLogger.log('API request successful:', {
        endpoint,
        status: response.status
      });
      
      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      AuthLogger.error('API request failed:', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Hook to use authenticated API client
export function useApiClient() {
  const { getToken } = useAuth();

  React.useEffect(() => {
    apiClient.setAuthProvider(getToken);
  }, [getToken]);

  return apiClient;
}

// Helper hook for common API operations
export function useApi() {
  const client = useApiClient();
  const { user } = useAuth();

  return {
    // User operations
    async getProfile() {
      return client.get(`/api/auth/profile`);
    },

    // Job operations
    async getJobs() {
      if (!user) throw new Error('User not authenticated');
      return client.get(`/api/job/jobs`);
    },

    async createJob(jobData: any) {
      if (!user) throw new Error('User not authenticated');
      return client.post(`/api/job/jobs`, jobData);
    },

    async getJob(jobId: string) {
      if (!user) throw new Error('User not authenticated');
      return client.get(`/api/job/jobs/${jobId}`);
    },

    // Subscription operations
    async getSubscription() {
      if (!user) throw new Error('User not authenticated');
      return client.get(`/api/subscription/subscriptions/user/${user.userId}`);
    },

    async getTokenBalance() {
      if (!user) throw new Error('User not authenticated');
      return client.get(`/api/subscription/tokens/balance/${user.userId}`);
    },

    async purchaseTokens(packageId: string) {
      if (!user) throw new Error('User not authenticated');
      return client.post(`/api/subscription/tokens/buy`, { packageId });
    }
  };
}
```

### Step 4: Update Auth Context

#### 4.1 Simplified Auth Context
```typescript
// frontend/src/lib/auth/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth0, Auth0Provider as Auth0ProviderBase } from '@auth0/auth0-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

// Create simplified context that just re-exports useAuth
const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Auth0 Provider wrapper with configuration
export function Auth0Provider({ children }: AuthProviderProps) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN!;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!;
  const redirectUri = process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI || window.location.origin;

  if (!domain || !clientId || !audience) {
    throw new Error('Missing required Auth0 configuration');
  }

  return (
    <Auth0ProviderBase
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: 'openid profile email'
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </Auth0ProviderBase>
  );
}

// Convenience export
export { useAuth };
```

### Step 5: Update Components

#### 5.1 Update Login Component
```typescript
// frontend/src/components/auth/LoginButton.tsx
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function LoginButton() {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        // Ensure we get custom claims in the token
        scope: 'openid profile email',
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE
      }
    });
  };

  return (
    <Button 
      onClick={handleLogin} 
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        'Continue with Google'
      )}
    </Button>
  );
}
```

#### 5.2 Update Profile Component
```typescript
// frontend/src/components/auth/UserProfile.tsx
import { useAuth } from '@/lib/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UserProfile() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name || 'Anonymous'}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <p><strong>Provider:</strong> {user.provider}</p>
          <p><strong>Plan:</strong> Plan {user.subscriptionPlanId}</p>
          <p><strong>Admin:</strong> {user.isAdmin ? 'Yes' : 'No'}</p>
        </div>

        <Button onClick={logout} variant="outline" className="w-full">
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### 5.3 Update Job Creation Component
```typescript
// frontend/src/components/workbench/JobList.tsx
import { useApi } from '@/lib/api/apiClient';
import { useAuth } from '@/lib/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

export function JobList() {
  const { user, isAuthenticated } = useAuth();
  const api = useApi();

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs', user?.userId],
    queryFn: () => api.getJobs(),
    enabled: isAuthenticated && !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (!isAuthenticated) {
    return <div>Please log in to view your jobs</div>;
  }

  if (isLoading) {
    return <div>Loading jobs...</div>;
  }

  if (error) {
    return <div>Error loading jobs: {error.message}</div>;
  }

  return (
    <div>
      <h2>Your Jobs</h2>
      {jobs?.length === 0 ? (
        <p>No jobs found. Create your first job!</p>
      ) : (
        <div className="grid gap-4">
          {jobs?.map((job: any) => (
            <div key={job.id} className="border p-4 rounded">
              <h3>{job.title}</h3>
              <p>Status: {job.status}</p>
              <p>Created: {new Date(job.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 6: Update Route Protection

#### 6.1 Protected Route Component
```typescript
// frontend/src/components/auth/ProtectedRoute.tsx
import { useAuth } from '@/lib/hooks/useAuth';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { LoginButton } from './LoginButton';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-xl font-semibold">Authentication Required</h2>
        <p className="text-muted-foreground">Please sign in to access this page</p>
        <LoginButton />
      </div>
    );
  }

  if (requireAdmin && !user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">
          You need administrator privileges to access this page
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
```

#### 6.2 Update Page Layout
```typescript
// frontend/src/app/layout.tsx
import { Auth0Provider } from '@/lib/auth/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <Auth0Provider>
            {children}
          </Auth0Provider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### Step 7: Remove Legacy Code

#### 7.1 Remove M2M Token Logic
```typescript
// Remove from frontend/src/lib/hooks/useAuth.ts:
// - getM2MToken function
// - M2M token caching logic
// - x-user-token header logic

// Remove from frontend/src/lib/api/apiClient.ts:
// - x-user-token header
// - M2M token requests
// - Dual token management
```

#### 7.2 Update Video Creation Hook
```typescript
// frontend/src/lib/hooks/useVideoCreationState.ts
import { useApi } from '@/lib/api/apiClient';
import { useAuth } from '@/lib/hooks/useAuth';

export function useVideoCreationState() {
  const { user } = useAuth();
  const api = useApi();

  const createJob = async (jobData: any) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // User ID and plan ID will be automatically added by backend from custom claims
    return api.createJob(jobData);
  };

  // ... rest of the hook logic
}
```

### Step 8: Update Error Handling

#### 8.1 Auth Error Handler
```typescript
// frontend/src/lib/auth/auth-errors.ts
export class AuthenticationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export function handleAuthError(error: any) {
  if (error.message?.includes('login_required')) {
    return new AuthenticationError('Please log in to continue');
  }
  
  if (error.message?.includes('access_denied')) {
    return new AuthorizationError('You do not have permission to access this resource');
  }
  
  if (error.message?.includes('token_expired')) {
    return new AuthenticationError('Your session has expired. Please log in again');
  }
  
  return new Error(error.message || 'An unknown error occurred');
}
```

#### 8.2 Error Boundary Component
```typescript
// frontend/src/components/auth/AuthErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { handleAuthError } from '@/lib/auth/auth-errors';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: handleAuthError(error) };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Authentication Error</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {this.state.error?.message || 'An unexpected authentication error occurred'}
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Step 9: Testing and Validation

#### 9.1 Test Authentication Flow
```typescript
// frontend/src/__tests__/auth.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/lib/hooks/useAuth';

// Mock Auth0
jest.mock('@auth0/auth0-react');

describe('useAuth Hook', () => {
  test('should extract user from custom claims', async () => {
    // Mock Auth0 response with custom claims
    const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...';
    
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toMatchObject({
        userId: 30,
        email: 'test@example.com',
        provider: 'google'
      });
    });
  });

  test('should handle missing custom claims gracefully', async () => {
    // Test fallback behavior
  });
});
```

#### 9.2 Test API Client
```typescript
// frontend/src/__tests__/api-client.test.tsx
import { apiClient } from '@/lib/api/apiClient';

describe('API Client', () => {
  test('should include Authorization header', async () => {
    const mockGetToken = jest.fn().mockResolvedValue('mock-token');
    apiClient.setAuthProvider(mockGetToken);
    
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' })
    });
    
    await apiClient.get('/test');
    
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );
  });
});
```

## Validation Checklist

### Frontend Implementation Checklist

- [ ] **Environment Configuration**
  - [ ] Auth0 SPA configuration updated
  - [ ] Custom claims namespace configured
  - [ ] API base URL configured

- [ ] **Authentication Hook**
  - [ ] useAuth hook simplified
  - [ ] Custom claims extraction working
  - [ ] Fallback to Auth0 data implemented
  - [ ] Error handling comprehensive

- [ ] **API Client**
  - [ ] Single token authentication
  - [ ] Authorization header only
  - [ ] Error handling improved
  - [ ] Request timeout configured

- [ ] **Components**
  - [ ] Login component updated
  - [ ] Profile component shows custom claims
  - [ ] Protected routes working
  - [ ] Job components use new API

- [ ] **Legacy Code Removal**
  - [ ] M2M token logic removed
  - [ ] x-user-token headers removed
  - [ ] Dual token management removed
  - [ ] Old auth context removed

- [ ] **Error Handling**
  - [ ] Auth error classes created
  - [ ] Error boundary implemented
  - [ ] Graceful fallbacks working
  - [ ] User-friendly error messages

- [ ] **Testing**
  - [ ] Unit tests for hooks
  - [ ] Component tests updated
  - [ ] Integration tests passing
  - [ ] Manual testing completed

## Performance Considerations

### Token Caching
```typescript
// Use React Query for token caching
import { useQuery } from '@tanstack/react-query';

export function useAuthToken() {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['auth-token'],
    queryFn: getToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3
  });
}
```

### User Data Caching
```typescript
// Cache user data from custom claims
export function useUserData() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-data', user?.userId],
    queryFn: () => user,
    enabled: !!user,
    staleTime: Infinity // User data is embedded in token
  });
}
```

## Next Steps

1. **Complete Implementation** - Follow all steps in this guide
2. **Test Thoroughly** - Use [Testing Strategy](./08_Testing_Strategy.md)
3. **Update Routes** - Proceed to [Route Updates](./07_Route_Updates.md)
4. **Final Validation** - Complete end-to-end testing

## Rollback Plan

If issues occur during frontend implementation:

1. **Immediate**: Revert to previous auth hooks
2. **Components**: Restore original components from git
3. **Configuration**: Restore original environment variables
4. **Dependencies**: Rollback package.json changes
5. **Cache**: Clear browser cache and localStorage

## Support

For frontend implementation issues:
- Check [Troubleshooting Guide](./12_Troubleshooting.md)
- Review browser console for errors
- Test Auth0 configuration separately
- Verify backend custom claims are working 