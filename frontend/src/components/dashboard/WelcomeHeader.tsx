'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Subscription } from '@/lib/hooks/useSubscription';
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
    return "Welcome back!";
  };

  const renderSubscriptionInfo = () => {
    if (isLoading) {
      return <div className="h-5 w-80 bg-muted-foreground/20 rounded-md animate-pulse mt-2" />;
    }
    
    // More contextual and motivational messaging
    if (subscription && subscription.plan_id > 1) {
      return `Let's create something incredible today!`;
    }

    return "Start your creative journey today — upgrade for unlimited possibilities!";
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