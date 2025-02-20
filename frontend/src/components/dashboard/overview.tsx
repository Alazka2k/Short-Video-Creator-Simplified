'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, TrendingUpIcon, ClockIcon, VideoIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function DashboardOverview() {
  const auth = useAuth();
  const router = useRouter();

  if (!auth) return null;

  return (
    <div className="space-y-12 animate-in">
      {/* Welcome section with animation */}
      <div className="flex flex-col gap-2 slide-in-from-top">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
          Welcome back, {auth.user?.name}
        </h1>
        <p className="text-lg text-muted-foreground">
          Transform your content into professional videos in minutes.
        </p>
      </div>

      {/* Action button with hover effect */}
      <div>
        <Button 
          className={cn(
            "bg-gradient-to-r from-violet-500 to-purple-500",
            "transition-all duration-200",
            "hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]",
            "hover:scale-[1.02]"
          )}
          onClick={() => router.push('/create')}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Video
        </Button>
      </div>

      {/* Stats grid with card animations */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-card border-violet-500/20">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-lg">
                <VideoIcon className="h-6 w-6 text-violet-500" />
              </div>
              <CardTitle>Total Videos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
          </CardContent>
        </Card>
        
        <Card className="hover-card border-violet-500/20">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <ClockIcon className="h-6 w-6 text-violet-500" />
              </div>
              <CardTitle>Processing Time</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.2m</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity with staggered animation */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Recent Activity</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="hover-card border-violet-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <VideoIcon className="h-5 w-5 text-violet-500" />
                Recent Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add video list here */}
              </div>
            </CardContent>
          </Card>

          <Card className="hover-card border-violet-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="h-5 w-5 text-violet-500" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add projects list here */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 