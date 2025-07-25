'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';

interface StripeCheckoutButtonProps {
  priceId: string;
  type: 'subscription' | 'token_package';
  packageId?: string;
  planId?: number;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export function StripeCheckoutButton({
  priceId,
  type,
  packageId,
  planId,
  children,
  className,
  disabled,
  variant = 'default',
}: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getAccessToken, isAuthenticated, user } = useAuth();

  const handleCheckout = async () => {
    try {
      setLoading(true);

      if (!isAuthenticated) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'You must be logged in to make a purchase.',
        });
        // window.location.href = '/login';
        return;
      }

      const token = await getAccessToken();

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      const endpoint = type === 'subscription' 
        ? '/api/subscription/checkout/create-subscription-session' 
        : '/api/subscription/checkout/create-token-package-session';
      
      const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/subscription/cancel`;

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          priceId,
          ...(packageId && { packageId }),
          ...(planId && { planId }),
          successUrl,
          cancelUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: 'destructive',
        title: 'Checkout Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={className}
      variant={variant}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  );
} 