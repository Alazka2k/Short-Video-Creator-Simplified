'use client';

import { useEffect, useState } from 'react';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { QuickActionCards } from '@/components/dashboard/QuickActionCards';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { RecentCreations } from '@/components/dashboard/RecentCreations';
import { RecentVideos } from '@/components/dashboard/RecentVideos';
import { TokenSummary } from '@/components/dashboard/TokenSummary';
import { useAuth } from '@/lib/hooks/useAuth';
import { Subscription, TokenBalance } from '@/types/dashboard';

export default function DashboardPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { getAccessToken, isAuthenticated } = useAuth();

  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        const token = await getAccessToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [subRes, balanceRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/subscriptions/me`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/tokens/balance/me`, { headers }),
        ]);

        if (!subRes.ok || !balanceRes.ok) {
          throw new Error('Failed to fetch dashboard data.');
        }

        const subData = await subRes.json();
        const balanceData = await balanceRes.json();
        
        setSubscription(subData.length > 0 ? subData[0] : null);
        setBalance(balanceData);

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [getAccessToken, isAuthenticated]);

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <WelcomeHeader subscription={subscription} isLoading={isLoading} />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <QuickActionCards />
          <StatsGrid />
        </div>
        <div className="lg:col-span-1">
          <TokenSummary subscription={subscription} balance={balance} isLoading={isLoading} error={error} />
        </div>
      </div>
      <div>
        <RecentCreations />
      </div>
      <div>
        <RecentVideos />
      </div>
    </div>
  );
} 