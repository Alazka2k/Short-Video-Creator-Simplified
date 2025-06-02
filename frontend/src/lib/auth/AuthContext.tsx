'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthLogger } from "@/lib/debug/auth-logger";
import { auth0M2MConfig } from "./config";
import { useAuth0 } from '@auth0/auth0-react';

interface User {
  user_id: number;
  email: string;
  name?: string;
  picture?: string;
  provider: string;
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (user: User, tokens: Tokens) => Promise<void>;
  logout: () => Promise<void>;
  getM2MToken: () => Promise<string>;
}

interface AuthProviderProps {
  children: React.ReactNode;
  onInit?: (auth: AuthContextType) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const M2M_TOKEN_KEY = 'auth_m2m_token';
const M2M_TOKEN_EXPIRY_KEY = 'auth_m2m_token_expiry';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const AUTH_STATE_KEY = 'auth_state';

// Add token validation helper
const isTokenExpired = (token: string): boolean => {
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    // Check if token expires in less than 1 minute (was 5 minutes before - too aggressive)
    return tokenData.exp * 1000 <= Date.now() + 1 * 60 * 1000;
  } catch (error) {
    AuthLogger.error('Token validation error:', error);
    // Don't automatically consider expired on parsing error - safer approach
    return false;
  }
};

// Helper to check if we're in a new tab or window
const isNewTabOrWindow = () => {
  try {
    return !document.referrer.includes(window.location.host);
  } catch (e) {
    return false;
  }
};

export function AuthProvider({ children, onInit }: AuthProviderProps) {
  const {
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0Loading,
    user: auth0User,
    getAccessTokenSilently,
    logout: auth0Logout,
    loginWithRedirect
  } = useAuth0();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [authAttempted, setAuthAttempted] = useState(false);
  const [authRestoreAttempted, setAuthRestoreAttempted] = useState(false);

  // Define the logout function early to avoid reference issues
  const logout = useCallback(async () => {
    try {
      AuthLogger.log('Logout initiated');
      
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      
      // Clear localStorage tokens
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(M2M_TOKEN_KEY);
      localStorage.removeItem(M2M_TOKEN_EXPIRY_KEY);
      localStorage.removeItem(AUTH_STATE_KEY);
      
      setUser(null);
      
      await auth0Logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
      
      AuthLogger.log('Logout completed');
    } catch (error) {
      AuthLogger.error('Error during logout:', error);
    }
  }, [auth0Logout, refreshInterval]);

  // Save auth state to localStorage for cross-tab synchronization
  const persistAuthState = useCallback((userData: User | null) => {
    if (userData) {
      localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
        user: userData,
        timestamp: Date.now()
      }));
      AuthLogger.log('Auth state persisted to localStorage');
    } else {
      localStorage.removeItem(AUTH_STATE_KEY);
      AuthLogger.log('Auth state removed from localStorage');
    }
  }, []);

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      AuthLogger.error('No refresh token available');
      // Don't automatically log out - just return the error
      throw new Error("No refresh token available");
    }

    try {
      AuthLogger.log('Attempting token refresh');
      const response = await fetch(`/api/auth/proxy?endpoint=/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        AuthLogger.error('Token refresh failed', { status: response.status });
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      AuthLogger.log('Token refresh successful');
      localStorage.setItem(ACCESS_TOKEN_KEY, data.tokens.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refresh_token);
      setUser(data.user);
      persistAuthState(data.user);
      return data.tokens.access_token;
    } catch (error) {
      AuthLogger.error('Token refresh error:', error);
      // Don't automatically log out on refresh failures
      throw error;
    }
  };

  // Update user state when Auth0 user changes
  useEffect(() => {
    if (auth0User && !isLoading) {
      const userData = {
        user_id: parseInt(auth0User.sub?.split('|')[1] || '0'),
        email: auth0User.email || '',
        name: auth0User.name,
        picture: auth0User.picture,
        provider: auth0User.sub?.split('|')[0] || 'unknown'
      };
      
      AuthLogger.log('Auth0 user updated, syncing with local state', { 
        userId: userData.user_id,
        email: userData.email 
      });
      
      setUser(userData);
      persistAuthState(userData);
    }
  }, [auth0User, isLoading, persistAuthState]);

  // Update last activity timestamp on user interaction
  useEffect(() => {
    const updateActivity = () => {
      const now = Date.now();
      setLastActivity(now);
      // Debug logging for activity updates
      if (process.env.NODE_ENV === 'development') {
        AuthLogger.log('Activity updated', { timestamp: new Date(now).toISOString() });
      }
    };
    
    // Track user activity
    window.addEventListener('mousemove', updateActivity, { passive: true });
    window.addEventListener('keypress', updateActivity, { passive: true });
    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('scroll', updateActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

  // Try to restore auth from localStorage (for cross-tab auth)
  useEffect(() => {
    const tryRestoreAuth = () => {
      try {
        const savedAuth = localStorage.getItem(AUTH_STATE_KEY);
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        
        if (savedAuth && accessToken && !authRestoreAttempted) {
          setAuthRestoreAttempted(true);
          
          const authData = JSON.parse(savedAuth);
          const authTimestamp = authData.timestamp || 0;
          const isRecent = (Date.now() - authTimestamp) < 4 * 60 * 60 * 1000; // 4 hours
          
          if (isRecent) {
            AuthLogger.log('Found recent auth state in localStorage', { 
              userId: authData.user?.user_id,
              isNewTab: isNewTabOrWindow()
            });
            
            // Only restore if Auth0 is still loading or not authenticated
            if (auth0Loading || !auth0IsAuthenticated) {
              setUser(authData.user);
            }
          }
        }
      } catch (error) {
        AuthLogger.error('Error restoring auth from localStorage', error);
      }
    };
    
    // Execute immediately
    tryRestoreAuth();
    
    // Also listen for storage events from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STATE_KEY && e.newValue) {
        tryRestoreAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [auth0IsAuthenticated, auth0Loading, authRestoreAttempted]);

  // Check authentication on mount with more patience and resilience
  useEffect(() => {
    // Skip if we've already attempted authentication
    if (authAttempted) {
      return;
    }
    
    // Check if we're in a post-auth redirect scenario
    const isPostRedirect = () => {
      try {
        // Auth0 stores transaction info during auth flow
        return !!localStorage.getItem('a0.spajs.txs');
      } catch (e) {
        return false;
      }
    };
    
    const checkAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      let authenticated = false;
      const isPostAuthRedirect = isPostRedirect();
      
      AuthLogger.log('Initial auth check', { 
        hasToken: !!token,
        auth0IsAuthenticated,
        auth0Loading,
        isNewTab: isNewTabOrWindow(),
        isPostAuthRedirect
      });
      
      if (token) {
        try {
          // Check if token is expired or about to expire
          if (isTokenExpired(token)) {
            AuthLogger.warning('Token expired or about to expire, attempting refresh');
            try {
              await refreshToken();
              authenticated = true;
            } catch (refreshError) {
              AuthLogger.error('Initial token refresh failed:', refreshError);
              // Don't give up yet - Auth0 might still authenticate us
            }
          } else {
            // Token looks valid, try to get profile
            try {
              const response = await fetch(`/api/auth/proxy?endpoint=/api/auth/profile`, {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
  
              if (response.ok) {
                const data = await response.json();
                AuthLogger.log('Profile fetch successful during initial check', { userId: data.user.user_id });
                setUser(data.user);
                persistAuthState(data.user);
                authenticated = true;
              } else {
                AuthLogger.warning('Profile fetch failed during initial check, trying refresh');
                try {
                  await refreshToken();
                  authenticated = true;
                } catch (refreshError) {
                  AuthLogger.error('Refresh after profile failure:', refreshError);
                  // Don't give up yet
                }
              }
            } catch (error) {
              AuthLogger.error('Error fetching profile during initial check:', error);
              // Don't give up yet
            }
          }
        } catch (error) {
          AuthLogger.error('Error during token validation in initial check:', error);
        }
      }
      
      // Mark authentication as attempted
      setAuthAttempted(true);
      
      // If we're in a post-auth redirect or still loading, be more patient
      if (isPostAuthRedirect || auth0Loading) {
        AuthLogger.log('In post-auth redirect or Auth0 still loading - waiting longer', {
          isPostAuthRedirect,
          auth0Loading
        });
        
        // Wait a bit longer before finalizing auth state
        if (!authenticated) {
          setTimeout(() => {
            if (!isLoading) {
              AuthLogger.log('Delayed auth check complete, finalizing state', {
                auth0IsAuthenticated,
                auth0Loading
              });
              setIsLoading(false);
            }
          }, 2000);
          return;
        }
      }
      
      // If we're still loading and not authenticated, wait for Auth0
      if (!authenticated && auth0Loading) {
        AuthLogger.log('Not authenticated yet, but Auth0 is still loading - waiting');
        // We'll let the Auth0 user effect handle authentication
        return;
      }
      
      // If we're not authenticated at this point and Auth0 is done loading,
      // but we're in a new tab with protected route, let's be patient
      if (!authenticated && !auth0Loading && !auth0IsAuthenticated && isNewTabOrWindow()) {
        const path = window.location.pathname;
        
        if (path.startsWith('/dashboard') || path.startsWith('/workbench') || 
            path.startsWith('/settings') || path.startsWith('/create')) {
          AuthLogger.log('New tab with protected route but no auth - waiting longer for Auth0');
          
          // Wait a moment more before finalizing authentication state
          setTimeout(() => {
            // One final check before giving up
            if (!auth0IsAuthenticated) {
              AuthLogger.warning('Still not authenticated after waiting - finalizing auth state');
              setIsLoading(false);
            }
          }, 1000);
          return;
        }
      }
      
      // Finalize loading state
      setIsLoading(false);
    };

    checkAuth();
  }, [auth0IsAuthenticated, auth0Loading, authAttempted, persistAuthState]);

  // Token refresh logic
  const refreshTokenIfNeeded = useCallback(async () => {
    try {
      const currentTime = Date.now();
      const inactiveTime = currentTime - lastActivity;
      
      // If user has been inactive for more than 30 minutes, log them out
      if (inactiveTime > 30 * 60 * 1000) {
        AuthLogger.log('User inactive for 30 minutes, logging out');
        await logout();
        return;
      }

      // Debug log for activity tracking
      AuthLogger.log('User activity check', { 
        lastActivity: new Date(lastActivity).toISOString(),
        currentTime: new Date(currentTime).toISOString(),
        inactiveMinutes: Math.round(inactiveTime / (60 * 1000))
      });

      // Otherwise, refresh the token
      const token = await getAccessTokenSilently({
        detailedResponse: true,
        cacheMode: 'off' // Don't use cached tokens to ensure fresh ones
      });
      
      localStorage.setItem(ACCESS_TOKEN_KEY, token.access_token);
      
      // The typings are sometimes incorrect - Auth0 may return a refresh token
      // but it's not always in the type definition
      const tokenResponse = token as any;
      if (tokenResponse.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, tokenResponse.refresh_token);
        AuthLogger.log('Received and stored refresh token');
      }
      
      AuthLogger.log('Token refreshed successfully');
    } catch (error) {
      // Only log the error, don't disrupt the user session
      AuthLogger.error('Error refreshing token:', error);
    }
  }, [getAccessTokenSilently, lastActivity, logout]);

  // Set up token refresh interval
  useEffect(() => {
    if (auth0IsAuthenticated && !refreshInterval) {
      // First, do an immediate refresh to ensure token is fresh
      refreshTokenIfNeeded();
      
      // Then set up regular interval for refreshes
      const interval = setInterval(refreshTokenIfNeeded, 10 * 60 * 1000); // Every 10 minutes
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    };
  }, [auth0IsAuthenticated, refreshInterval, refreshTokenIfNeeded]);

  const getM2MToken = async () => {
    try {
      // Check if we have a valid cached token
      const cachedToken = localStorage.getItem(M2M_TOKEN_KEY);
      const tokenExpiry = localStorage.getItem(M2M_TOKEN_EXPIRY_KEY);
      
      if (cachedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        AuthLogger.log('Using cached M2M token', { cachedToken: !!cachedToken });
        return cachedToken;
      }

      AuthLogger.log('Getting new M2M token from backend');

      const response = await fetch('/api/auth/proxy?endpoint=/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audience: auth0M2MConfig.audience,
          grant_type: 'client_credentials'
          // Note: client_id and client_secret are handled by backend for security
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        AuthLogger.error('Failed to get M2M token', {
          status: response.status,
          error: errorData
        });
        throw new Error(`Failed to get M2M token: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      AuthLogger.log('Successfully obtained M2M token', {
        hasToken: !!data.access_token,
        expiresIn: data.expires_in
      });
      
      localStorage.setItem(M2M_TOKEN_KEY, data.access_token);
      localStorage.setItem(M2M_TOKEN_EXPIRY_KEY, (Date.now() + data.expires_in * 1000).toString());
      
      return data.access_token;
    } catch (error) {
      AuthLogger.error('Error getting M2M token:', error);
      throw error;
    }
  };

  // Call onInit when auth is ready
  useEffect(() => {
    if (!isLoading && onInit) {
      AuthLogger.log('Auth context initialized, calling onInit');
      onInit({
        isAuthenticated: !!user,
        isLoading: auth0Loading || isLoading,
        user,
        login: async (userData: User, tokens: Tokens) => {
          setUser(userData);
          localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
          localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
          persistAuthState(userData);
        },
        logout,
        getM2MToken: async () => {
          if (isLoading) {
            AuthLogger.warning('Auth context still loading, waiting...');
            // Wait for auth to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            return getM2MToken();
          }
          return getM2MToken();
        }
      });
    }
  }, [isLoading, user, auth0Loading, logout, getM2MToken, onInit, persistAuthState]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading: auth0Loading || isLoading,
        user,
        login: async (userData: User, tokens: Tokens) => {
          setUser(userData);
          localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
          localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
          persistAuthState(userData);
        },
        logout,
        getM2MToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 