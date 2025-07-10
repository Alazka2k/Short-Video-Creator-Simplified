"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import Link from "next/link";
import { useAuth0 } from "@auth0/auth0-react";
import { SocialAuth } from "./social-auth";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      // This can be handled with form validation state instead of a toast
      return;
    }

    await loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
        login_hint: email,
      },
      appState: {
        returnTo: "/dashboard", // Or any other initial page after signup
      },
    });
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

        <form onSubmit={handleSignup} className="space-y-4">
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

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={acceptTerms}
              onCheckedChange={(checked: boolean | 'indeterminate') => setAcceptTerms(checked === true)}
              disabled={isLoading}
              required
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
            disabled={isLoading || !acceptTerms}
          >
            {isLoading ? "Redirecting..." : "Create account"}
          </Button>
        </form>

        <SocialAuth isLoading={isLoading} setIsLoading={() => {}} mode="signup" />

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