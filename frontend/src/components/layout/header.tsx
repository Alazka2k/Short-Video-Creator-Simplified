'use client'

import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { createDebugger } from '@/lib/debug';
import { LoadingScreen } from '@/components/ui/loading';

const DEBUG = process.env.NODE_ENV === 'development';

const debug = createDebugger('Header');

/**
 * Header Component
 * 
 * Main navigation header that appears across all pages.
 * Provides navigation, theme switching, and user account access.
 * 
 * Features:
 * - Responsive navigation menu
 * - Theme toggle (light/dark mode)
 * - User authentication status
 * - Mobile menu for smaller screens
 * - Sticky positioning
 * - Transparent to solid background transition
 * 
 * Navigation:
 * - Logo/Home link
 * - Main navigation links
 * - Authentication buttons
 * - Theme toggle
 * 
 * States:
 * - Default: Transparent background
 * - Scrolled: Solid background with blur
 * - Mobile: Hamburger menu
 * 
 * @component
 * @example
 * ```tsx
 * <Header />
 * ```
 */

export function Header() {
  const { isAuthenticated, logout, user, loginWithRedirect, isLoading } = useAuth0();
  const router = useRouter();

  // Debug auth state
  useEffect(() => {
    debug.group('Auth State');
    debug.log('isAuthenticated:', isAuthenticated);
    debug.log('isLoading:', isLoading);
    debug.log('user:', user);
    debug.groupEnd();
  }, [isAuthenticated, isLoading, user]);

  const handleLogout = () => {
    logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      }
    });
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center space-x-6">
            <Link 
              href="/" 
              className="flex items-center space-x-2"
            >
              <span className="font-bold inline-block text-xl">
                <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                  Video Creator
                </span>
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              {isAuthenticated ? (
                <Button 
                  variant="ghost" 
                  onClick={handleDashboard}
                  className="text-sm font-medium hover:text-violet-500 transition-colors"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Link 
                    href="/features" 
                    className="text-sm font-medium hover:text-violet-500 transition-colors"
                  >
                    Features
                  </Link>
                  <Link 
                    href="/pricing" 
                    className="text-sm font-medium hover:text-violet-500 transition-colors"
                  >
                    Pricing
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {user?.email}
                </span>
                <Button 
                  variant="outline"
                  onClick={() => logout({ 
                    logoutParams: { 
                      returnTo: window.location.origin 
                    }
                  })}
                  className="hover:text-violet-500 transition-colors"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost"
                  onClick={() => loginWithRedirect({
                    appState: { returnTo: '/dashboard' }
                  })}
                  className="hover:text-violet-500 transition-colors"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => loginWithRedirect({
                    authorizationParams: {
                      screen_hint: 'signup'
                    }
                  })}
                  className={cn(
                    "bg-gradient-to-r from-violet-500 to-purple-500",
                    "hover:from-violet-600 hover:to-purple-600",
                    "text-white shadow-lg transition-all"
                  )}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 