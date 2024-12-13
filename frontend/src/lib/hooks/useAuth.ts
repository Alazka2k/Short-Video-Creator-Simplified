import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';

export function useAuth() {
  const {
    isAuthenticated,
    isLoading,
    user,
    getAccessTokenSilently,
    loginWithRedirect,
    logout,
  } = useAuth0();

  // Get access token for API calls
  const getToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }, [getAccessTokenSilently]);

  // Authenticated API request helper
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    if (!token) throw new Error('No access token available');

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }, [getToken]);

  return {
    isAuthenticated,
    isLoading,
    user,
    getToken,
    authFetch,
    login: loginWithRedirect,
    logout: () => logout({ 
      logoutParams: {
        returnTo: window.location.origin
      }
    }),
  };
} 