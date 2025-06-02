"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthErrorKeys, getAuthError } from "@/lib/errors/auth";
import { PasswordValidation } from "./password-validation";
import { SocialAuth } from "./social-auth";

// Password validation helper functions
const meetsLengthRequirement = (password: string) => password.length >= 8;
const getComplexityScore = (password: string) => {
  let score = 0;
  if (/[a-z]/.test(password)) score++; // lowercase
  if (/[A-Z]/.test(password)) score++; // uppercase
  if (/\d/.test(password)) score++;     // numbers
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++; // special chars
  return score;
};

const isPasswordValid = (password: string) => {
  return meetsLengthRequirement(password) && getComplexityScore(password) >= 3;
};

export function SignupForm() {
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

    if (!isPasswordValid(password)) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: getAuthError(AuthErrorKeys.signup.INVALID_PASSWORD, 'signup'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/proxy?endpoint=/api/auth/register`, {
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

      // Tokens are now in httpOnly cookies, so we don't handle them here
      // Just pass the minimal user data
      console.log('Registration successful', { userId: data.user.user_id });
      
      // Create a simplified tokens object for the login function (tokens are in cookies)
      const dummyTokens = {
        access_token: 'stored_in_cookie',
        refresh_token: 'stored_in_cookie', 
        expires_in: 3600
      };
      
      await login(data.user, dummyTokens);
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
              <Link href="/terms-of-service" className="text-primary hover:underline">
                terms and conditions
              </Link>
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading || !acceptTerms || !isPasswordValid(password)}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <SocialAuth isLoading={isLoading} setIsLoading={setIsLoading} mode="signup" />

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