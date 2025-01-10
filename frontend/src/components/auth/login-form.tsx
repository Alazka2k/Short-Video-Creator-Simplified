"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthErrorKeys, getAuthError } from "@/lib/errors/auth";

export function LoginForm() {
  const { loginWithRedirect, getAccessTokenSilently, user: auth0User } = useAuth0();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorKey = AuthErrorKeys.login.DEFAULT;
        switch (response.status) {
          case 401:
            errorKey = AuthErrorKeys.login.INVALID_CREDENTIALS;
            break;
          case 404:
            errorKey = AuthErrorKeys.login.USER_NOT_FOUND;
            break;
          case 403:
            errorKey = AuthErrorKeys.login.ACCOUNT_LOCKED;
            break;
          case 429:
            errorKey = AuthErrorKeys.login.RATE_LIMIT_EXCEEDED;
            break;
        }
        throw new Error(getAuthError(errorKey, 'login'));
      }

      await login(data.user, data.tokens);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || getAuthError(AuthErrorKeys.login.DEFAULT, 'login'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // First, authenticate with Google through Auth0
      await loginWithRedirect({
        authorizationParams: {
          connection: "google-oauth2",
        },
      });

      // Auth0 will redirect back to the app, and we'll get the token
      const accessToken = await getAccessTokenSilently();

      // Send the token and user info to our backend
      const response = await fetch("/api/auth/social", {
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
        throw new Error(getAuthError(errorKey, 'google'));
      }

      await login(data.user, data.tokens);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Google login error:", error);
      let errorKey = AuthErrorKeys.google.DEFAULT;
      
      if (error.error === "login_required") {
        errorKey = AuthErrorKeys.google.LOGIN_INTERRUPTED;
      } else if (error.error === "consent_required") {
        errorKey = AuthErrorKeys.google.PERMISSION_REQUIRED;
      }

      toast({
        variant: "destructive",
        title: "Google login failed",
        description: error.message || getAuthError(errorKey, 'google'),
      });
    } finally {
      setIsLoading(false);
    }
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

        <form onSubmit={handleEmailLogin} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">Password</label>
              <Link 
                href="/reset-password" 
                className="text-sm text-purple-500 hover:text-purple-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              className="bg-black/20 border-white/10 text-white placeholder:text-zinc-500 h-12 text-base"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

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
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full border-foreground/20 hover:bg-foreground/5"
        >
          <FcGoogle className="h-5 w-5 mr-2" />
          Continue with Google
        </Button>

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