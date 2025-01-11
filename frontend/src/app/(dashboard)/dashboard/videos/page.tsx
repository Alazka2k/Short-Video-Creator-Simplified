import { Metadata } from 'next';
import { VideoList } from '@/components/dashboard/videos/video-list';

export const metadata: Metadata = {
  title: 'My Videos - Video Creator',
  description: 'Browse and manage your created videos',
};

export default function VideosPage() {
  return (
    <div className="relative flex-1 space-y-8 p-8 pt-6">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
      </div>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          My Videos
        </h2>
        <p className="text-muted-foreground mt-2">
          Browse and manage your created videos
        </p>
      </div>

      {/* Content */}
      <div className="relative">
        <VideoList />
      </div>
    </div>
  );
} 