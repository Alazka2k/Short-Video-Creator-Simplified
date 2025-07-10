'use client';

import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ErrorCard } from '@/components/shared/error/ErrorCard';

interface JobStatusViewProps {
  status: 'in_progress' | 'failed' | 'queued' | string;
  jobId?: string;
  metadata: {
    progress?: Record<string, { progress: number }>;
    error?: string | { message?: string; details?: any };
    failedComponents?: string[];
  };
}

export function JobStatusView({ status, metadata, jobId }: JobStatusViewProps) {
  const { user } = useAuth();

  const getOverallProgress = () => {
    if (status !== 'in_progress' || !metadata?.progress) return 0;
    const progresses = Object.values(metadata.progress);
    if (progresses.length === 0) return 0;
    const total = progresses.reduce((acc, p) => acc + (p.progress || 0), 0);
    return Math.round(total / progresses.length);
  };

  const renderInProgress = () => {
    const progress = getOverallProgress();
    return (
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <h3 className="text-lg font-semibold">Job is In Progress</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Your content is currently being generated. The page will update automatically as progress is made.
        </p>
        <div className="flex items-center gap-4">
          <Progress value={progress} className="h-3" />
          <span className="font-medium text-sm">{progress}%</span>
        </div>
      </div>
    );
  };

  const renderFailed = () => {
    const isAdmin = user?.isAdmin ?? false;
    const errorMessage = typeof metadata.error === 'string'
      ? metadata.error
      : JSON.stringify(metadata.error, null, 2);

    if (isAdmin) {
      // Admin View
      return (
        <ErrorCard
          variant="destructive"
          title="Job Failed (Admin View)"
          details={errorMessage}
          showAdminDetails={true}
        >
          <p>
            The job could not be completed due to a critical error.
            Additional technical details are available below.
          </p>
          {metadata.failedComponents && metadata.failedComponents.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Failed Components:</p>
              <ul className="list-disc list-inside text-sm space-y-1 rounded-md">
                {metadata.failedComponents.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </ErrorCard>
      );
    }

    // Default User-Facing View
    return (
      <ErrorCard variant="warning" title="An Issue Occurred">
        <p>
          We encountered a problem while generating your content. Our team has been notified.
        </p>
        <p className="mt-2 text-xs">
          If you need immediate assistance, please contact support and provide Job ID: <span className="font-mono font-semibold">{jobId}</span>
        </p>
      </ErrorCard>
    );
  };
  
  if (status === 'in_progress' || status === 'queued') {
    return renderInProgress();
  }

  if (status === 'failed') {
    return renderFailed();
  }

  return null;
} 