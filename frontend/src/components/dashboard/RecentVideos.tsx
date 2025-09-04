'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowRight, Video } from 'lucide-react';
import { useRecentVideos, AssembledVideo } from '@/lib/hooks/useVideos';
import { RecentVideoCard } from './sections/RecentVideoCard';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentVideos() {
  const { data: videos = [], isLoading: loading, error } = useRecentVideos(3);



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
          <p className="font-semibold">Could not load recent videos</p>
          <p className="text-sm">Please try refreshing the page. If the error persists, please contact support.</p>
        </div>
      );
    }

    if (videos.length === 0) {
      return (
        <Card className="bg-card/50 backdrop-blur-sm border-border/10">
          <CardContent className="p-10 text-center text-muted-foreground">
            <Video className="h-8 w-8 mx-auto mb-2" />
            <p>Your completed videos will appear here.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <RecentVideoCard key={video.assembly_id} video={video} />
        ))}
      </div>
    );
  };

  return (
    <Card className="group relative bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl h-full transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500">
              <Video className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Recent Videos
            </h2>
          </div>
          <Button variant="ghost" size="sm" className="text-accent hover:text-accent hover:bg-accent/10" asChild>
            <Link href="/videos">
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