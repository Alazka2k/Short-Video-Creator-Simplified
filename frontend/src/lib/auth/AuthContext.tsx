/**
 * ============================================================================
 * AUTHENTICATION CONTEXT - HYBRID AUTH0 SPA + BACKEND ARCHITECTURE
 * ============================================================================
 * 
 * This file manages the application's authentication state using a hybrid approach
 * that combines Auth0 SPA SDK with backend-centric user management.
 * 
 * AUTHENTICATION FLOW:
 * 
 * 1. USER INITIATES GOOGLE LOGIN
 *    - User clicks "Continue with Google" 
 *    - Auth0 SPA SDK redirects to Auth0/Google OAuth
 *    - Google redirects back to app root domain
 * 
 * 2. AUTH0 SPA SDK PROCESSES AUTHENTICATION
 *    - Auth0 SPA SDK automatically handles OAuth callback
 *    - Sets auth0IsAuthenticated = true and provides auth0User
 *    - Provides getAccessTokenSilently() for Auth0 access tokens
 * 
 * 3. THIS CONTEXT SYNCS WITH BACKEND
 *    - Detects Auth0 authentication via useEffect
 *    - Gets Auth0 access token using getAccessTokenSilently()
 *    - Calls backend /api/auth/social endpoint with Auth0 token and profile
 *    - Backend creates/updates user and returns backend tokens
 * 
 * 4. CONTEXT MANAGES HYBRID STATE
 *    - Stores backend user data in React state
 *    - Stores backend tokens in localStorage/cookies
 *    - Provides unified authentication interface to app
 * 
 * RESPONSIBILITIES:
 * - Managing application authentication state (isAuthenticated, user, isLoading)
 * - Detecting Auth0 SPA SDK authentication events
 * - Syncing Auth0 user data with backend /api/auth/social endpoint
 * - Storing and managing backend user data and tokens
 * - Providing unified auth interface to React components
 * - Handling token refresh for both Auth0 and backend tokens
 * - Managing user activity tracking and auto-logout
 * - Cross-tab authentication synchronization via localStorage
 * - M2M token management for backend API calls
 * - Fallback authentication from existing backend sessions
 * - Logout handling (both Auth0 and backend cleanup)
 * 
 * NOT RESPONSIBLE FOR:
 * - OAuth redirect handling (handled by Auth0 SPA SDK)
 * - OAuth callback processing (handled by Auth0 SPA SDK)
 * - Google/Auth0 token exchange (handled by Auth0 SPA SDK)
 * - User registration/creation in backend (handled by backend services)
 * - Email/password authentication (handled by separate email auth flow)
 * - Backend user database operations (handled by backend controllers)
 * - Social provider integrations (handled by Auth0 configuration)
 * - JWT token validation (handled by backend middleware)
 * - Session storage in backend (handled by backend session service)
 * 
 * KEY CONCEPTS:
 * 
 * DUAL TOKEN SYSTEM:
 * - Auth0 tokens: For Auth0 API calls and user verification
 * - Backend tokens: For your application API calls
 * 
 * SOCIAL AUTH PROCESSING FLAG:
 * - Prevents infinite loops when Auth0 user changes
 * - Ensures backend sync happens only once per authentication
 * 
 * PROVIDER DETECTION:
 * - auth0User.sub format: "provider|user_id"
 * - google-oauth2|123 = Social login (sync with backend)
 * - auth0|123 = Email/password (use local Auth0 data)
 * 
 * FALLBACK MECHANISMS:
 * - If backend sync fails, use Auth0 user data
 * - If Auth0 not authenticated, check for existing backend session
 * - Cross-tab sync via localStorage events
 * 
 * DEPENDENCIES:
 * - Auth0Provider: Must wrap this context (provides useAuth0 hook)
 * - Backend /api/auth/social: Endpoint for syncing social auth
 * - Backend /api/auth/profile: Endpoint for fetching user profile
 * - Backend /api/auth/refresh: Endpoint for refreshing backend tokens
 * - Backend /api/auth/token: Endpoint for M2M token generation
 * 
 * TROUBLESHOOTING:
 * - Infinite loops: Check socialAuthProcessed flag and useEffect dependencies
 * - No backend sync: Verify /api/auth/social endpoint and Auth0 token validity
 * - White screens: Check isLoading state management and Auth0 configuration
 * - Token issues: Verify both Auth0 and backend token refresh mechanisms
 * - Cross-tab issues: Check localStorage AUTH_STATE_KEY synchronization
 * 
 * Last Updated: 2025-06-30
 * Architecture: Hybrid Auth0 SPA + Backend
 */

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
    // Check if token expires in less than 1 minute
    return tokenData.exp * 1000 <= Date.now() + 1 * 60 * 1000;
  } catch (error) {
    AuthLogger.error('Token validation error:', error);
    return false;
  }
};

// Helper to get cookie value
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
};

export function AuthProvider({ children, onInit }: AuthProviderProps) {
  const {
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0Loading,
    user: auth0User,
    getAccessTokenSilently,
    logout: auth0Logout,
  } = useAuth0();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [socialAuthProcessed, setSocialAuthProcessed] = useState(false);

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
      
      // Clear cookies
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'temp_user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      setUser(null);
      setSocialAuthProcessed(false);
      
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
    // Try to get refresh token from cookie first, then localStorage
    let refreshToken = getCookie('refresh_token') || localStorage.getItem(REFRESH_TOKEN_KEY);
    
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
      
      // Store new tokens
      if (data.tokens?.access_token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.tokens.access_token);
      }
      if (data.tokens?.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refresh_token);
      }
      
      setUser(data.user);
      persistAuthState(data.user);
      return data.tokens.access_token;
    } catch (error) {
      AuthLogger.error('Token refresh error:', error);
      throw error;
    }
  };

  // Handle Auth0 authentication and sync with backend
  useEffect(() => {
    const handleAuth0User = async () => {
      // Don't process if Auth0 is still loading
      if (auth0Loading) {
        AuthLogger.log('Auth0 still loading, waiting...');
        return;
      }

      // First, try to load persisted auth state from localStorage
      if (!user && !auth0IsAuthenticated) {
        try {
          const savedAuthState = localStorage.getItem(AUTH_STATE_KEY);
          if (savedAuthState) {
            const { user: savedUser, timestamp } = JSON.parse(savedAuthState);
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (savedUser && (Date.now() - timestamp < maxAge)) {
              AuthLogger.log('Loading persisted auth state', {
                userId: savedUser.user_id,
                email: savedUser.email,
                age: Date.now() - timestamp
              });
              
              setUser(savedUser);
              setIsLoading(false);
              return; // Exit early, we have valid user data
            } else {
              AuthLogger.log('Persisted auth state expired, removing');
              localStorage.removeItem(AUTH_STATE_KEY);
            }
          }
        } catch (error) {
          AuthLogger.error('Error loading persisted auth state:', error);
          localStorage.removeItem(AUTH_STATE_KEY);
        }
      }

      // If Auth0 is authenticated and we have a user but haven't processed social auth yet
      if (auth0IsAuthenticated && auth0User && !socialAuthProcessed) {
        AuthLogger.log('Auth0 authenticated, processing social auth', {
          sub: auth0User.sub,
          email: auth0User.email,
          provider: auth0User.sub?.split('|')[0]
        });

        try {
          setSocialAuthProcessed(true); // Prevent multiple processing
          
          // Extract provider from Auth0 user
          const provider = auth0User.sub?.split('|')[0] || 'unknown';
          
          // For social providers (google-oauth2, etc.), sync with backend
          if (provider !== 'auth0' && provider !== 'unknown') {
            AuthLogger.log('Social provider detected, syncing with backend', { provider });
            
            // Get Auth0 access token
            const accessToken = await getAccessTokenSilently();
            AuthLogger.log('Got Auth0 access token, calling backend /social endpoint');
            
            // Send to backend social auth endpoint  
            const response = await fetch(`/api/auth/proxy?endpoint=/api/auth/social`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accessToken,
                provider: provider === 'google-oauth2' ? 'google' : provider,
                profile: {
                  sub: auth0User.sub,
                  email: auth0User.email,
                  name: auth0User.name,
                  picture: auth0User.picture,
                },
              }),
            });

            if (response.ok) {
              const data = await response.json();
              AuthLogger.log('Backend social auth successful', {
                userId: data.user?.user_id,
                email: data.user?.email
              });
              
              setUser(data.user);
              persistAuthState(data.user);
              
              // Store tokens if provided
              if (data.tokens) {
                if (data.tokens.access_token) {
                  localStorage.setItem(ACCESS_TOKEN_KEY, data.tokens.access_token);
                }
                if (data.tokens.refresh_token) {
                  localStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refresh_token);
                }
              }
            } else {
              const errorData = await response.json().catch(() => ({}));
              AuthLogger.error('Backend social auth failed', {
                status: response.status,
                error: errorData
              });
              
              // Fallback to Auth0 user data
              const fallbackUser = {
                user_id: parseInt(auth0User.sub?.split('|')[1] || '0'),
                email: auth0User.email || '',
                name: auth0User.name,
                picture: auth0User.picture,
                provider: provider
              };
              setUser(fallbackUser);
              persistAuthState(fallbackUser);
            }
          } else {
            // For email/password users (auth0 provider), create local user data
            AuthLogger.log('Auth0 email/password user, using local data');
            const userData = {
              user_id: parseInt(auth0User.sub?.split('|')[1] || '0'),
              email: auth0User.email || '',
              name: auth0User.name,
              picture: auth0User.picture,
              provider: 'auth0'
            };
            setUser(userData);
            persistAuthState(userData);
          }
        } catch (error) {
          AuthLogger.error('Error processing Auth0 user:', error);
          setSocialAuthProcessed(false); // Allow retry
        }
      } else if (!auth0Loading && !auth0IsAuthenticated) {
        // Auth0 finished loading and user is not authenticated
        AuthLogger.log('Auth0 not authenticated, checking for existing backend session');
        
        // Check for existing backend session
        const token = getCookie('access_token') || localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token && !isTokenExpired(token)) {
          AuthLogger.log('Found valid backend token, fetching profile');
          
          try {
            const response = await fetch(`/api/auth/proxy?endpoint=/api/auth/profile`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              AuthLogger.log('Backend profile fetch successful', { userId: data.user.user_id });
              setUser(data.user);
              persistAuthState(data.user);
            } else {
              AuthLogger.log('Backend profile fetch failed, user not authenticated');
            }
          } catch (error) {
            AuthLogger.error('Error fetching backend profile:', error);
          }
        } else {
          AuthLogger.log('No valid backend token found');
        }
      }
      
      // End loading state when Auth0 is done loading
      if (!auth0Loading) {
        setIsLoading(false);
      }
    };

    handleAuth0User();
  }, [auth0IsAuthenticated, auth0Loading, auth0User, socialAuthProcessed, getAccessTokenSilently, persistAuthState]);

  // Check for post-auth callback and handle temp user data from cookies
  useEffect(() => {
    const checkPostAuthCallback = () => {
      try {
        // Check if we're in a post-auth callback scenario
        const urlParams = new URLSearchParams(window.location.search);
        const isPostAuth = urlParams.get('auth_callback') === 'true';
        
        if (isPostAuth) {
          AuthLogger.log('Detected post-auth callback, checking for user data');
          
          // Get temporary user data from cookie (if using backend OAuth)
          const tempUserData = getCookie('temp_user_data');
          if (tempUserData) {
            try {
              const userData = JSON.parse(tempUserData);
              AuthLogger.log('Found user data from backend OAuth callback', {
                userId: userData.user_id,
                email: userData.email
              });
              
              setUser(userData);
              persistAuthState(userData);
              
              // Clear the temporary cookie
              document.cookie = 'temp_user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              
              // Clean up URL parameters
              const newUrl = window.location.pathname;
              window.history.replaceState({}, '', newUrl);
              
              setIsLoading(false);
            } catch (error) {
              AuthLogger.error('Error parsing temp user data:', error);
            }
          }
        }
      } catch (error) {
        AuthLogger.error('Error in post-auth callback handler:', error);
      }
    };
    
    checkPostAuthCallback();
  }, [persistAuthState]);

  // Update last activity timestamp on user interaction
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
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

  // Token refresh logic for Auth0 tokens
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

      // If authenticated with Auth0, refresh Auth0 token
      if (auth0IsAuthenticated) {
        try {
          const token = await getAccessTokenSilently({
            cacheMode: 'off' // Get fresh token
          });
          
          // Update localStorage
          localStorage.setItem(ACCESS_TOKEN_KEY, token);
          AuthLogger.log('Auth0 token refreshed');
        } catch (error) {
          AuthLogger.error('Error refreshing Auth0 token:', error);
        }
      } else {
        // Try to refresh backend token
        const token = getCookie('access_token') || localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token && isTokenExpired(token)) {
          AuthLogger.log('Backend token expired, refreshing');
          try {
            await refreshToken();
          } catch (error) {
            AuthLogger.error('Backend token refresh failed:', error);
          }
        }
      }
    } catch (error) {
      AuthLogger.error('Error in token refresh:', error);
    }
  }, [lastActivity, logout, auth0IsAuthenticated, getAccessTokenSilently]);

  // Set up token refresh interval
  useEffect(() => {
    if (user && !refreshInterval) {
      // Set up regular interval for refreshes
      const interval = setInterval(refreshTokenIfNeeded, 10 * 60 * 1000); // Every 10 minutes
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    };
  }, [user, refreshInterval, refreshTokenIfNeeded]);

  const getM2MToken = async () => {
    try {
      // Check if we have a valid cached token
      const cachedToken = localStorage.getItem(M2M_TOKEN_KEY);
      const tokenExpiry = localStorage.getItem(M2M_TOKEN_EXPIRY_KEY);
      
      if (cachedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        AuthLogger.log('Using cached M2M token');
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
        isLoading,
        user,
        login: async (userData: User, tokens: Tokens) => {
          setUser(userData);
          persistAuthState(userData);
          AuthLogger.log('User logged in', { userId: userData.user_id });
        },
        logout,
        getM2MToken
      });
    }
  }, [isLoading, user, logout, getM2MToken, onInit, persistAuthState]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        login: async (userData: User, tokens: Tokens) => {
          setUser(userData);
          persistAuthState(userData);
          AuthLogger.log('User logged in', { userId: userData.user_id });
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