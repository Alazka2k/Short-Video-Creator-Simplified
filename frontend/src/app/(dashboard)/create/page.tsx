'use client'

import { VideoCreationFlow } from '@/components/video-creation/VideoCreationFlow'
import { useSearchParams } from 'next/navigation'

export default function CreatePage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') === 'quick' ? 'quick' : 'normal'

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="main-gradient" />
      <div className="gradient-overlay" />

      <div className="container max-w-7xl mx-auto py-12">
        <div className="relative">
          {/* Main content */}
          <div className="grid gap-8">
            {/* Header section */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold tracking-tight gradient-primary-text">
                Create Your Video
              </h1>
              <p className="text-muted-foreground text-lg">
                {mode === 'quick' ? 
                  'Quickly create a video with AI-powered automation' : 
                  'Create a fully customized video with advanced settings'}
              </p>
            </div>

            {/* Video creation interface */}
            <div className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 rounded-xl border shadow-2xl">
              <div className="p-8">
                <VideoCreationFlow mode={mode} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 