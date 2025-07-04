'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionCancelPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <XCircle className="h-12 w-12 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Payment Cancelled
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your payment was cancelled. No charges were made to your account.
          </p>
        </div>

        {/* Cancel Details */}
        <div className="max-w-2xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What happened?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                You cancelled the payment process before completing your subscription. 
                Your account remains on the current plan and no charges were made.
              </p>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">What you can do:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></span>
                    Try the payment process again
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></span>
                    Contact support if you experienced any issues
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></span>
                    Continue using your current plan
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></span>
                    Review our pricing options
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </Link>
            <Link href="/dashboard/subscription">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
 