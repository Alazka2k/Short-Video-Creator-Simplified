'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/subscription/checkout/verify-session/${sessionId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to verify session');
        }

        if (data.success) {
          // Format the session data for display
          const planName = data.planDetails?.plan_name || 'Subscription Plan';
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
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Link href="/dashboard/subscription">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Thank you for your subscription. Your account has been upgraded and you're ready to start creating amazing content.
          </p>
        </div>

        {/* Success Details */}
        <div className="max-w-2xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-semibold text-lg">{sessionData?.planName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">{sessionData?.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing</p>
                  <p className="font-medium capitalize">{sessionData?.billing}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize text-green-600 dark:text-green-400">
                    {sessionData?.paymentStatus || sessionData?.status || 'Completed'}
                  </p>
                </div>
              </div>

              {sessionId && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Session ID</p>
                  <p className="font-mono text-xs text-muted-foreground break-all">{sessionId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>Your subscription is now active</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>Tokens have been added to your account</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>You'll receive a confirmation email shortly</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>You can now access all premium features</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/workbench">
              <Button size="lg" className="w-full sm:w-auto">
                Start Creating Videos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/subscription">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Subscription Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/subscription/checkout/verify-session/${sessionId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to verify session');
        }

        if (data.success) {
          // Format the session data for display
          const planName = data.planDetails?.plan_name || 'Subscription Plan';
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
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Link href="/dashboard/subscription">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Thank you for your subscription. Your account has been upgraded and you're ready to start creating amazing content.
          </p>
        </div>

        {/* Success Details */}
        <div className="max-w-2xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-semibold text-lg">{sessionData?.planName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">{sessionData?.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing</p>
                  <p className="font-medium capitalize">{sessionData?.billing}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize text-green-600 dark:text-green-400">
                    {sessionData?.paymentStatus || sessionData?.status || 'Completed'}
                  </p>
                </div>
              </div>

              {sessionId && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Session ID</p>
                  <p className="font-mono text-xs text-muted-foreground break-all">{sessionId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>Your subscription is now active</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>Tokens have been added to your account</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>You'll receive a confirmation email shortly</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>You can now access all premium features</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/workbench">
              <Button size="lg" className="w-full sm:w-auto">
                Start Creating Videos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/subscription">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Subscription Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 