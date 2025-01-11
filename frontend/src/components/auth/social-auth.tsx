"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthErrorKeys, getAuthError } from "@/lib/errors/auth";
import { AuthLogger } from "@/lib/debug/auth-logger";

interface SocialAuthProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  mode?: 'login' | 'signup';
}

export function SocialAuth({ isLoading, setIsLoading, mode = 'login' }: SocialAuthProps) {
  const { loginWithRedirect, getAccessTokenSilently, user: auth0User } = useAuth0();
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    AuthLogger.log(`Starting Google ${mode}`);
    
    try {
      // First, authenticate with Google through Auth0
      await loginWithRedirect({
        authorizationParams: {
          connection: "google-oauth2",
          screen_hint: mode === 'signup' ? 'signup' : undefined,
        },
      });

      AuthLogger.log('Google Auth0 redirect initiated');

      // Auth0 will redirect back to the app, and we'll get the token
      const accessToken = await getAccessTokenSilently();
      AuthLogger.log('Received access token from Auth0');

      // Send the token and user info to our backend through proxy
      const response = await fetch(`/api/auth/proxy?endpoint=/api/auth/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          provider: "google",
          profile: {
            sub: auth0User?.sub,
            email: auth0User?.email,
            name: auth0User?.name,
            picture: auth0User?.picture,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorKey = AuthErrorKeys.google.DEFAULT;
        switch (response.status) {
          case 409:
            errorKey = AuthErrorKeys.google.EMAIL_EXISTS;
            break;
          case 400:
            errorKey = AuthErrorKeys.google.INVALID_TOKEN;
            break;
          case 403:
            errorKey = AuthErrorKeys.google.PROVIDER_DISABLED;
            break;
        }
        AuthLogger.error('Social login failed', { status: response.status, error: data.error });
        throw new Error(getAuthError(errorKey, 'google'));
      }

      AuthLogger.log('Google auth successful', { userId: data.user.user_id });
      await login(data.user, data.tokens);
      router.push("/dashboard");
    } catch (error: any) {
      AuthLogger.error('Google auth error:', error);
      let errorKey = AuthErrorKeys.google.DEFAULT;
      
      if (error.error === "login_required") {
        errorKey = AuthErrorKeys.google.LOGIN_INTERRUPTED;
      } else if (error.error === "consent_required") {
        errorKey = AuthErrorKeys.google.PERMISSION_REQUIRED;
      }

      toast({
        variant: "destructive",
        title: `Google ${mode} failed`,
        description: error.message || getAuthError(errorKey, 'google'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-foreground/20"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className="w-full border-foreground/20 hover:bg-foreground/5"
      >
        <FcGoogle className="h-5 w-5 mr-2" />
        Continue with Google
      </Button>
    </>
  );
} 