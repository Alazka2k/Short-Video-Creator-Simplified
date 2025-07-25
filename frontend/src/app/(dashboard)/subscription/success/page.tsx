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
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Loader2, AlertTriangle, Gift, Star } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

export default function SubscriptionSuccessPage() {
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { getAccessToken } = useAuth();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    const verifySession = async () => {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Authentication token not found. Please log in again.');

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/subscription/checkout/verify-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to verify session');
        }

        const data = await response.json();
        
        if (data.success && data.purchaseDetails) {
          setPurchaseDetails(data.purchaseDetails);
        } else {
          setError('Session verification failed.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [searchParams, getAccessToken]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="mt-4 text-lg text-muted-foreground">Verifying your payment...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <p className="mt-4 text-lg font-semibold">Payment Verification Failed</p>
          <p className="text-muted-foreground">{error}</p>
          <Button asChild className="mt-6">
            <Link href="/pricing">Return to Pricing</Link>
          </Button>
        </div>
      );
    }

    if (purchaseDetails) {
      let title = "Payment Successful!";
      let description = "Thank you for your purchase.";
      let icon = <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />;

      switch (purchaseDetails.type) {
        case 'TOKEN_PACKAGE_PURCHASE':
          title = "Tokens Added!";
          description = "Your new tokens are now available in your account.";
          icon = <Gift className="w-12 h-12 text-primary" />;
          break;
        case 'NEW_SUBSCRIPTION':
          title = "Welcome Aboard!";
          description = "Your new subscription plan is now active.";
          icon = <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />;
          break;
        case 'SUBSCRIPTION_UPGRADE':
          title = "Upgrade Successful!";
          description = "You now have access to all the features of your new plan.";
          icon = <Star className="w-12 h-12 text-yellow-500" />;
          break;
      }

      return (
        <>
          <CardHeader className="text-center">
            <div className="mx-auto bg-muted rounded-full p-3 w-fit">
              {icon}
            </div>
            <CardTitle className="mt-4 text-3xl font-bold">{title}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 p-6 border rounded-lg bg-muted/50">
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
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full text-lg">
              <Link href="/dashboard">
                Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </>
      );
    }
    
    return null;
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden p-4">
      <div className="main-gradient" />
      <div className="gradient-overlay" />
      <div className="container max-w-7xl mx-auto py-24">
        <div className="relative max-w-2xl mx-auto">
          <div className="relative z-10 bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl p-8">
            {renderContent()}
          </div>
          <div className="absolute inset-0 -z-10 rounded-xl">
            <div className="absolute inset-[-3px] rounded-xl">
              <HoverBorderGradient
                as="div"
                containerClassName="w-full h-full"
                className="bg-transparent"
                duration={3}
              />
            </div>
            <div className="absolute inset-[1px] bg-background rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
} 