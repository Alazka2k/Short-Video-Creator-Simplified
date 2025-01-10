'use client'

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthLogger } from "@/lib/debug/auth-logger";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Enable debug mode on mount
  useEffect(() => {
    AuthLogger.enableDebugMode();
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
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        login,
        logout,
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