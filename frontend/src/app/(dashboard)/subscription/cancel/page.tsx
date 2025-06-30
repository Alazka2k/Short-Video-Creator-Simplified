'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionCancelPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <XCircle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          Payment Cancelled
        </h1>
        <p className="text-muted-foreground">
          Your payment was cancelled. No charges were made to your account.
        </p>
      </div>

      {/* Cancel Details */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>What happened?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You cancelled the payment process before completing your subscription. 
              Your account remains on the current plan and no charges were made.
            </p>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">What you can do:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Try the payment process again</li>
                <li>• Contact support if you experienced any issues</li>
                <li>• Continue using your current plan</li>
                <li>• Review our pricing options</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/pricing">
            <Button className="bg-primary hover:bg-primary/90">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </Link>
          <Link href="/dashboard/subscription">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Subscription
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 