import { Card, CardContent } from '@/components/ui/card';
import { VideoPreview } from '@/components/shared/media/VideoPreview';
import { SocialShareButtons } from '@/components/shared/buttons/SocialShareButtons';
import { DownloadButton } from '@/components/shared/buttons/DownloadButton';
import { formatDistanceToNow } from 'date-fns';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnailUrl: string;
    createdAt: string;
    aspectRatio: string;
  };
  onDownload: () => Promise<void>;
  onShare: (platform: 'youtube' | 'tiktok' | 'instagram') => Promise<void>;
}

export function VideoCard({ video, onDownload, onShare }: VideoCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        <div className="flex items-center gap-6 p-6">
          {/* Video Preview */}
          <div className="relative w-40">
            <VideoPreview
              url={video.thumbnailUrl}
              aspectRatio={video.aspectRatio}
              className="rounded-lg overflow-hidden"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg truncate">{video.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <DownloadButton
                  onDownload={onDownload}
                  variant="ghost"
                  showIcon
                  title=""
                />
                <SocialShareButtons
                  videoUrl={video.thumbnailUrl}
                  title={video.title}
                  onShare={async (platform) => await onShare(platform)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 