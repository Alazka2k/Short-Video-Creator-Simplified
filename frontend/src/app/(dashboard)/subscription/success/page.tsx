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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

/**
 * Subscription success page component that verifies and displays payment confirmation.
 * Handles Stripe session verification and provides post-payment user experience.
 * 
 * @returns {JSX.Element} Success page with payment details and navigation options
 */
export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verify the Stripe session and fetch payment details.
   * This ensures the payment was successful and gets confirmation data.
   */
  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        // Call our backend to verify the Stripe session
        const response = await fetch(`/api/subscription/checkout/verify-session/${sessionId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to verify session');
        }

        if (data.success) {
          // Format the session data for display
          const planName = data.planDetails?.name || 'Subscription Plan';
          const amount = data.amountTotal ? `€${(data.amountTotal / 100).toFixed(2)}` : 'N/A';
          const billing = data.planDetails?.billing_frequency || 'monthly';
          
          setSessionData({
            planName,
            amount,
            billing,
            status: data.status,
            paymentStatus: data.paymentStatus,
            mode: data.mode,
            created: data.created,
            subscriptionId: data.subscriptionId,
            customerId: data.customerId
          });
        } else {
          setError('Session verification failed');
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        setError(error instanceof Error ? error.message : 'Failed to verify payment session');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Link href="/dashboard/subscription">
              <Button>Go to Subscription</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          Payment Successful!
        </h1>
        <p className="text-muted-foreground">
          Thank you for your subscription. Your account has been upgraded.
        </p>
      </div>

      {/* Success Details */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{sessionData?.planName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium">{sessionData?.amount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billing</p>
                <p className="font-medium capitalize">{sessionData?.billing}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Session ID</p>
                <p className="font-mono text-xs text-muted-foreground">{sessionId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{sessionData?.paymentStatus || sessionData?.status || 'Unknown'}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">What happens next?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Your subscription is now active
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Tokens have been added to your account
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  You'll receive a confirmation email shortly
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  You can now create unlimited videos
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/dashboard/workbench">
            <Button className="bg-primary hover:bg-primary/90">
              Start Creating Videos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/subscription">
            <Button variant="outline">
              View Subscription
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 