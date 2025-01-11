'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MoreVertical,
  Edit,
  Trash2,
  PlayCircle,
  FileEdit,
  Loader2,
  CheckCircle,
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
const dummyProjects = [
  {
    id: '1',
    title: 'Coffee Shop Marketing Campaign',
    status: 'ready_to_generate' as const,
    lastEdited: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-14T15:30:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    settings: {
      targetPlatform: 'youtube' as const,
      style: 'professional',
      duration: 180,
    },
  },
  {
    id: '2',
    title: 'Fitness Challenge Series',
    status: 'in_progress' as const,
    lastEdited: '2024-01-14T09:15:00Z',
    createdAt: '2024-01-13T16:45:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
    settings: {
      targetPlatform: 'tiktok' as const,
      style: 'energetic',
      duration: 60,
    },
  },
  {
    id: '3',
    title: 'Cooking Tutorial Draft',
    status: 'draft' as const,
    lastEdited: '2024-01-13T14:20:00Z',
    createdAt: '2024-01-13T14:20:00Z',
    thumbnail: undefined,
    settings: {
      targetPlatform: 'instagram' as const,
      style: 'casual',
      duration: 120,
    },
  },
] as const;

const statusConfig = {
  draft: {
    label: 'Draft',
    color: 'bg-slate-500/10 text-slate-500',
    icon: FileEdit,
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-500/10 text-blue-500',
    icon: Loader2,
  },
  ready_to_generate: {
    label: 'Ready',
    color: 'bg-green-500/10 text-green-500',
    icon: CheckCircle,
  },
} as const;

const platformIcons = {
  youtube: '🎥',
  tiktok: '📱',
  instagram: '📸',
} as const;

export function ProjectList() {
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
      {dummyProjects.map((project) => {
        const StatusIcon = statusConfig[project.status].icon;
        
        return (
          <Card key={project.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex items-center gap-6 p-6">
                {/* Thumbnail or Placeholder */}
                <div className="relative overflow-hidden rounded-lg w-40 h-24 bg-accent/5">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileEdit className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="icon" variant="ghost" className="text-white hover:text-white hover:bg-primary/20">
                      <Edit className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg truncate flex items-center gap-2">
                        {project.title}
                        <span className="text-base">
                          {platformIcons[project.settings.targetPlatform]}
                        </span>
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className={cn("gap-1", statusConfig[project.status].color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[project.status].label}
                        </Badge>
                        <span>Edited {formatDistanceToNow(new Date(project.lastEdited), { addSuffix: true })}</span>
                        <span>{Math.floor(project.settings.duration / 60)}:{(project.settings.duration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {project.status === 'ready_to_generate' && (
                        <Button size="sm" className="gap-2">
                          <PlayCircle className="h-4 w-4" />
                          Generate
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit Project
                          </DropdownMenuItem>
                          {project.status === 'ready_to_generate' && (
                            <>
                              <DropdownMenuItem>
                                <PlayCircle className="mr-2 h-4 w-4" /> Generate Video
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

                  {/* Additional Info */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span className="font-medium capitalize">{project.settings.style}</span> style
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      For <span className="font-medium capitalize">{project.settings.targetPlatform}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 