import { VideoCard } from './sections/VideoCard';
import { VideoListEmpty } from './sections/VideoListEmpty';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoListHeader } from './sections/VideoListHeader';
import { useVideos } from '@/lib/hooks/useVideos';
import { Pagination } from '@/components/shared/pagination/Pagination';

interface VideoOverviewProps {
  className?: string;
}

export function VideoOverview({ className = '' }: VideoOverviewProps) {
  const { 
    videos, 
    loading, 
    handleDownload,
    pagination,
    filters,
    handleFilterChange,
    handlePageChange
  } = useVideos();

  const handleSortChange = (value: 'newest' | 'oldest') => {
    handleFilterChange({
      sortOrder: value === 'newest' ? 'desc' : 'asc'
    });
  };

  const handleShare = async (videoId: string, platform: string) => {
    try {
      // TODO: Will be implemented with proper sharing functionality
      console.log('Sharing video:', videoId, 'to', platform);
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full h-32 rounded-lg bg-card border">
            <div className="flex items-center gap-4 p-6">
              <Skeleton className="h-24 w-40 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Filter completed videos
  const completedVideos = videos?.filter(video => video.status === 'completed') || [];

  if (!completedVideos.length) {
    return <VideoListEmpty className={className} />;
  }

  // Transform AssembledVideo to Video format for VideoCard
  const transformedVideos = completedVideos.map(video => ({
    id: video.assembly_id.toString(),
    title: video.job.title || `Video ${video.assembly_id}`,
    status: video.status,
    thumbnailUrl: video.public_url,
    createdAt: video.created_at,
    duration: video.metadata?.duration || 0,
    aspectRatio: video.metadata?.templateInfo?.aspectRatio || '16:9',
    platform: 'youtube', // TODO: Get from metadata when available
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      <VideoListHeader 
        sortBy={filters.sortOrder === 'desc' ? 'newest' : 'oldest'}
        onSortChange={handleSortChange}
      />
      
      <div className="space-y-4">
        {transformedVideos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onDownload={async () => {
              const originalVideo = completedVideos.find(v => v.assembly_id.toString() === video.id);
              if (originalVideo) {
                await handleDownload(originalVideo);
              }
            }}
            onShare={async (platform) => await handleShare(video.id, platform)}
          />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
} 