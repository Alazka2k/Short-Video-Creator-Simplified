'use client';

import { ContentStats } from '@/lib/hooks/useContentStats';
import { CheckCircle, Video, TrendingUp } from 'lucide-react';

interface JobConversionMetricsProps {
  stats: ContentStats | null;
  isLoading: boolean;
}

export function JobConversionMetrics({ stats, isLoading }: JobConversionMetricsProps) {
  if (isLoading || !stats) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-muted-foreground">Loading metrics...</div>
      </div>
    );
  }

  const completedJobs = stats.completedJobs || 0;
  const finalVideos = stats.finalVideos || 0;
  const conversionRate = completedJobs > 0 ? Math.round((finalVideos / completedJobs) * 100) : 0;

  if (completedJobs === 0 && finalVideos === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-sm font-medium mb-1">No completed work yet</p>
          <p className="text-xs">Complete jobs to see conversion metrics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 flex flex-col justify-center space-y-6">
      {/* Completed Jobs Metric */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-500 mr-3">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="text-left">
            <div className="text-3xl font-bold text-foreground">{completedJobs}</div>
            <div className="text-sm text-muted-foreground">Completed Jobs</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Total work finished</p>
      </div>

      {/* Conversion Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex-1 h-px bg-border"></div>
        <div className="px-3">
          <div className="flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-muted-foreground mr-1" />
            <span className="text-xs text-muted-foreground">{conversionRate}% conversion</span>
          </div>
        </div>
        <div className="flex-1 h-px bg-border"></div>
      </div>

      {/* Final Videos Metric */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 mr-3">
            <Video className="h-6 w-6" />
          </div>
          <div className="text-left">
            <div className="text-3xl font-bold text-foreground">{finalVideos}</div>
            <div className="text-sm text-muted-foreground">Final Videos</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Published content</p>
      </div>
    </div>
  );
}