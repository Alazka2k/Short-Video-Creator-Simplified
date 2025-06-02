'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAuth0 } from '@auth0/auth0-react';
import { LoadingScreen } from '@/components/ui/loading';
import { AuthLogger } from '@/lib/debug/auth-logger';

// Helper to check if we're in a new tab or window
const isNewTabOrWindow = () => {
  try {
    return !document.referrer.includes(window.location.host);
  } catch (e) {
    return false;
  }
};

// Helper to check if we've just been redirected from Auth0
const isPostAuthRedirect = () => {
  if (typeof window === 'undefined') return false;
  
  // Check multiple indicators of post-auth redirect
  try {
    // Auth0 stores this key during auth flow
    const hasTransaction = localStorage.getItem('a0.spajs.txs');
    
    // Check for our custom auth_redirect cookie
    const hasAuthCookie = document.cookie.includes('auth_redirect=true');
    
    // Check URL parameters from our custom callback handler
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParam = urlParams.get('auth_callback') === 'true';
    
    // Check for recent auth_time parameter (within last 10 seconds)
    const authTime = urlParams.get('auth_time');
    const isRecentAuth = authTime && (Date.now() - parseInt(authTime)) < 10000;
    
    return !!hasTransaction || hasAuthCookie || (hasAuthParam && isRecentAuth);
  } catch (e) {
    return false;
  }
};

// Maximum time we'll wait for authentication before forcing a decision
const MAX_AUTH_WAIT_TIME = 2000; // 2 seconds
const POST_AUTH_WAIT_TIME = 8000; // 8 seconds for post-auth redirects

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAuthenticated: auth0IsAuthenticated, isLoading: auth0IsLoading, user: auth0User } = useAuth0();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [extraWaitComplete, setExtraWaitComplete] = useState(false);
  const authWaitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isNewTab = useRef<boolean>(isNewTabOrWindow());
  const isPostRedirect = useRef<boolean>(Boolean(isPostAuthRedirect()));
  const hasToken = useRef<boolean>(typeof window !== 'undefined' && !!localStorage.getItem('access_token'));

  // Log initial state for debugging
  useEffect(() => {
    AuthLogger.log('Protected route mounted', { 
      pathname,
      isAuthenticated, 
      isLoading,
      hasToken: hasToken.current,
      isNewTab: isNewTab.current,
      isPostRedirect: isPostRedirect.current,
      url: typeof window !== 'undefined' ? window.location.href : 'undefined'
    });
    
    // Check critical auth state every 500ms for debugging
    const interval = setInterval(() => {
      if (isLoading || !isAuthenticated) {
        AuthLogger.log('Auth state check...', {
          pathname,
          isAuthenticated,
          isLoading,
          hasToken: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
          hasAuth0Transaction: typeof window !== 'undefined' && !!localStorage.getItem('a0.spajs.txs'),
          isPostRedirect: isPostRedirect.current,
          url: typeof window !== 'undefined' ? window.location.href : 'undefined'
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, pathname]);

  // Set up an extended wait timer with graceful fallback
  useEffect(() => {
    // Clear any existing timer
    if (authWaitTimerRef.current) {
      clearTimeout(authWaitTimerRef.current);
    }
    
    // Don't bother with timer if already authenticated
    if (isAuthenticated && !isLoading) {
      setExtraWaitComplete(true);
      return;
    }
    
    // Determine wait time based on context
    const waitTime = isPostRedirect.current ? POST_AUTH_WAIT_TIME : MAX_AUTH_WAIT_TIME;
    
    AuthLogger.log('Setting auth wait timer', { 
      pathname,
      isNewTab: isNewTab.current,
      isPostRedirect: isPostRedirect.current,
      hasToken: hasToken.current,
      waitTime: waitTime / 1000 + 's'
    });
    
    // Always set the timer to avoid getting stuck in loading
    authWaitTimerRef.current = setTimeout(() => {
      AuthLogger.log('Auth wait timer completed', { 
        isAuthenticated,
        isLoading,
        hasToken: hasToken.current,
        waitTime: waitTime / 1000 + 's'
      });
      
      setExtraWaitComplete(true);
      
      // If we have a token but Auth0 isn't showing authenticated,
      // and we're in a post-redirect scenario, be extra patient
      if (hasToken.current && !isAuthenticated && !isLoading && isPostRedirect.current) {
        AuthLogger.warning('Post-redirect with token but not authenticated - giving more time');
        
        // Set up one more timer for post-redirect scenarios
        setTimeout(() => {
          if (!isAuthenticated) {
            AuthLogger.warning('Final timeout - forcing reload as last resort');
            window.location.reload();
          }
        }, 3000);
      } else if (hasToken.current && !isAuthenticated && !isLoading) {
        AuthLogger.warning('Inconsistent auth state - forcing reload', {
          hasToken: hasToken.current,
          isAuthenticated,
          isLoading
        });
        window.location.reload();
      }
    }, waitTime);
    
    return () => {
      if (authWaitTimerRef.current) {
        clearTimeout(authWaitTimerRef.current);
      }
    };
  }, [isAuthenticated, isLoading, pathname]);

  // Authentication check effect
  useEffect(() => {
    // Perform this check only once auth state is settled or timer expired
    if ((isLoading || auth0IsLoading) && !extraWaitComplete) {
      return;
    }
    
    // Check both our AuthContext and Auth0 direct state
    const isContextAuthenticated = isAuthenticated;
    const isAuth0Authenticated = auth0IsAuthenticated && auth0User;
    const isEitherAuthenticated = isContextAuthenticated || isAuth0Authenticated;
    
    AuthLogger.log('Checking authentication state', { 
      isContextAuthenticated, 
      isAuth0Authenticated,
      isEitherAuthenticated,
      isLoading,
      auth0IsLoading,
      hasToken: hasToken.current,
      extraWaitComplete,
      isPostRedirect: isPostRedirect.current
    });

    // If we're authenticated via either method, or have a token during post-redirect, render content
    if (isEitherAuthenticated || (hasToken.current && extraWaitComplete && isPostRedirect.current)) {
      AuthLogger.log('User is authenticated or has token, rendering content', {
        method: isContextAuthenticated ? 'AuthContext' : isAuth0Authenticated ? 'Auth0Direct' : 'Token'
      });
      setAuthChecked(true);
      return;
    }
    
    // If we reach here, no authentication was found
    if (!isRedirecting) {
      setIsRedirecting(true);
      
      // Store the current path for redirect after login
      const returnPath = encodeURIComponent(pathname);
      AuthLogger.log(`Redirecting to login with return path: ${returnPath}`);
      
      // Use timeout to ensure we don't redirect during render
      setTimeout(() => {
        router.push(`/login?returnTo=${returnPath}`);
      }, 100);
    }
  }, [isAuthenticated, auth0IsAuthenticated, auth0User, isLoading, auth0IsLoading, extraWaitComplete, pathname, router, isRedirecting]);

  // Show loading until either authenticated or extra wait completed
  if ((isLoading || auth0IsLoading) && !extraWaitComplete) {
    return <LoadingScreen />;
  }
  
  // Check if authenticated via either method
  const isEitherAuthenticated = isAuthenticated || (auth0IsAuthenticated && auth0User);
  
  // Authenticated, render content
  if (isEitherAuthenticated || (hasToken.current && extraWaitComplete && isPostRedirect.current)) {
    return <>{children}</>;
  }
  
  // Not authenticated but in redirect process
  if (isRedirecting) {
    return <LoadingScreen />;
  }
  
  // Fallback loading as we make authentication decision
  return <LoadingScreen />;
} 