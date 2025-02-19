'use client'

import { use, useState, useEffect } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useJobDetails } from '@/lib/hooks/useJobDetails'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { ScenePreview } from '@/components/job-details/ScenePreview'
import { AudioPlayer } from '@/components/job-details/AudioPlayer'
import { apiClient } from '@/lib/api/apiClient'
import { AuthLogger } from '@/lib/debug/auth-logger'
import { JobHeader } from '@/components/job-details/JobHeader'
import shotStyleData from '@/data/video-creation/image/shot-style_select-option.json'
import scriptToneData from '@/data/video-creation/script/script-tone_select-option.json'
import vocabularyData from '@/data/video-creation/script/vocabulary_select-option.json'
import pacingData from '@/data/video-creation/script/pacing-structure_select-option.json'
import perspectiveData from '@/data/video-creation/script/character-perspective_select-option.json'
import { useStorageUrls } from '@/lib/hooks/useStorageUrls'

interface MediaContent {
  publicUrl: string
  storageKey: string
  metadata: any
}

interface JobScene {
  sceneId: number
  image?: MediaContent
  video?: MediaContent
  voice?: MediaContent
  animation?: MediaContent
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
        script?: {
          scriptTone?: string
          vocabulary?: string
          pacingStructure?: string
          characterPerspective?: string
        }
      }
      voiceGenParams?: {
        elevenlabsVoiceId?: string
      }
    }
  }
  prompt: string
  error: string | null
}

// Helper function to find option name by prompt
const findOptionNameByPrompt = (data: any, prompt: string): string | undefined => {
  if (!prompt) return undefined
  
  for (const category of data.categories) {
    for (const option of category.options) {
      if (option.prompt === prompt) {
        return option.name
      }
    }
  }
  return undefined
}

// Helper function to find shot style name by promptDefinition
const findShotStyleName = (promptDefinition: string): string | undefined => {
  if (!promptDefinition) return undefined
  
  for (const category of shotStyleData.categories) {
    for (const option of category.options) {
      if (option.promptDefinition === promptDefinition) {
        return option.name
      }
    }
  }
  return undefined
}

export default function JobDetailsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { job, loading, error, refreshUrls } = useJobDetails(resolvedParams.jobId)

  // Extract all storage keys
  const storageKeys = job?.metadata?.scenes?.flatMap(scene => {
    const keys = []
    if (scene.image?.storageKey) keys.push(scene.image.storageKey)
    if (scene.video?.storageKey) keys.push(scene.video.storageKey)
    if (scene.animation?.storageKey) keys.push(scene.animation.storageKey)
    if (scene.voice?.storageKey) keys.push(scene.voice.storageKey)
    return keys
  }) || []

  // Add music storage key if present
  if (job?.metadata?.music?.storageKey) {
    storageKeys.push(job.metadata.music.storageKey)
  }

  // Get fresh URLs for all media content
  const { urls: freshUrls } = useStorageUrls(storageKeys)

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

    // Extract script information
    const scriptParams = job.metadata.parameters?.llmGenParams?.script || {}
    const scriptInfo = {
      tone: findOptionNameByPrompt(scriptToneData, scriptParams.scriptTone),
      vocabulary: findOptionNameByPrompt(vocabularyData, scriptParams.vocabulary),
      pacing: findOptionNameByPrompt(pacingData, scriptParams.pacingStructure),
      perspective: findOptionNameByPrompt(perspectiveData, scriptParams.characterPerspective)
    }

    // Extract shot style
    const shotStyle = findShotStyleName(job.metadata.parameters?.llmGenParams?.image?.shotStyle)

    // Extract focus/theme
    const focus = job.metadata.parameters?.llmGenParams?.general?.generalDescription

    // Transform job data with fresh URLs
    const jobWithFreshUrls = {
      ...job,
      metadata: {
        ...job.metadata,
        scenes: job.metadata.scenes.map(scene => ({
          ...scene,
          image: scene.image?.storageKey ? {
            ...scene.image,
            publicUrl: freshUrls[scene.image.storageKey] || scene.image.publicUrl
          } : scene.image,
          video: scene.video?.storageKey ? {
            ...scene.video,
            publicUrl: freshUrls[scene.video.storageKey] || scene.video.publicUrl
          } : scene.video,
          animation: scene.animation?.storageKey ? {
            ...scene.animation,
            publicUrl: freshUrls[scene.animation.storageKey] || scene.animation.publicUrl
          } : scene.animation,
          voice: scene.voice?.storageKey ? {
            ...scene.voice,
            publicUrl: freshUrls[scene.voice.storageKey] || scene.voice.publicUrl
          } : scene.voice
        })),
        music: job.metadata.music?.storageKey ? {
          ...job.metadata.music,
          publicUrl: freshUrls[job.metadata.music.storageKey] || job.metadata.music.publicUrl
        } : job.metadata.music
      }
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
          title={jobWithFreshUrls.metadata.llmResult?.title || 'Untitled Content'}
          description={jobWithFreshUrls.metadata.llmResult?.description || jobWithFreshUrls.prompt}
          hashtag={jobWithFreshUrls.metadata.llmResult?.hashtags}
          created_at={jobWithFreshUrls.created_at}
          aspectRatio={jobWithFreshUrls.metadata.parameters?.llmGenParams?.image?.aspectRatio}
          shotStyle={shotStyle}
          service_sequence={jobWithFreshUrls.service_sequence}
          prompt={jobWithFreshUrls.prompt}
          metadata={{
            parameters: {
              voiceGenParams: {
                elevenlabsVoiceId: jobWithFreshUrls.metadata.parameters?.voiceGenParams?.elevenlabsVoiceId
              },
              llmGenParams: {
                script: scriptInfo
              }
            },
            scenes: jobWithFreshUrls.metadata.scenes.map(scene => ({
              voice: scene.voice ? {
                elevenlabsVoiceId: scene.voice.metadata?.elevenlabsVoiceId
              } : undefined
            }))
          }}
          focus={focus}
        />

        {/* Content Preview Section */}
        <div className="grid gap-6">
          {/* Scenes */}
          {jobWithFreshUrls.metadata.scenes.map((scene) => (
            <ScenePreview
              key={scene.sceneId}
              sceneId={scene.sceneId}
              image={scene.image}
              video={scene.video}
              animation={scene.animation}
              voice={scene.voice}
              description={jobWithFreshUrls.metadata.llmResult?.scenes?.[scene.sceneId - 1]?.description}
              aspectRatio={jobWithFreshUrls.metadata.parameters?.llmGenParams?.image?.aspectRatio}
            />
          ))}

          {/* Music Section (if exists) */}
          {jobWithFreshUrls.metadata.music && (
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-medium">Background Music</h3>
              </div>
              <div className="p-6">
                <AudioPlayer
                  url={jobWithFreshUrls.metadata.music.publicUrl}
                  title={jobWithFreshUrls.metadata.llmResult?.music?.title || 'Background Music'}
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