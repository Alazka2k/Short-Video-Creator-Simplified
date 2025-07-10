"use client";

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Auth0Provider as Auth0ProviderBase, useAuth0, AppState, LogoutOptions } from '@auth0/auth0-react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

// Define the structure of our custom user object based on JWT claims
interface User {
  userId: number;
  email: string;
  name?: string;
  picture?: string;
  isAdmin: boolean;
  permissions: string[];
  subscriptionPlanId: number;
  auth0Id?: string; // For debugging or specific Auth0 interactions
}

// Define the shape of our new, simplified AuthContext
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  getAccessToken: () => Promise<string>;
  logout: (options?: LogoutOptions) => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook for components to access the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Internal provider component that performs the authentication logic
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0IsLoading,
    user: auth0User,
    getAccessTokenSilently,
    logout: auth0Logout,
  } = useAuth0();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processAuthentication = async () => {
      if (auth0IsLoading) {
        setIsLoading(true);
        return;
      }

      if (!auth0IsAuthenticated) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const token = await getAccessTokenSilently();
        const decodedToken: any = jwtDecode(token);
        const namespace = process.env.NEXT_PUBLIC_AUTH0_CUSTOM_CLAIMS_NAMESPACE || 'https://short-video-creator.com/';

        const customClaims: User = {
          userId: decodedToken[`${namespace}user_id`],
          email: decodedToken[`${namespace}email`],
          name: decodedToken[`${namespace}name`] || auth0User?.name,
          picture: auth0User?.picture,
          isAdmin: decodedToken[`${namespace}is_admin`] || false,
          permissions: decodedToken[`${namespace}permissions`] || [],
          subscriptionPlanId: decodedToken[`${namespace}subscription_plan_id`] || 1,
          auth0Id: auth0User?.sub,
        };

        if (!customClaims.userId || !customClaims.email) {
          console.error("JWT is missing essential custom claims (userId, email). Logging out.");
          setUser(null);
          auth0Logout({ logoutParams: { returnTo: window.location.origin } });
        } else {
          setUser(customClaims);
        }
      } catch (error) {
        console.error("Failed to process authentication token:", error);
        setUser(null);
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });
      } finally {
        setIsLoading(false);
      }
    };

    processAuthentication();
  }, [auth0IsAuthenticated, auth0IsLoading, auth0User, getAccessTokenSilently, auth0Logout]);

  const getAccessToken = async (): Promise<string> => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error("Failed to get access token:", error);
      throw new Error('Failed to get access token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !isLoading && !!user,
        isLoading,
        user,
        getAccessToken,
        logout: auth0Logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Main wrapper component that configures and provides the official Auth0 context
export function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_SPA_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;

  if (!domain || !clientId || !audience) {
    console.error('Auth0 configuration missing. Check environment variables.');
    return <div>Auth0 Configuration Error. Please check the console.</div>;
  }

  const onRedirectCallback = (appState?: AppState) => {
    router.push(appState?.returnTo || '/dashboard');
  };

  return (
    <Auth0ProviderBase
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/callback` : undefined,
        audience: audience,
        scope: "openid profile email"
      }}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </Auth0ProviderBase>
  );
}