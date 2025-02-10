'use client'

import { use, useState, useEffect } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useJobDetails } from '@/lib/hooks/useJobDetails'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { ScenePreview } from '@/components/preview/ScenePreview'
import { AudioPlayer } from '@/components/preview/AudioPlayer'
import { apiClient } from '@/lib/api/apiClient'
import { AuthLogger } from '@/lib/debug/auth-logger'
import { JobHeader } from '@/components/preview/JobHeader'

interface MediaContent {
  public_url: string
  storage_key: string
  metadata: any
}

interface JobScene {
  sceneId: number
  image?: MediaContent
  video?: MediaContent
  voice?: MediaContent
}

interface JobDetails {
  job_id: string
  user_id: string | null
  created_at: string
  updated_at: string
  status: string
  service_sequence: string[]
  metadata: {
    jobId: string
    music?: MediaContent
    scenes: JobScene[]
    llmResult: {
      title?: string
      description?: string
      hashtags?: string
      scenes?: Array<{
        description?: string
      }>
    }
    parameters: {
      llmGenParams?: {
        image?: {
          aspectRatio?: string
        }
      }
      voiceId?: string
    }
  }
  prompt: string
  error: string | null
}

export default function JobDetailsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { job, loading, error, refreshUrls } = useJobDetails(resolvedParams.jobId)

  // Refresh job data periodically
  useEffect(() => {
    const refreshInterval = setInterval(refreshUrls, 45 * 60 * 1000)
    return () => clearInterval(refreshInterval)
  }, [refreshUrls])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )
    }

    if (error || !job) {
      return (
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/workbench')}
            className="gap-2 border-2 hover:border-primary/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workbench
          </Button>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-center text-muted-foreground">
              {error || 'Job not found'}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/workbench')}
            className="gap-2 border-2 hover:border-primary/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workbench
          </Button>
        </div>

        {/* Job Header */}
        <JobHeader
          title={job.metadata.llmResult?.title || 'Untitled Content'}
          description={job.metadata.llmResult?.description || job.prompt}
          hashtag={job.metadata.llmResult?.hashtags}
          created_at={job.created_at}
          aspectRatio={job.metadata.parameters?.llmGenParams?.image?.aspectRatio}
          service_sequence={job.service_sequence}
          prompt={job.prompt}
          voiceId={job.metadata.parameters?.voiceId}
        />

        {/* Content Preview Section */}
        <div className="grid gap-6">
          {/* Scenes */}
          {job.metadata.scenes.map((scene) => (
            <div 
              key={scene.sceneId}
              className="rounded-lg border bg-card overflow-hidden"
            >
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-medium">Scene {scene.sceneId}</h3>
              </div>
              <div className="p-6">
                <ScenePreview
                  sceneId={scene.sceneId}
                  image={scene.image}
                  video={scene.video}
                  voice={scene.voice}
                  description={job.metadata.llmResult?.scenes?.[scene.sceneId - 1]?.description}
                  aspectRatio={job.metadata.parameters?.llmGenParams?.image?.aspectRatio}
                />
              </div>
            </div>
          ))}

          {/* Music Section (if exists) */}
          {job.metadata.music && (
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-medium">Background Music</h3>
              </div>
              <div className="p-6">
                <AudioPlayer
                  url={job.metadata.music.public_url}
                  title={job.metadata.llmResult?.music?.title || 'Background Music'}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="main-gradient" />
      <div className="gradient-overlay" />

      <div className="container max-w-7xl mx-auto py-12">
        <div className="relative">
          {/* Main content */}
          <div className="relative">
            {/* Main interface */}
            <div className="relative z-10 bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
              <div className="p-8">
                {renderContent()}
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
  )
} 