'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Job, JobsApiResponse } from '@/types/dashboard';
import { RecentJobCard } from './sections/RecentJobCard';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentCreations() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken, isAuthenticated } = useAuth();

  useEffect(() => {
    async function fetchJobs() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await getAccessToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/job/jobs?status=completed&limit=3&sortOrder=desc`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch recent jobs');
        }

        const data: JobsApiResponse = await response.json();
        setJobs(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [getAccessToken, isAuthenticated]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-6 text-center text-destructive-foreground">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <p>{error}</p>
            </CardContent>
        </Card>
      );
    }

    if (jobs.length === 0) {
      return (
        <Card className="bg-card/50 backdrop-blur-sm border-border/10">
            <CardContent className="p-10 text-center text-muted-foreground">
                <p>You haven't completed any jobs yet.</p>
            </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <RecentJobCard key={job.job_id} job={job} />
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Recent Creations
        </h2>
        <Button variant="ghost" asChild>
          <Link href="/workbench">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      {renderContent()}
    </div>
  );
} 