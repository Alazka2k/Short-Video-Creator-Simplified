'use client'

import { VideoCreationFlow } from '@/components/video-creation/VideoCreationFlow'
import { useSearchParams } from 'next/navigation'

export default function CreatePage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') === 'quick' ? 'quick' : 'normal'

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="bg-card rounded-xl border p-8">
          <VideoCreationFlow mode={mode} />
        </div>
      </div>
    </div>
  )
} 