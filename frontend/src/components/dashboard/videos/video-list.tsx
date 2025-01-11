'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MoreVertical, 
  Play, 
  Download, 
  Trash2, 
  Share2,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Dummy data
const dummyVideos = [
  {
    id: '1',
    title: 'How to Make Perfect Coffee',
    status: 'completed',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348',
    createdAt: '2024-01-15T10:00:00Z',
    duration: 180,
    platform: 'youtube',
    stats: {
      views: 1200,
      likes: 156,
      shares: 45,
    },
  },
  {
    id: '2',
    title: 'Quick Workout Routine',
    status: 'processing',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
    createdAt: '2024-01-14T15:30:00Z',
    duration: 240,
    platform: 'tiktok',
  },
  {
    id: '3',
    title: 'Easy Dinner Recipes',
    status: 'failed',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    createdAt: '2024-01-13T20:15:00Z',
    duration: 300,
    platform: 'instagram',
  },
] as const;

const statusConfig = {
  completed: {
    label: 'Completed',
    color: 'bg-green-500/10 text-green-500',
    icon: CheckCircle2,
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-500/10 text-blue-500',
    icon: Clock,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-500/10 text-red-500',
    icon: XCircle,
  },
} as const;

export function VideoList() {
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-6">
                <Skeleton className="h-24 w-40 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dummyVideos.map((video) => {
        const StatusIcon = statusConfig[video.status].icon;
        
        return (
          <Card key={video.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center gap-6 p-6">
                {/* Thumbnail */}
                <div className="relative overflow-hidden rounded-lg w-40 h-24">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="icon" variant="ghost" className="text-white hover:text-white hover:bg-primary/20">
                      <Play className="h-8 w-8" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg truncate">{video.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className={cn("gap-1", statusConfig[video.status].color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[video.status].label}
                        </Badge>
                        <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
                        <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {video.status === 'completed' && (
                        <>
                          <Button size="icon" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {video.status === 'completed' && (
                            <>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="mr-2 h-4 w-4" /> Share
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Stats */}
                  {video.stats && (
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span className="font-medium">{video.stats.views.toLocaleString()}</span> views
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span className="font-medium">{video.stats.likes.toLocaleString()}</span> likes
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span className="font-medium">{video.stats.shares.toLocaleString()}</span> shares
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 