'use client'

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthLogger } from "@/lib/debug/auth-logger";
import { auth0M2MConfig } from "./config";

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const M2M_TOKEN_KEY = 'auth_m2m_token';
const M2M_TOKEN_EXPIRY_KEY = 'auth_m2m_token_expiry';

export function AuthProvider({ children, onInit }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Enable debug mode on mount
  useEffect(() => {
    AuthLogger.setDebugMode(true);
    AuthLogger.log('Auth Provider initialized');
  }, []);

  useEffect(() => {
    // Check if we have a token in localStorage
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      AuthLogger.log('Checking authentication status', { hasToken: !!token });
      
      if (token) {
        try {
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
            // Token is invalid, try to refresh
            await refreshToken();
          }
        } catch (error) {
          AuthLogger.error('Auth check failed:', error);
          setUser(null);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      } else {
        AuthLogger.log('No token found, user is not authenticated');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      AuthLogger.error('No refresh token available');
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
      localStorage.setItem("access_token", data.tokens.access_token);
      localStorage.setItem("refresh_token", data.tokens.refresh_token);
      setUser(data.user);
    } catch (error) {
      AuthLogger.error('Token refresh error:', error);
      // Clear tokens on refresh failure
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      throw error;
    }
  };

  const login = async (userData: User, tokens: Tokens) => {
    AuthLogger.log('Logging in user', { userId: userData.user_id });
    setUser(userData);
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        AuthLogger.log('Logging out user');
        await fetch(`/api/auth/proxy?endpoint=/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        AuthLogger.error('Logout error:', error);
      }
    }
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // Also clear M2M tokens on logout
    localStorage.removeItem(M2M_TOKEN_KEY);
    localStorage.removeItem(M2M_TOKEN_EXPIRY_KEY);
  };

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
        isLoading,
        user,
        login,
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
  }, [isLoading, user, login, logout, getM2MToken, onInit]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        login,
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