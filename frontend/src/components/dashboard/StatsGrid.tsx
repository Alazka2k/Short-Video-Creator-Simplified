'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileImage, Mic, Music, Clapperboard, Video, Bot, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ContentStats } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ title, value, icon: Icon, color }: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  color?: string;
}) => (
  <Card className="bg-card/50 backdrop-blur-sm border-border/10 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:bg-card/70">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-lg ${color || 'bg-primary/10'}`}>
        <Icon className={`h-5 w-5 ${color ? 'text-inherit' : 'text-primary'}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
    </CardContent>
  </Card>
);

const StatCardSkeleton = () => (
  <Card className="bg-card/50 backdrop-blur-sm border-border/10 transition-all duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <Skeleton className="h-5 w-24" />
      <div className="p-2 rounded-lg bg-muted/20">
        <Skeleton className="h-5 w-5" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-9 w-16" />
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
    { title: 'Images', value: stats?.images, icon: FileImage, color: 'bg-emerald-500/10 text-emerald-600' },
    { title: 'Voiceovers', value: stats?.voiceovers, icon: Mic, color: 'bg-purple-500/10 text-purple-600' },
    { title: 'Music Tracks', value: stats?.musicTracks, icon: Music, color: 'bg-pink-500/10 text-pink-600' },
    { title: 'Animations', value: stats?.animations, icon: Bot, color: 'bg-orange-500/10 text-orange-600' },
    { title: 'Videos', value: stats?.videos, icon: Clapperboard, color: 'bg-sky-500/10 text-sky-600' },
  ];

  const jobStats = [
      { title: 'Completed Jobs', value: stats?.completedJobs, icon: CheckCircle, color: 'bg-green-500/10 text-green-600' },
      { title: 'Final Videos', value: stats?.finalVideos, icon: Video, color: 'bg-blue-500/10 text-blue-600' },
  ]

  if (loading) {
    return (
        <div>
            <h2 className="text-xl font-semibold tracking-tight mb-4">Content Statistics</h2>
            <div className="space-y-6">
              {/* Content Created Skeleton */}
              <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 rounded-xl p-6 border border-primary/10">
                <div className="mb-4">
                  <Skeleton className="h-6 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
                </div>
              </div>
              
              {/* Job Performance Skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-5 w-28" />
                <div className="grid gap-4 grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-primary/10 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Skeleton className="h-4 w-24" />
                        <div className="p-2 rounded-lg bg-muted/20">
                          <Skeleton className="h-6 w-6" />
                        </div>
                      </div>
                      <Skeleton className="h-10 w-16" />
                    </div>
                  ))}
                </div>
              </div>
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
        {/* Content Created - Prominent Section */}
        <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 rounded-xl p-6 border border-primary/10">
            <div className="mb-4">
                <h3 className="text-xl font-bold tracking-tight mb-1">Content Created</h3>
                <p className="text-sm text-muted-foreground">Your creative output across all content types</p>
            </div>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                {createdContentStats.map((stat) => (
                    <StatCard key={stat.title} title={stat.title} value={stat.value ?? 0} icon={stat.icon} color={stat.color} />
                ))}
            </div>
        </div>

        {/* Job Performance - Separate Prominent Cards */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight mb-3">Job Performance</h3>
            <div className="grid gap-4 grid-cols-2">
                {jobStats.map((stat) => (
                    <div key={stat.title} className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-primary/10 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-muted-foreground">{stat.title}</h4>
                            <div className={`p-2 rounded-lg ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="text-4xl font-bold tracking-tight">{stat.value ?? 0}</div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
} 