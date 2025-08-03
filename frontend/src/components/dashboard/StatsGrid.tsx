'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileImage, Mic, Music, Clapperboard, Video, Bot, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ContentStats } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <Card className="bg-card/50 backdrop-blur-sm border-border/10">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {/* "Change this week" logic can be added later if needed */}
    </CardContent>
  </Card>
);

const StatCardSkeleton = () => (
  <Card className="bg-card/50 backdrop-blur-sm border-border/10">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-4 w-4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-12" />
    </CardContent>
  </Card>
);

export function StatsGrid() {
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
        setStats(null); // Set to null on error to show placeholders or an error message
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getAccessToken, isAuthenticated]);

  const createdContentStats = [
    { title: 'Images', value: stats?.images, icon: FileImage },
    { title: 'Voiceovers', value: stats?.voiceovers, icon: Mic },
    { title: 'Music Tracks', value: stats?.musicTracks, icon: Music },
    { title: 'Animations', value: stats?.animations, icon: Bot },
    { title: 'Videos', value: stats?.videos, icon: Clapperboard },
  ];

  const jobStats = [
      { title: 'Completed Jobs', value: stats?.completedJobs, icon: CheckCircle },
      { title: 'Final Videos', value: stats?.finalVideos, icon: Video },
  ]

  if (loading) {
    return (
        <div>
            <h2 className="text-xl font-semibold tracking-tight mb-4">Content Statistics</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
        </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight mb-4">
        Content Statistics
      </h2>
      
      <div className="space-y-6">
        {/* Content Created Container */}
        <Card className="bg-card/40 backdrop-blur-sm border-border/10">
            <CardHeader>
                <CardTitle>Content Created</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {createdContentStats.map((stat) => (
                    <StatCard key={stat.title} title={stat.title} value={stat.value ?? 0} icon={stat.icon} />
                ))}
            </CardContent>
        </Card>

        {/* Other Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobStats.map((stat) => (
                <StatCard key={stat.title} title={stat.title} value={stat.value ?? 0} icon={stat.icon} />
            ))}
        </div>
      </div>
    </div>
  );
} 