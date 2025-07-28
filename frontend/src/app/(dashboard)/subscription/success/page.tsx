/**
 * ============================================================================
 * SUBSCRIPTION SUCCESS PAGE - STRIPE PAYMENT CONFIRMATION
 * ============================================================================
 * 
 * This page handles successful Stripe payment confirmations and displays
 * payment details to users after completing a subscription purchase.
 * 
 * STRIPE INTEGRATION FLOW:
 * 1. User completes payment in Stripe Checkout
 * 2. Stripe redirects to this page with session_id parameter
 * 3. Page calls /api/subscription/checkout/verify-session to get details
 * 4. Displays payment confirmation and subscription information
 * 5. Provides navigation options to continue using the platform
 * 
 * KEY FEATURES:
 * - Session verification with Stripe backend
 * - Payment details display (plan, amount, billing frequency)
 * - Loading states during verification
 * - Error handling for invalid sessions
 * - Clear next steps for users
 * - Navigation to workbench and subscription management
 * 
 * URL PARAMETERS:
 * - session_id: Stripe Checkout session ID for verification
 * 
 * API INTEGRATION:
 * - GET /api/subscription/checkout/verify-session/{sessionId}
 * - Returns session details, payment status, and plan information
 * 
 * USER EXPERIENCE:
 * - Immediate confirmation of successful payment
 * - Clear display of what was purchased
 * - Helpful next steps and navigation options
 * - Professional, reassuring design
 * 
 * ERROR HANDLING:
 * - Invalid session IDs
 * - Network errors during verification
 * - Missing session parameters
 * - Fallback navigation options
 * 
 * DEPENDENCIES:
 * - Next.js App Router with search params
 * - Stripe session verification API
 * - UI components for consistent design
 * - Navigation hooks for routing
 * 
 * SECURITY CONSIDERATIONS:
 * - Session verification prevents tampering
 * - Server-side validation of payment status
 * - Safe handling of payment information
 * 
 * Last Updated: 2025-06-30
 * Architecture: Stripe Payment Success Confirmation
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Loader2, PartyPopper, Gift, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

interface PurchaseDetails {
  type: 'TOKEN_PACKAGE_PURCHASE' | 'NEW_SUBSCRIPTION' | 'SUBSCRIPTION_UPGRADE';
  itemName: string;
  amountPaid: string;
  billingInfo: string;
}

/**
 * Subscription success page component that verifies and displays payment confirmation.
 * Handles Stripe session verification and provides post-payment user experience.
 * 
 * @returns {JSX.Element} Success page with payment details and navigation options
 */
export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState(searchParams.get('session_id'));
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken, isAuthenticated } = useAuth();

  /**
   * Verify the Stripe session and fetch payment details.
   * This ensures the payment was successful and gets confirmation data.
   */
  useEffect(() => {
    // Prevent re-running if we already have details or are done.
    if (!sessionId || purchaseDetails || error) {
      setIsLoading(false);
      return;
    }

    const verifySession = async () => {
      setIsLoading(true);
      try {
        if (!isAuthenticated) {
          // Wait for auth to be ready
          return;
        }
        
        const token = await getAccessToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/checkout/verify-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || data.error || 'Failed to verify session');
        }

        if (data.success) {
          setPurchaseDetails(data.purchaseDetails);
          setIsFinalizing(true); // Start the finalization process

          // Redirect to dashboard after a delay. This allows the auth state to settle naturally.
          setTimeout(() => {
            router.push('/dashboard');
          }, 4000); // 4-second delay

        } else {
          setError(data.message || 'Session verification failed');
        }
      } catch (err) {
        console.error('Error verifying session:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [sessionId, purchaseDetails, error, router, isAuthenticated, getAccessToken]);

  const renderSuccessContent = () => {
    if (!purchaseDetails) {
      return null;
    }

    let icon = <PartyPopper className="h-8 w-8 text-primary" />;
    let title = "Purchase Successful!";
    let description = "Thank you for your purchase. Your account has been updated.";

    switch (purchaseDetails.type) {
      case 'NEW_SUBSCRIPTION':
        icon = <PartyPopper className="h-8 w-8 text-primary" />;
        title = "Welcome Aboard!";
        description = "Your new subscription is active. Welcome to a new level of creativity!";
        break;
      case 'SUBSCRIPTION_UPGRADE':
        icon = <ArrowUpCircle className="h-8 w-8 text-primary" />;
        title = "Upgrade Successful!";
        description = "You now have access to all the features of your new plan.";
        break;
      case 'TOKEN_PACKAGE_PURCHASE':
        icon = <Gift className="h-8 w-8 text-primary" />;
        title = "Tokens Added!";
        description = "Your token balance has been updated. Happy creating!";
        break;
    }

    return (
      <div className="w-full max-w-2xl">
        <HoverBorderGradient
          containerClassName="rounded-xl"
          as="div"
          className="bg-card/50 dark:bg-black/80 backdrop-blur-sm text-card-foreground p-0 rounded-xl w-full"
        >
          <Card className="w-full bg-transparent border-none shadow-none">
            <CardHeader className="text-center items-center pt-8">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                {icon}
              </div>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {title}
              </CardTitle>
              <p className="text-muted-foreground pt-2">
                {description}
              </p>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8">
              <div className="border-t border-border/50 pt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Item</p>
                  <p className="font-medium">{purchaseDetails.itemName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="font-medium">{purchaseDetails.amountPaid}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing</p>
                  <p className="font-medium capitalize">{purchaseDetails.billingInfo}</p>
                </div>
                {isFinalizing && (
                  <div className="md:col-span-2 text-center text-sm text-muted-foreground animate-pulse pt-4">
                    Finalizing your account... Redirecting to dashboard shortly.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </HoverBorderGradient>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">Verifying your payment...</p>
    </div>
  );

  const renderError = () => (
    <Card className="max-w-md w-full">
      <CardContent className="pt-6 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Link href="/dashboard/subscription">
          <Button>Go to Subscription</Button>
        </Link>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 flex items-start justify-center p-4 sm:p-8 pt-16 sm:pt-24">
      {isLoading && renderLoading()}
      {error && !isLoading && renderError()}
      {!isLoading && !error && purchaseDetails && renderSuccessContent()}
    </div>
  );
} 