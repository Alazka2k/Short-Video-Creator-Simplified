import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/hooks/useAuth'
import { Logger } from '@/lib/debug/logger'
import { useStorageUrls } from './useStorageUrls'

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
    jobId?: string
    music?: MediaContent
    scenes?: JobScene[]
    llmResult?: {
      title?: string
      description?: string
      hashtags?: string
      scenes?: Array<{
        description?: string
      }>
      music?: {
        title?: string
      }
    }
    parameters?: {
      llmGenParams?: {
        image?: {
          aspectRatio?: string
          shotStyle?: string
        }
        script?: {
          scriptTone?: string
          vocabulary?: string
          pacingStructure?: string
          characterPerspective?: string
        }
        general?: {
          generalDescription?: string
        }
      }
      voiceGenParams?: {
        elevenlabsVoiceId?: string
      }
    }
    progress?: Record<string, { progress: number }>
    error?: string | { message?: string; details?: any }
    failedComponents?: string[]
  }
  prompt: string
  error: string | null
}

export function useJobDetails(jobId: string) {
  const { user, isAuthenticated } = useAuth();
  const api = useApiClient();
  const logger = new Logger('useJobDetails');

  // Query for job details
  const { 
    data: job,
    isLoading: isLoadingJob,
    error: jobError,
    refetch: refreshJob
  } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      // The apiClient interceptor will automatically add the auth token.
      const response = await api.get<JobDetails>(`/api/job/jobs/${jobId}`);

      // The backend now enforces that a user can only see their own jobs,
      // so this frontend check is no longer strictly necessary but can be
      // kept as a secondary defense layer if desired. For simplicity in this
      // refactor, we rely on the backend's 403 Forbidden response.
      logger.log('Job details fetched', {
        jobId: response.data.job_id,
        userId: response.data.user_id,
      });

      return response.data;
    },
    enabled: !!jobId && isAuthenticated, // Only run query if we have a job ID and user is authenticated
    // Refetch every 5 seconds if the job is in progress
    refetchInterval: (query) => {
      const data = query.state.data as JobDetails | undefined;
      if (data?.status === 'in_progress' || data?.status === 'queued') {
        return 5000; // 5 seconds
      }
      return false; // Disable polling for completed or failed jobs
    },
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  })

  // Extract storage keys from job data
  const storageKeys = job?.metadata?.scenes?.flatMap(scene => {
    const keys = []
    if (scene.image?.storageKey) keys.push(scene.image.storageKey)
    if (scene.video?.storageKey) keys.push(scene.video.storageKey)
    if (scene.voice?.storageKey) keys.push(scene.voice.storageKey)
    if (scene.animation?.storageKey) keys.push(scene.animation.storageKey)
    return keys
  }) || []

  // Add music storage key if present
  if (job?.metadata?.music?.storageKey) {
    storageKeys.push(job.metadata.music.storageKey)
  }

  // Use storage URLs hook
  const { urls: freshUrls, isLoading: isRefreshingUrls } = useStorageUrls(storageKeys)

  // Transform job data with fresh URLs
  const jobWithFreshUrls = job && !isRefreshingUrls ? {
    ...job,
    metadata: {
      ...job.metadata,
      scenes: (job.metadata.scenes || []).map(scene => ({
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
  } : job

  return {
    job: jobWithFreshUrls,
    loading: isLoadingJob || isRefreshingUrls,
    error: jobError ? (jobError as Error).message : null,
    refreshUrls: refreshJob
  }
} 