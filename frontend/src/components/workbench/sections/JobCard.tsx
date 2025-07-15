'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ImageIcon,
  Music,
  Video,
  Mic,
  Play,
  Bot,
} from 'lucide-react';
import { JobThumbnail } from './JobThumbnail';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

// Define the structure for progress updates
interface ProgressInfo {
    status: string;
    sceneId: number;
    progress: number;
    updatedAt: string;
}

// Define the structure of a Job object
interface Job {
  job_id: string;
  created_at: string;
  status: 'completed' | 'in_progress' | 'failed' | 'queued';
  prompt: string;
  service_sequence?: string[];
  previewUrl?: string;
  metadata: {
    progress?: Record<string, ProgressInfo>;
    llmResult?: {
      title?: string;
    };
    scenes?: {
      image?: {
        publicUrl?: string;
      };
    }[];
    error?: string | { message?: string };
  };
}

interface JobCardProps {
  job: Job;
}

const JobStatusBadge = ({ status }: { status: Job['status'] }) => {
  const statusConfig = {
    completed: {
      label: 'Completed',
      icon: <CheckCircle2 className="h-3 w-3" />,
      className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
    },
    in_progress: {
      label: 'In Progress',
      icon: <Loader2 className="h-3 w-3" />, // Spinner removed from here in usage
      className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
    },
    failed: {
      label: 'Failed',
      icon: <AlertTriangle className="h-3 w-3" />,
      className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
    },
    queued: {
        label: 'Queued',
        icon: <Loader2 className="h-3 w-3" />,
        className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700',
    }
  };

  const config = statusConfig[status] || statusConfig.queued;

  return (
    <Badge variant="outline" className={cn('gap-x-1.5 pl-1.5 pr-2.5 py-0.5 text-xs font-medium', config.className)}>
      {status !== 'in_progress' && config.icon}
      {config.label}
    </Badge>
  );
};

const ServiceIcons = ({ services }: { services?: string[] }) => {
    if (!services || services.length === 0) return null;
  
    const getServiceIcon = (service: string) => {
      switch (service.toLowerCase()) {
        case 'llm':
          return { icon: <Bot className="w-4 h-4 text-blue-500" />, name: 'Script' };
        case 'image':
          return { icon: <ImageIcon className="w-4 h-4 text-emerald-500" />, name: 'Image' };
        case 'voice':
          return { icon: <Mic className="w-4 h-4 text-purple-500" />, name: 'Voice' };
        case 'music':
          return { icon: <Music className="w-4 h-4 text-pink-500" />, name: 'Music' };
        case 'video':
          return { icon: <Video className="w-4 h-4 text-sky-500" />, name: 'Video' };
        case 'animation':
          return { icon: <Play className="w-4 h-4 text-orange-500" />, name: 'Animation' };
        default:
          return null;
      }
    };
  
    return (
        <TooltipProvider>
            <div className="flex items-center gap-x-2">
            {services.map((service, index) => {
                const serviceInfo = getServiceIcon(service);
                if (!serviceInfo) return null;
                return (
                    <Tooltip key={index}>
                        <TooltipTrigger asChild>
                            <div className="flex items-center">
                                {serviceInfo.icon}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{serviceInfo.name}</p>
                        </TooltipContent>
                    </Tooltip>
                );
            })}
            </div>
      </TooltipProvider>
    );
};

export function JobCard({ job }: JobCardProps) {
  const title = job.metadata?.llmResult?.title || job.prompt;
  const thumbnailUrl = job.previewUrl || job.metadata?.scenes?.[0]?.image?.publicUrl;
  const createdAt = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  const getOverallProgress = () => {
    if (job.status !== 'in_progress' || !job.metadata?.progress) {
      return 0;
    }
    const progresses = Object.values(job.metadata.progress);
    if (progresses.length === 0) return 0;
    const total = progresses.reduce((acc, p) => acc + (p.progress || 0), 0);
    return total / progresses.length;
  };

  const overallProgress = getOverallProgress();

  return (
    <Link href={`/workbench/${job.job_id}`} className="block group">
      <Card className="h-full flex flex-col transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1">
        <CardHeader className="p-4">
            <div className="flex items-center justify-between">
                <JobStatusBadge status={job.status} />
                <span className="text-xs text-muted-foreground">{createdAt}</span>
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-between">
            <div>
                <JobThumbnail
                    jobId={job.job_id}
                    thumbnailUrl={thumbnailUrl}
                    title={title}
                    status={job.status}
                    serviceSequence={job.service_sequence || []}
                />
                <h3 className="font-semibold leading-snug tracking-tight line-clamp-2">
                    {title}
                </h3>
            </div>
            <div className="mt-4">
                {job.status === 'in_progress' ? (
                    <Progress value={overallProgress} className="h-2" />
                ) : (
                    <ServiceIcons services={job.service_sequence} />
                )}
            </div>
        </CardContent>
      </Card>
    </Link>
  );
} 