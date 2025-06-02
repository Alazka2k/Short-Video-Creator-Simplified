"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "@/components/ui/use-toast";
import { AuthErrorKeys, getAuthError } from "@/lib/errors/auth";
import { AuthLogger } from "@/lib/debug/auth-logger";

interface SocialAuthProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  mode?: 'login' | 'signup';
  returnPath?: string;
}

export function SocialAuth({ isLoading, setIsLoading, mode = 'login', returnPath = '/dashboard' }: SocialAuthProps) {
  const { loginWithRedirect } = useAuth0();
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    AuthLogger.log(`Starting Google ${mode}`, { returnPath });
    
    try {
      // Authenticate with Google through Auth0 SPA SDK
      // This will redirect to Auth0/Google and back to our app
      // AuthContext will handle syncing with backend after auth
      await loginWithRedirect({
        authorizationParams: {
          connection: "google-oauth2",
          screen_hint: mode === 'signup' ? 'signup' : undefined,
        },
        appState: {
          returnTo: returnPath
        }
      });

      // Note: Code after loginWithRedirect() won't execute because the page redirects immediately
      AuthLogger.log('Google OAuth redirect initiated via Auth0 SPA SDK');

    } catch (error: any) {
      AuthLogger.error('Google auth redirect error:', error);
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