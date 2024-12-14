# Frontend Authentication Implementation

## Core Components

### 1. Auth Provider (`src/lib/auth/auth-provider.tsx`)
Central authentication state management:

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: Error | null;
}

interface AuthContextValue extends AuthState {
  login: (provider: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session
        const session = await auth0.checkSession();
        if (session) {
          const user = await fetchUserProfile(session.accessToken);
          dispatch({ type: 'SET_USER', payload: user });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error });
      }
    };
    initAuth();
  }, []);

  // Token refresh logic
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      if (state.isAuthenticated) {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. Auth Hooks (`src/lib/auth/hooks.ts`)
Custom hooks for auth functionality:

```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.push('/login');
    }
  }, [auth.loading, auth.isAuthenticated]);

  return auth;
}

export function usePermissions(requiredPermission?: string) {
  const { user } = useAuth();
  const hasPermission = useMemo(() => {
    if (!requiredPermission || !user?.permissions) return true;
    return user.permissions.includes(requiredPermission);
  }, [user?.permissions, requiredPermission]);

  return { hasPermission };
}
```

### 3. Protected Components

#### Route Guard (`components/auth/protected-route.tsx`)
```typescript
interface ProtectedRouteProps {
  requiredPermission?: string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredPermission,
  children
}) => {
  const { isAuthenticated, loading } = useAuth();
  const { hasPermission } = usePermissions(requiredPermission);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace({
        pathname: '/login',
        query: { returnUrl: router.asPath }
      });
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !hasPermission) {
    return null;
  }

  return <>{children}</>;
};
```

#### Login Form (`components/auth/login-form.tsx`)
```typescript
export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSocialLogin = async (provider: string) => {
    try {
      setIsLoading(true);
      await login(provider);
      toast({
        title: 'Welcome!',
        description: 'Successfully signed in.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign in. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Button
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading}
        >
          <GoogleIcon className="mr-2" />
          Sign in with Google
        </Button>
        {/* Other login options */}
      </CardContent>
    </Card>
  );
};
```

## Token Management

### Storage Strategy
```typescript
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'auth_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';

  static storeTokens(tokens: AuthTokens): void {
    // Access token in memory only
    this.accessToken = tokens.accessToken;
    
    // Refresh token in HTTP-only cookie
    document.cookie = `${this.REFRESH_TOKEN_KEY}=${tokens.refreshToken}; path=/; secure; samesite=strict; httponly`;
  }

  static async refreshTokens(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) throw new Error('Token refresh failed');

    const tokens = await response.json();
    this.storeTokens(tokens);
    return tokens;
  }
}
```

### Auto Refresh Logic
```typescript
function useTokenRefresh() {
  const { refreshToken } = useAuth();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleRefresh = (expiresIn: number) => {
      // Refresh 5 minutes before expiry
      const refreshTime = (expiresIn - 300) * 1000;
      timeoutId = setTimeout(refreshToken, refreshTime);
    };

    if (isAuthenticated) {
      const token = parseJwt(accessToken);
      const expiresIn = token.exp - Date.now() / 1000;
      scheduleRefresh(expiresIn);
    }

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, accessToken]);
}
```

## Error Handling

```typescript
class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public action?: string
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

const handleAuthError = (error: unknown) => {
  if (error instanceof AuthenticationError) {
    switch (error.code) {
      case 'token_expired':
        return 'Your session has expired. Please sign in again.';
      case 'invalid_grant':
        return 'Invalid credentials. Please check your email and password.';
      case 'too_many_attempts':
        return `Too many sign-in attempts. Please try again in ${error.action}.`;
      default:
        return 'Authentication failed. Please try again.';
    }
  }
  return 'An unexpected error occurred. Please try again later.';
};
```