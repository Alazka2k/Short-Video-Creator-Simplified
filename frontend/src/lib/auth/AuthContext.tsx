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

// Add token validation helper
const isTokenExpired = (token: string): boolean => {
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    // Check if token expires in less than 5 minutes
    return tokenData.exp * 1000 <= Date.now() + 5 * 60 * 1000;
  } catch (error) {
    AuthLogger.error('Token validation error:', error);
    return true;
  }
};

export function AuthProvider({ children, onInit }: AuthProviderProps) {
  const {
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0Loading,
    user: auth0User,
    getAccessTokenSilently,
    logout: auth0Logout
  } = useAuth0();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Update user state when Auth0 user changes
  useEffect(() => {
    if (auth0User) {
      setUser({
        user_id: parseInt(auth0User.sub?.split('|')[1] || '0'),
        email: auth0User.email || '',
        name: auth0User.name,
        picture: auth0User.picture,
        provider: auth0User.sub?.split('|')[0] || 'unknown'
      });
    } else {
      setUser(null);
    }
  }, [auth0User]);

  // Update last activity timestamp on user interaction
  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    
    // Track user activity
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

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

      // Otherwise, refresh the token
      const token = await getAccessTokenSilently({
        detailedResponse: true,
      });
      
      localStorage.setItem('access_token', token.access_token);
      AuthLogger.log('Token refreshed successfully');
    } catch (error) {
      AuthLogger.error('Error refreshing token:', error);
    }
  }, [getAccessTokenSilently, lastActivity]);

  // Set up token refresh interval
  useEffect(() => {
    if (auth0IsAuthenticated && !refreshInterval) {
      // Refresh token every 10 minutes if user is active
      const interval = setInterval(refreshTokenIfNeeded, 10 * 60 * 1000);
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    };
  }, [auth0IsAuthenticated, refreshInterval, refreshTokenIfNeeded]);

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      AuthLogger.error('No refresh token available');
      // Clear any remaining auth state
      await logout();
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
        // Clear auth state and redirect to login
        await logout();
        window.location.href = '/login';
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      AuthLogger.log('Token refresh successful');
      localStorage.setItem("access_token", data.tokens.access_token);
      localStorage.setItem("refresh_token", data.tokens.refresh_token);
      setUser(data.user);
      return data.tokens.access_token;
    } catch (error) {
      AuthLogger.error('Token refresh error:', error);
      // Clear tokens and redirect to login
      await logout();
      window.location.href = '/login';
      throw error;
    }
  };

  useEffect(() => {
    // Check if we have a token in localStorage
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      AuthLogger.log('Checking authentication status', { hasToken: !!token });
      
      if (token) {
        try {
          // Check if token is expired or about to expire
          if (isTokenExpired(token)) {
            AuthLogger.warning('Token expired or about to expire, attempting refresh');
            try {
              await refreshToken();
            } catch (refreshError) {
              AuthLogger.error('Token refresh failed:', refreshError);
              setUser(null);
              setIsLoading(false);
              window.location.href = '/login';
              return;
            }
          }

          const response = await fetch(`/api/auth/proxy?endpoint=/api/auth/profile`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            AuthLogger.log('Profile fetch successful', { user: data.user });
            setUser(data.user);
          } else {
            AuthLogger.warning('Profile fetch failed, attempting token refresh');
            try {
              await refreshToken();
            } catch (refreshError) {
              AuthLogger.error('Token refresh failed after profile fetch error:', refreshError);
              setUser(null);
              window.location.href = '/login';
            }
          }
        } catch (error) {
          AuthLogger.error('Auth check failed:', error);
          setUser(null);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = '/login';
        }
      } else {
        AuthLogger.log('No token found, user is not authenticated');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const logout = useCallback(async () => {
    try {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      localStorage.removeItem('access_token');
      setUser(null);
      await auth0Logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
    } catch (error) {
      AuthLogger.error('Error during logout:', error);
    }
  }, [auth0Logout, refreshInterval]);

  const getM2MToken = async () => {
    try {
      // Check if we have a valid cached token
      const cachedToken = localStorage.getItem(M2M_TOKEN_KEY);
      const tokenExpiry = localStorage.getItem(M2M_TOKEN_EXPIRY_KEY);
      
      if (cachedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        AuthLogger.log('Using cached M2M token', { cachedToken: !!cachedToken });
        return cachedToken;
      }

      AuthLogger.log('Getting new M2M token', {
        hasClientId: !!auth0M2MConfig.m2mClientId,
        hasClientSecret: !!auth0M2MConfig.m2mClientSecret,
        audience: auth0M2MConfig.audience
      });

      const response = await fetch('/api/auth/proxy?endpoint=/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: auth0M2MConfig.m2mClientId,
          client_secret: auth0M2MConfig.m2mClientSecret,
          audience: auth0M2MConfig.audience,
          grant_type: 'client_credentials'
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
      
      // Cache token with expiration
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
          localStorage.setItem('access_token', tokens.access_token);
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
  }, [isLoading, user, auth0Loading, logout, getM2MToken, onInit]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading: auth0Loading || isLoading,
        user,
        login: async (userData: User, tokens: Tokens) => {
          setUser(userData);
          localStorage.setItem('access_token', tokens.access_token);
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 