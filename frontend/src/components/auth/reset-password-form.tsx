"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { AuthErrorKeys, getAuthError } from "@/lib/errors/auth";
import { PasswordValidation } from "./password-validation";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // If no token, show request reset form
  if (!token) {
    const handleRequestReset = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/reset-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? getAuthError(AuthErrorKeys.reset.EMAIL_NOT_FOUND, 'reset')
              : data.message
          );
        }

        toast({
          title: "Check your email",
          description: getAuthError(AuthErrorKeys.reset.EMAIL_SENT, 'reset'),
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Reset failed",
          description: error.message || getAuthError(AuthErrorKeys.reset.DEFAULT, 'reset'),
        });
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full p-10 rounded-xl bg-black/40 backdrop-blur-md shadow-2xl border border-white/5"
      >
        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-8">
              <div className="p-3 rounded-full bg-purple-500/10">
                <Mail className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Reset password</h1>
            <p className="text-base text-zinc-400">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleRequestReset} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-zinc-300">Email address</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={isLoading}
                className="bg-black/20 border-white/10 text-white placeholder:text-zinc-500 h-12 text-base"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-500 hover:bg-purple-600 text-white h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>
          </form>

          <div className="text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center text-base text-zinc-400 hover:text-purple-500 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show reset password form with token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: getAuthError(AuthErrorKeys.reset.PASSWORD_MISMATCH, 'reset'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorKey = AuthErrorKeys.reset.DEFAULT;
        switch (response.status) {
          case 400:
            errorKey = AuthErrorKeys.reset.RESET_INVALID;
            break;
          case 401:
            errorKey = AuthErrorKeys.reset.RESET_EXPIRED;
            break;
        }
        throw new Error(getAuthError(errorKey, 'reset'));
      }

      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password",
      });

      // Redirect to login page after successful reset
      window.location.href = "/login";
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: error.message || getAuthError(AuthErrorKeys.reset.DEFAULT, 'reset'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full p-10 rounded-xl bg-black/40 backdrop-blur-md shadow-2xl border border-white/5"
    >
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-8">
            <div className="p-3 rounded-full bg-purple-500/10">
              <Mail className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Create new password</h1>
          <p className="text-base text-zinc-400">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-zinc-300">New password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              required
              disabled={isLoading}
              className="bg-black/20 border-white/10 text-white placeholder:text-zinc-500 h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-300">Confirm password</label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              required
              disabled={isLoading}
              className="bg-black/20 border-white/10 text-white placeholder:text-zinc-500 h-12 text-base"
            />
          </div>

          {password && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-zinc-400"
            >
              <PasswordValidation password={password} />
            </motion.div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-purple-500 hover:bg-purple-600 text-white h-12 text-base"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </Button>
        </form>

        <div className="text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center text-base text-zinc-400 hover:text-purple-500 transition-colors"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to login
          </Link>
        </div>
      </div>
    </motion.div>
  );
} 