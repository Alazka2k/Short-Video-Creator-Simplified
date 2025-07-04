/**
 * ============================================================================
 * UNIFIED AUTHENTICATION HOOK - HYBRID AUTH0 + BACKEND INTEGRATION
 * ============================================================================
 * 
 * This hook provides a unified interface for authentication across the application.
 * It intelligently switches between our custom AuthContext (hybrid Auth0 + backend)
 * and direct Auth0 SDK methods based on the authentication state.
 * 
 * AUTHENTICATION STRATEGY:
 * 
 * 1. PRIORITIZES AUTHCONTEXT
 *    - If AuthContext has a user, use hybrid authentication
 *    - Provides backend user data and M2M tokens
 *    - Handles complex Auth0 + backend synchronization
 * 
 * 2. FALLBACK TO AUTH0 DIRECT
 *    - If AuthContext has no user, use Auth0 SDK directly
 *    - Simpler authentication for basic scenarios
 *    - Direct Auth0 token management
 * 
 * TOKEN MANAGEMENT:
 * - AuthContext users: Uses M2M tokens + x-user-token header for API calls
 * - Auth0 direct users: Uses Auth0 access tokens
 * - Automatic token refresh and error handling
 * 
 * USAGE PATTERNS:
 * 
 * ```typescript
 * const { isAuthenticated, user, getToken, authFetch, login, logout } = useAuth();
 * 
 * // Check authentication status
 * if (isAuthenticated && user) {
 *   // User is logged in
 * }
 * 
 * // Make authenticated API calls (automatically includes M2M + user tokens)
 * const data = await authFetch('/api/some-endpoint', {
 *   method: 'POST',
 *   body: JSON.stringify({ data })
 * });
 * 
 * // Get M2M token for manual API calls
 * const token = await getToken();
 * 
 * // Login/logout
 * await login();
 * await logout();
 * ```
 * 
 * DEPENDENCIES:
 * - @auth0/auth0-react: Direct Auth0 SDK integration
 * - @/lib/auth/AuthContext: Custom hybrid authentication context
 * 
 * RESPONSIBILITIES:
 * - Providing unified authentication interface
 * - Token management for API calls
 * - Authentication state management
 * - Login/logout functionality
 * 
 * NOT RESPONSIBLE FOR:
 * - OAuth flow handling (handled by Auth0Provider)
 * - Backend user synchronization (handled by AuthContext)
 * - Route protection (handled by ProtectedRoute component)
 * - Session persistence (handled by Auth0 and AuthContext)
 * 
 * Last Updated: 2025-06-30
 * Architecture: Unified Auth0 + Backend Hook
 */

import { useAuth0 } from '@auth0/auth0-react';
import { useAuth as useAuthContext } from '@/lib/auth/AuthContext';
import { useCallback } from 'react';

/**
 * Unified authentication hook that provides a consistent interface
 * for both AuthContext (hybrid) and Auth0 direct authentication.
 * 
 * @returns {Object} Authentication interface with unified methods
 */
export function useAuth() {
  // Use the AuthContext by default, fallback to Auth0 direct
  const authContext = useAuthContext();
  const auth0 = useAuth0();

  // Prioritize AuthContext if it has a user (indicates successful hybrid auth)
  const {
    isAuthenticated,
    isLoading,
    user,
    logout: contextLogout
  } = authContext.user ? authContext : {
    isAuthenticated: auth0.isAuthenticated,
    isLoading: auth0.isLoading,
    user: auth0.user,
    logout: auth0.logout
  };

  /**
   * Get M2M access token for API calls.
   * For hybrid authentication, this returns M2M tokens that should be used
   * with x-user-token header to provide user context to the backend.
   * 
   * @returns {Promise<string|null>} M2M access token or null if error
   */
  const getToken = useCallback(async () => {
    try {
      if (authContext.user) {
        // For AuthContext users, get M2M token for backend API communication
        // The user context will be passed via x-user-token header in authFetch
        return await authContext.getM2MToken();
      } else {
        // Fallback to Auth0 direct token for simpler authentication
        // This provides Auth0 API access with user authentication
        return await auth0.getAccessTokenSilently();
      }
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }, [authContext, auth0.getAccessTokenSilently]);

  /**
   * Authenticated fetch helper that automatically includes authorization headers.
   * For hybrid auth: Uses M2M token + x-user-token header for user context.
   * For Auth0 direct: Uses Auth0 access token only.
   * 
   * @param {string} url - API endpoint URL
   * @param {RequestInit} options - Fetch options (method, body, headers, etc.)
   * @returns {Promise<Response>} Fetch response with authentication headers
   * @throws {Error} If no access token is available
   */
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    if (!token) throw new Error('No access token available');

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
      Authorization: `Bearer ${token}`,
    };

    // For AuthContext users, add user context header
    if (authContext.user) {
      const userToken = localStorage.getItem('access_token');
      if (userToken) {
        headers['x-user-token'] = userToken;
      }
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }, [getToken, authContext.user]);

  return {
    /** Whether the user is currently authenticated */
    isAuthenticated,
    /** Whether authentication status is still being determined */
    isLoading,
    /** Current user object (AuthContext user or Auth0 user) */
    user,
    /** Get M2M token for manual API calls (use with x-user-token header for user context) */
    getToken,
    /** Make authenticated fetch requests with automatic token injection */
    authFetch,
    /** Initiate login flow (redirects to Auth0) */
    login: auth0.loginWithRedirect,
    /** 
     * Logout user and clear all authentication state.
     * Handles both AuthContext and Auth0 direct logout flows.
     */
    logout: async () => {
      if (authContext.user) {
        // Use AuthContext logout for hybrid authentication
        await contextLogout();
      } else {
        // Use Auth0 direct logout for simple authentication
        auth0.logout({ 
          logoutParams: {
            returnTo: window.location.origin
          }
        });
      }
    },
  };
} 