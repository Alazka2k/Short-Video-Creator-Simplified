'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Job } from '@/lib/hooks/useJobs';
import { JobThumbnail } from '@/components/workbench/sections/JobThumbnail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DownloadButton } from '@/components/shared/buttons/DownloadButton';
import { useApiClient } from '@/lib/api/apiClient';
import { handleBulkDownload } from '@/lib/utils/download';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    ImageIcon,
    Music,
    Video,
    Mic,
    Play,
    Bot,
} from 'lucide-react';

// ServiceIcons helper component (adapted from JobCard.tsx for reuse)
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

interface RecentJobCardProps {
  job: Job;
}

export function RecentJobCard({ job }: RecentJobCardProps) {
  const api = useApiClient();
  const title = job.metadata?.llmResult?.title || job.prompt;
  const thumbnailUrl = job.metadata?.scenes?.[0]?.image?.publicUrl;
  const createdAt = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  const handleDownload = async () => {
    try {
      // Fetch complete job data to get all scene content
      const response = await api.get(`/api/job/jobs/${job.job_id}`);
      const fullJobData = response.data;
      
      if (fullJobData?.metadata?.scenes) {
        // Use the existing bulk download logic with complete scene data
        await handleBulkDownload(
          api,
          fullJobData.metadata.scenes,
          job.job_id,
          title
        );
      } else {
        throw new Error('No scene data available for download');
      }
    } catch (error) {
      console.error('Failed to download job content:', error);
      // Error handling is done by handleBulkDownload and DownloadButton
      throw error;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking the download button
    if ((e.target as Element).closest('button')) {
      e.preventDefault();
    }
  };

  return (
    <Link href={`/workbench/${job.job_id}`} className="block group" onClick={handleCardClick}>
      <Card className="h-full flex flex-col transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-border/10">
        <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
                <DownloadButton
                  onDownload={handleDownload}
                  title=""
                  variant="ghost"
                  showIcon={true}
                  iconOnly={true}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                />
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
            <h3 className="font-semibold leading-snug tracking-tight line-clamp-2 mt-2">
              {title}
            </h3>
          </div>
          <div className="mt-4 flex items-center justify-start text-xs text-muted-foreground">
            <ServiceIcons services={job.service_sequence} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}