/**
 * ============================================================================
 * SUBSCRIPTION MANAGEMENT PAGE - USER SUBSCRIPTION DASHBOARD
 * ============================================================================
 * 
 * This page provides a comprehensive dashboard for users to manage their
 * subscription, view token usage, and access billing information using
 * atomic components and hooks for data fetching.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionHeader } from '@/components/subscription/SubscriptionHeader';
import { CurrentPlanCard } from '@/components/subscription/CurrentPlanCard';
import { UsageHistoryCard } from '@/components/subscription/UsageHistoryCard';
import { LowTokenWarning } from '@/components/subscription/LowTokenWarning';
import { TokenSummary } from '@/components/dashboard/TokenSummary';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useTokenBalance } from '@/lib/hooks/useTokenBalance';
import { useTransactionHistory } from '@/lib/hooks/useTransactionHistory';



/**
 * Subscription management page component that displays current subscription
 * details, token usage, and provides subscription management options using
 * atomic components and hooks for data fetching.
 * 
 * @returns {JSX.Element} Subscription dashboard with plan details and management options
 */
export default function SubscriptionPage() {
  const router = useRouter();
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Use hooks for data fetching
  const { data: subscriptionsArray, isLoading: subscriptionLoading, error: subscriptionError } = useSubscription();
  const { data: balance, isLoading: balanceLoading, error: balanceError } = useTokenBalance();
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useTransactionHistory(5);

  // Extract first active subscription from array
  const subscription = subscriptionsArray && subscriptionsArray.length > 0 ? subscriptionsArray[0] : null;
  const isLoading = subscriptionLoading || balanceLoading;
  const error = subscriptionError || balanceError;



  // Event handlers
  const handleChangePlan = () => {
    router.push('/pricing');
  };

  const handleCancelSubscription = () => {
    // TODO: Implement subscription cancellation
    console.log('Cancel subscription clicked');
  };

  const handleViewFullHistory = () => {
    setShowTransactionModal(true);
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handlePurchaseTokens = () => {
    router.push('/pricing#token-packages');
  };

  // Check if low token warning should be shown
  const tokenBalance = balance?.balance || 0;
  const showLowTokenWarning = tokenBalance < 200;

  return (
    <div className="relative flex-1 space-y-8 p-8 pt-6">
      {/* Header Component */}
      <SubscriptionHeader isLoading={isLoading} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card Component */}
        <CurrentPlanCard 
          subscription={subscription}
          isLoading={isLoading}
          error={error}
          onChangePlan={handleChangePlan}
          onCancelSubscription={handleCancelSubscription}
        />

        {/* Token Usage Component - using existing TokenSummary */}
        <TokenSummary 
          subscription={subscription}
          balance={balance || null}
          isLoading={isLoading}
          error={error}
        />

        {/* Usage History Card Component */}
        <UsageHistoryCard 
          transactions={transactions || []}
          isLoading={transactionsLoading}
          error={transactionsError}
          onViewFullHistory={handleViewFullHistory}
        />
      </div>

      {/* Low Token Warning Component */}
      <LowTokenWarning 
        tokenBalance={tokenBalance}
        threshold={200}
        isVisible={showLowTokenWarning}
        onUpgrade={handleUpgrade}
        onPurchaseTokens={handlePurchaseTokens}
      />

      {/* TODO: Add Transaction History Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Full Transaction History</h3>
            <p className="text-gray-600 mb-4">Transaction history modal will be implemented in a future step.</p>
            <button 
              onClick={() => setShowTransactionModal(false)}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 