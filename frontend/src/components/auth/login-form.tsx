"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth0 } from '@auth0/auth0-react';
import { cn } from '@/lib/utils';
import { Apple } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface Auth0User {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export function LoginForm() {
  const { loginWithPopup, getAccessTokenSilently } = useAuth0();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialLogin = async (provider: string) => {
    try {
      setIsLoading(true);

      // Login with Auth0 popup
      const auth0Response = (await loginWithPopup({
        authorizationParams: {
          connection: provider
        }
      })) as unknown as { user: Auth0User };

      // Get the access token
      const accessToken = await getAccessTokenSilently();

      // Before sending to backend, verify auth0Response exists and has user data
      if (auth0Response?.user) {
        // Create/update user in our database through API gateway
        const response = await fetch('/api/auth/social', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            accessToken,
            provider,
            profile: auth0Response.user,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create user account');
        }
      }

      toast({
        title: 'Welcome!',
        description: 'Successfully signed in.',
      });
    } catch (error) {
      console.error('Social login error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign in. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2">
      <CardContent className="space-y-4 pt-6">
        <Button 
          className={cn(
            "w-full bg-gradient-to-r from-violet-500 to-purple-500",
            "transition-all duration-200",
            "hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]",
            "hover:scale-[1.02]"
          )}
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading}
        >
          <img src="/icons/google.svg" alt="Google" className="mr-2 h-4 w-4" />
          Sign in with Google
        </Button>

        <Button 
          variant="outline" 
          className="w-full border-2"
          onClick={() => handleSocialLogin('apple')}
          disabled={isLoading}
        >
          <Apple className="mr-2 h-4 w-4" />
          Sign in with Apple
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full border-2"
          onClick={() => handleSocialLogin('email')}
          disabled={isLoading}
        >
          Create an account
        </Button>
      </CardContent>
    </Card>
  );
} 