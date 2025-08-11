'use client';

import { useEffect, useState } from 'react';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { QuickActionCards } from '@/components/dashboard/QuickActionCards';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { RecentCreations } from '@/components/dashboard/RecentCreations';
import { RecentVideos } from '@/components/dashboard/RecentVideos';
import { TokenSummary } from '@/components/dashboard/TokenSummary';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="main-gradient" />
      <div className="gradient-overlay" />

      <div className="container max-w-7xl mx-auto py-12">
        <div className="relative">
          {/* Header section */}
          <div className="mb-8">
            <WelcomeHeader subscription={subscription} isLoading={isLoading} />
          </div>

          {/* Main dashboard content */}
          <div className="relative">
            <div className="relative z-10 bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
              <div className="p-8 space-y-8">
                {/* Primary Actions */}
                <QuickActionCards />
                
                {/* Secondary Content Row */}
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
                    <div className="p-6">
                      <StatsGrid />
                    </div>
                  </div>
                  <div className="bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
                    <div className="p-6">
                      <TokenSummary subscription={subscription} balance={balance} isLoading={isLoading} error={error} />
                    </div>
                  </div>
                </div>
                
                {/* Recent Content Sections */}
                <div className="space-y-8">
                  <div className="bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
                    <div className="p-6">
                      <RecentCreations />
                    </div>
                  </div>
                  <div className="bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
                    <div className="p-6">
                      <RecentVideos />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Border gradient effect */}
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
    </div>
  );
} 