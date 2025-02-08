'use client'

import { VideoCreationFlow } from '@/components/video-creation/VideoCreationFlow'
import { useSearchParams } from 'next/navigation'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

export default function CreatePage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') === 'quick' ? 'quick' : 'normal'

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="container max-w-7xl mx-auto py-12">
        <div className="relative">
          {/* Main content */}
          <div className="grid gap-8">
            {/* Header section */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-4xl font-bold tracking-tight mb-4">
                Create Your Content
              </h1>
              <p className="text-muted-foreground text-lg">
                {mode === 'quick' ? 
                  'Quickly create a video with AI-powered automation' : 
                  'Create a fully customized video with advanced settings'}
              </p>
            </div>

            {/* Video creation interface */}
            <div className="relative">
              {/* Main interface */}
              <div className="relative z-10 bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
                <div className="p-8">
                  <VideoCreationFlow mode={mode} />
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
                {/* Inner mask to hide gradient from center */}
                <div className="absolute inset-[1px] bg-background rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 