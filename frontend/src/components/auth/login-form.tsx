"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthErrorKeys, getAuthError } from "@/lib/errors/auth";
import { AuthLogger } from "@/lib/debug/auth-logger";
import { SocialAuth } from "./social-auth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    AuthLogger.log('Starting email login attempt', { email });

    try {
      const response = await fetch(`/api/auth/proxy?endpoint=/api/auth/login`, {
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
        AuthLogger.error('Email login failed', { status: response.status, error: data.error });
        throw new Error(getAuthError(errorKey, 'login'));
      }

      AuthLogger.log('Email login successful', { userId: data.user.user_id });
      await login(data.user, data.tokens);
      router.push("/dashboard");
    } catch (error: any) {
      AuthLogger.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || getAuthError(AuthErrorKeys.login.DEFAULT, 'login'),
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

        <SocialAuth isLoading={isLoading} setIsLoading={setIsLoading} mode="login" />

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