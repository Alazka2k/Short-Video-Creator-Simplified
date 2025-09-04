'use client';

import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { QuickActionCards } from '@/components/dashboard/QuickActionCards';
import { ContentStatisticsSection } from '@/components/dashboard/ContentStatisticsSection';
import { RecentCreations } from '@/components/dashboard/RecentCreations';
import { RecentVideos } from '@/components/dashboard/RecentVideos';
import { TokenSummary } from '@/components/dashboard/TokenSummary';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useTokenBalance } from '@/lib/hooks/useTokenBalance';

export default function DashboardPage() {
  // Use hooks for data fetching
  const { data: subscriptionsArray, isLoading: subscriptionLoading, error: subscriptionError } = useSubscription();
  const { data: balance, isLoading: balanceLoading, error: balanceError } = useTokenBalance();

  // Extract first active subscription from array
  const subscription = subscriptionsArray && subscriptionsArray.length > 0 ? subscriptionsArray[0] : null;
  const isLoading = subscriptionLoading || balanceLoading;
  const error = subscriptionError || balanceError;

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
                
                {/* Recent Content - Show Recent Work First */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <RecentCreations />
                  <RecentVideos />
                </div>
                
                {/* Analytics & Plan Grid - 3 Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Content Statistics - spans 2 columns */}
                  <div className="lg:col-span-2">
                    <ContentStatisticsSection />
                  </div>
                  
                  {/* Plan & Usage - spans 1 column */}
                  <div>
                    <TokenSummary subscription={subscription} balance={balance || null} isLoading={isLoading} error={error} />
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