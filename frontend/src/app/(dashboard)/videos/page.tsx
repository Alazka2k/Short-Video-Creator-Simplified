'use client';

import { VideoOverview } from '@/components/videos/VideoOverview';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

export default function VideosPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="main-gradient" />
      <div className="gradient-overlay" />

      <div className="container max-w-7xl mx-auto py-12">
        <div className="relative">
          {/* Header section */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-4xl font-bold tracking-tight gradient-primary-text">
              My Videos
            </h1>
            <p className="text-muted-foreground text-lg">
              Browse and manage your assembled videos
            </p>
          </div>

          {/* Videos interface */}
          <div className="relative">
            <div className="relative z-10 bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
              <div className="p-8">
                <VideoOverview />
              </div>
            </div>
            {/* Border gradient effect */}
            <div className="absolute inset-0 -z-10 rounded-xl">
              <div className="absolute inset-[-3px] rounded-xl">
                <HoverBorderGradient
                  as="div"
                  containerClassName="w-full h-full"
                  className="bg-transparent"
                  duration={3}
                />
              </div>
              <div className="absolute inset-[1px] bg-background rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 