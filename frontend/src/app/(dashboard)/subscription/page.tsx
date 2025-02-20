'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  Zap,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

// Dummy data
const subscriptionData = {
  currentPlan: 'Professional',
  status: 'active',
  renewalDate: '2024-02-15',
  price: 49.99,
  billingCycle: 'monthly',
  features: [
    'Up to 50 videos per month',
    'Max 10 minutes per video',
    '10,000 tokens included',
    'Priority support',
    'Advanced customization',
    'Commercial usage rights',
  ],
  tokens: {
    included: 10000,
    used: 6500,
    purchased: 2000,
  },
};

export default function SubscriptionPage() {
  const totalTokens = subscriptionData.tokens.included + subscriptionData.tokens.purchased;
  const usedPercentage = (subscriptionData.tokens.used / totalTokens) * 100;

  return (
    <div className="relative flex-1 space-y-8 p-8 pt-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Subscription
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and token usage
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-2xl font-bold">{subscriptionData.currentPlan}</h3>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Renews on {subscriptionData.renewalDate}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span>${subscriptionData.price}/month</span>
                </div>
                <div className="flex gap-4 mt-6">
                  <Button className="bg-primary/80 hover:bg-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                    Change Plan
                  </Button>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    Cancel Subscription
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {subscriptionData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Usage Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Token Usage
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Current billing period
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">
                    {subscriptionData.tokens.used.toLocaleString()} / {totalTokens.toLocaleString()} tokens used
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(totalTokens - subscriptionData.tokens.used).toLocaleString()} remaining
                  </div>
                </div>
                <Progress value={usedPercentage} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan tokens</span>
                  <span>{subscriptionData.tokens.included.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Additional tokens</span>
                  <span>{subscriptionData.tokens.purchased.toLocaleString()}</span>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
              >
                Purchase More Tokens
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage History Card */}
        <Card>
          <CardHeader>
            <CardTitle>Usage History</CardTitle>
            <p className="text-sm text-muted-foreground">
              Recent token consumption
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add usage history items here */}
              <Button 
                variant="outline" 
                className="w-full group hover:bg-primary/5"
              >
                View Full History
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning Card */}
      <Card className="bg-amber-500/10 border-amber-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 text-amber-500">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Approaching Token Limit</p>
              <p className="text-sm text-amber-500/80">Consider upgrading your plan or purchasing additional tokens.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 