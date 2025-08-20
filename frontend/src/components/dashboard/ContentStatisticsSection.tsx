'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ContentStats } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { ContentBarChart } from './charts/ContentBarChart';
import { JobConversionMetrics } from './charts/JobConversionMetrics';
import { BarChart3 } from 'lucide-react';

export function ContentStatisticsSection() {
  const { getAccessToken, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const token = await getAccessToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/job/stats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data: ContentStats = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getAccessToken, isAuthenticated]);

  if (loading) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl h-full transition-all duration-300 hover:shadow-lg">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Content Statistics</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Created Skeleton */}
            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 h-full transition-all duration-300 hover:shadow-lg hover:bg-card/70">
              <div className="mb-4">
                <Skeleton className="h-5 w-28 mb-2" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
            {/* Job Conversion Skeleton */}
            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 h-full transition-all duration-300 hover:shadow-lg hover:bg-card/70">
              <div className="mb-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="h-64 flex flex-col justify-center space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Skeleton className="h-12 w-12 rounded-xl mr-3" />
                    <div className="text-left">
                      <Skeleton className="h-8 w-16 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Skeleton className="h-12 w-12 rounded-xl mr-3" />
                    <div className="text-left">
                      <Skeleton className="h-8 w-16 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl h-full transition-all duration-300 hover:shadow-lg">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Content Statistics</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content Created Section */}
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 h-full transition-all duration-300 hover:shadow-lg hover:bg-card/70">
            <div className="mb-6">
              <h3 className="text-lg font-bold tracking-tight mb-1">Content Created</h3>
              <p className="text-sm text-muted-foreground">Your creative output across all content types</p>
            </div>
            <ContentBarChart stats={stats} isLoading={loading} />
          </div>

          {/* Job to Video Section */}
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 h-full transition-all duration-300 hover:shadow-lg hover:bg-card/70">
            <div className="mb-6">
              <h3 className="text-lg font-bold tracking-tight mb-1">Job to Video Conversion</h3>
              <p className="text-sm text-muted-foreground">Breakdown of completed work</p>
            </div>
            <JobConversionMetrics stats={stats} isLoading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}