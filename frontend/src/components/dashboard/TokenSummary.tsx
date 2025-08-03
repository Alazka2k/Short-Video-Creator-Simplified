'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Zap, ShoppingCart, Settings, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Subscription, TokenBalance } from '@/types/dashboard';

interface TokenSummaryProps {
  subscription: Subscription | null;
  balance: TokenBalance | null;
  isLoading: boolean;
  error: Error | null; // Add error prop
}

export function TokenSummary({ subscription, balance, isLoading, error }: TokenSummaryProps) {
  const planName = subscription?.plan_name || 'Free Tier';
  const tokenBalance = balance?.balance || 0;
  
  // Use monthly_token_allocation as per API response
  const monthlyAllocation = subscription?.monthly_token_allocation || 0;
  
  // Progress bar logic based on monthly allocation
  const tokensFromPlan = Math.min(tokenBalance, monthlyAllocation);
  const usedPercentage = monthlyAllocation > 0 ? (tokensFromPlan / monthlyAllocation) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/10">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="p-6 text-center text-destructive-foreground">
           <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
           <p className="font-semibold">Could not load plan details</p>
           <p className="text-sm">Please try refreshing the page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight mb-4">
        Plan & Usage
      </h2>
      <Card className="bg-card/50 backdrop-blur-sm border-border/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{planName}</span>
            <span className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {tokenBalance.toLocaleString()}
            </span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Total tokens available
          </p>
        </CardHeader>
        <CardContent>
          <Progress value={usedPercentage} className="h-2 mb-4" />
          <div className="flex justify-between text-xs text-muted-foreground mb-6">
            <span>{tokensFromPlan.toLocaleString()} / {monthlyAllocation.toLocaleString()}</span>
            <span>Monthly Plan Tokens</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button asChild>
              <Link href="/pricing#token-packages">
                <ShoppingCart className="mr-2 h-4 w-4" /> Buy More Tokens
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/subscription">
                <Settings className="mr-2 h-4 w-4" /> Manage Plan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 