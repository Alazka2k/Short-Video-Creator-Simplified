'use client';

import { Crown } from 'lucide-react';

interface SubscriptionHeaderProps {
  isLoading: boolean;
}

export function SubscriptionHeader({ isLoading }: SubscriptionHeaderProps) {
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-8 bg-muted-foreground/20 rounded-md animate-pulse" />
          <div className="h-9 w-48 bg-muted-foreground/20 rounded-md animate-pulse" />
        </div>
        <div className="h-5 w-80 bg-muted-foreground/20 rounded-md animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
          <Crown className="h-4 w-4 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Subscription
        </h1>
      </div>
      <p className="text-muted-foreground">
        Manage your subscription and token usage
      </p>
    </div>
  );
}