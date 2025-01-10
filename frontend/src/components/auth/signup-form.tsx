"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthErrorKeys, getAuthError } from "@/lib/errors/auth";
import { PasswordValidation } from "./password-validation";

export function SignupForm() {
  const { loginWithRedirect, getAccessTokenSilently, user: auth0User } = useAuth0();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      toast({
        variant: "destructive",
        title: "Terms Required",
        description: getAuthError(AuthErrorKeys.signup.TERMS_REQUIRED, 'signup'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorKey = AuthErrorKeys.signup.DEFAULT;
        switch (response.status) {
          case 409:
            errorKey = AuthErrorKeys.signup.EMAIL_EXISTS;
            break;
          case 400:
            if (data.field === "email") {
              errorKey = AuthErrorKeys.signup.INVALID_EMAIL;
            } else if (data.field === "password") {
              errorKey = AuthErrorKeys.signup.INVALID_PASSWORD;
            }
            break;
          case 403:
            errorKey = AuthErrorKeys.signup.REGISTRATION_DISABLED;
            break;
        }
        throw new Error(getAuthError(errorKey, 'signup'));
      }

      await login(data.user, data.tokens);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || getAuthError(AuthErrorKeys.signup.DEFAULT, 'signup'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    try {
      await loginWithRedirect({
        authorizationParams: {
          connection: "google-oauth2",
          screen_hint: "signup",
        },
      });

      const accessToken = await getAccessTokenSilently();

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
      console.error("Google signup error:", error);
      let errorKey = AuthErrorKeys.google.DEFAULT;
      
      if (error.error === "login_required") {
        errorKey = AuthErrorKeys.google.LOGIN_INTERRUPTED;
      } else if (error.error === "consent_required") {
        errorKey = AuthErrorKeys.google.PERMISSION_REQUIRED;
      }

      toast({
        variant: "destructive",
        title: "Google signup failed",
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email below to create your account
          </p>
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-4">
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
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              disabled={isLoading}
              className="bg-background border-foreground/20"
            />
            {password && <PasswordValidation password={password} />}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={acceptTerms}
              onCheckedChange={(checked: boolean | 'indeterminate') => setAcceptTerms(checked === true)}
              disabled={isLoading}
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground">
              I accept the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                terms and conditions
              </Link>
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create account"}
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
          onClick={handleGoogleSignup}
          disabled={isLoading}
          className="w-full border-foreground/20 hover:bg-foreground/5"
        >
          <FcGoogle className="h-5 w-5 mr-2" />
          Continue with Google
        </Button>

        <div className="text-center text-sm">
          <p className="text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-500 hover:text-purple-400 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 