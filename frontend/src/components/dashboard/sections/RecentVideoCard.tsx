'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { AssembledVideo } from '@/lib/hooks/useVideos';
import { VideoPreview } from '@/components/shared/media/VideoPreview';
import { DownloadButton } from '@/components/shared/buttons/DownloadButton';
import { useApiClient } from '@/lib/api/apiClient';
import { handleBulkDownload } from '@/lib/utils/download';
import { Clock } from 'lucide-react';

interface RecentVideoCardProps {
  video: AssembledVideo;
}

export function RecentVideoCard({ video }: RecentVideoCardProps) {
  const api = useApiClient();
  const title = video.job.title || `Video`;
  const createdAt = formatDistanceToNow(new Date(video.created_at), { addSuffix: true });
  const duration = video.metadata?.duration || 0;
  const aspectRatio = video.metadata?.templateInfo?.aspectRatio || 'n.a.';

  // Format duration to mm:ss
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    await handleBulkDownload(
      api,
      [{
        video: {
          publicUrl: video.public_url,
          storageKey: video.storage_key
        }
      }],
      video.job_id,
      video.job.title || `video_${video.assembly_id}`
    );
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking the download button
    if ((e.target as Element).closest('button')) {
      e.preventDefault();
    }
  };

  return (
    <Link href="/videos" className="block group" onClick={handleCardClick}>
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
            <div className="mb-3">
              <VideoPreview
                url={video.public_url}
                aspectRatio={aspectRatio}
                className="rounded-lg overflow-hidden"
              />
            </div>
            <h3 className="font-semibold leading-snug tracking-tight line-clamp-2">
              {title}
            </h3>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(duration)}</span>
            </div>
            <Badge variant="secondary">{aspectRatio}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}