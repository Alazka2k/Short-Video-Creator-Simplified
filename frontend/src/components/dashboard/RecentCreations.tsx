'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { useRecentJobs } from '@/lib/hooks/useJobs';
import { RecentJobCard } from './sections/RecentJobCard';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentCreations() {
  const { data: jobs = [], isLoading: loading, error } = useRecentJobs(3);



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
        <div className="p-6 text-center text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
          <p className="font-semibold">Could not load recent creations</p>
          <p className="text-sm">Please try refreshing the page. If the error persists, please contact support.</p>
        </div>
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
    <Card className="group relative bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl h-full transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Recent Creations
            </h2>
          </div>
          <Button variant="ghost" size="sm" className="text-accent hover:text-accent hover:bg-accent/10" asChild>
            <Link href="/workbench">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
} 