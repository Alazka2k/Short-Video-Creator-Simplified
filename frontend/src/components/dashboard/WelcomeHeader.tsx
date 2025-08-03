'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Subscription } from '@/types/dashboard';
import { formatDistanceToNow } from 'date-fns';

interface WelcomeHeaderProps {
  subscription: Subscription | null;
  isLoading: boolean;
}

export function WelcomeHeader({ subscription, isLoading }: WelcomeHeaderProps) {
  const { user } = useAuth();

  const renderWelcomeMessage = () => {
    if (isLoading) {
      return <div className="h-7 w-48 bg-muted-foreground/20 rounded-md animate-pulse" />;
    }
    return `Welcome, ${user?.name || 'Creator'}!`;
  };

  const renderSubscriptionInfo = () => {
    if (isLoading) {
      return <div className="h-5 w-80 bg-muted-foreground/20 rounded-md animate-pulse mt-2" />;
    }
    
    if (subscription && subscription.plan_id > 1 && subscription.current_period_end) {
      const nextAllocationDate = new Date(subscription.current_period_end);
      const now = new Date();
      
      // Check if the date is in the future before formatting
      if (nextAllocationDate > now) {
        const timeRemaining = formatDistanceToNow(nextAllocationDate, { addSuffix: true });
        return `Your next token allocation is ${timeRemaining}.`;
      }
      return "Your next token allocation is due soon.";
    }

    return "You are on the Free Tier. Upgrade to get monthly tokens!";
  };

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {renderWelcomeMessage()}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {renderSubscriptionInfo()}
      </p>
    </div>
  );
} 