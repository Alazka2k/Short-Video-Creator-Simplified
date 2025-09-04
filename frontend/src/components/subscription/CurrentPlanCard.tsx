'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Calendar, CreditCard, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { Subscription, MarketingFeature } from '@/lib/hooks/useSubscription';

interface CurrentPlanCardProps {
  subscription: Subscription | null;
  isLoading: boolean;
  error: Error | null;
  onChangePlan: () => void;
  onCancelSubscription: () => void;
}

export function CurrentPlanCard({ 
  subscription, 
  isLoading, 
  error, 
  onChangePlan, 
  onCancelSubscription 
}: CurrentPlanCardProps) {
  if (isLoading) {
    return (
      <Card className="md:col-span-2 bg-card/50 backdrop-blur-sm border border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="h-8 w-32 bg-muted-foreground/20 rounded-md animate-pulse mb-2" />
              <div className="h-5 w-48 bg-muted-foreground/20 rounded-md animate-pulse mb-1" />
              <div className="h-5 w-36 bg-muted-foreground/20 rounded-md animate-pulse mb-6" />
              <div className="flex gap-4">
                <div className="h-10 w-28 bg-muted-foreground/20 rounded-md animate-pulse" />
                <div className="h-10 w-36 bg-muted-foreground/20 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted-foreground/20 rounded animate-pulse" />
                  <div className="h-4 w-48 bg-muted-foreground/20 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="md:col-span-2 bg-destructive/10 border-destructive/20">
        <CardContent className="p-6 text-center text-destructive-foreground">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
          <p className="font-semibold">Could not load subscription information</p>
          <p className="text-sm">Please try refreshing the page. If the error persists, please contact support.</p>
        </CardContent>
      </Card>
    );
  }

  const planName = subscription?.plan_name || 'Free Tier';
  const renewalDate = subscription?.current_period_end 
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : 'N/A';

  return (
    <Card className="md:col-span-2 bg-card/50 backdrop-blur-sm border border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Current Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-2xl font-bold">{planName}</h3>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {/* Bug: 
                Also in subscription plan 1 we have a renewal.
                Where is the renewal coming from?
                We should show the next payment date (we get from the subscription in Stripe) 
                and the token allocation date (we get from the subscription in the database). 
                But the token allocation date should be shown in the Plan & Usage card.
                */}
                {subscription?.plan_id === 1 
                  ? 'Free plan - no renewal needed' 
                  : `Renews on ${renewalDate}`
                }
              </span>
            </div>
            {subscription?.plan_id !== 1 && (
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span>Active subscription</span>
              </div>
            )}
            <div className="flex gap-4 mt-6">
              <Button 
                onClick={onChangePlan}
                className="bg-primary/80 hover:bg-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
              >
                Change Plan
              </Button>
              {subscription?.plan_id !== 1 && (
                <Button 
                  onClick={onCancelSubscription}
                  variant="outline" 
                  className="text-destructive hover:text-destructive"
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {subscription?.marketing_description?.features && subscription.marketing_description.features.length > 0 ? (
              subscription.marketing_description.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className={feature.highlight ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                    {feature.title}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                No plan features available
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}