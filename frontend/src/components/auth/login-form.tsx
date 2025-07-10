"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { useAuth0 } from "@auth0/auth0-react";
import { Logger } from "@/lib/debug/logger";
import { SocialAuth } from "./social-auth";

const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
const authLogger = new Logger('Auth');

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [returnPath, setReturnPath] = useState("/dashboard");
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { loginWithRedirect, isLoading } = useAuth0();

  // Extract and save the returnTo parameter when component mounts
  useEffect(() => {
    const returnTo = searchParams.get("returnTo");
    if (returnTo) {
      const decodedPath = decodeURIComponent(returnTo);
      authLogger.log('Found returnTo path:', { path: decodedPath });
      setReturnPath(decodedPath);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    authLogger.log('Starting universal login redirect', { email, returnPath });
    
    await loginWithRedirect({
      appState: {
        returnTo: returnPath,
      },
      authorizationParams: {
        login_hint: email, // Pre-fill the email address on the Auth0 page
      }
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email address</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              disabled={isLoading}
              className="bg-background border-foreground/20"
            />
          </div>

          <div className="space-y-2">
            {/* Password input is no longer needed here as Auth0 handles it */}
            <div className="flex items-center justify-end">
              <Link 
                href={`https://${domain}/u/reset-password`} // Direct link to Auth0 password reset
                className="text-sm text-primary hover:text-primary/90 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? "Redirecting..." : "Sign in"}
          </Button>
        </form>

        <SocialAuth isLoading={isLoading} setIsLoading={() => {}} mode="login" returnPath={returnPath} />

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
} 