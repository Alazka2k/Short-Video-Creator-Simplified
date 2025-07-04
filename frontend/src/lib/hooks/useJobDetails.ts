import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/auth/AuthContext'
import { AuthLogger } from '@/lib/debug/auth-logger'
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
    jobId: string
    music?: MediaContent
    scenes: JobScene[]
    llmResult: any
    parameters: any
  }
  prompt: string
  error: string | null
}

export function useJobDetails(jobId: string) {
  const { getToken, user } = useAuth();

  // Query for job details
  const { 
    data: job,
    isLoading: isLoadingJob,
    error: jobError,
    refetch: refreshJob
  } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const userToken = await getToken()
      
      if (!userToken) {
        throw new Error('No access token available')
      }

      AuthLogger.log('Loading job with user token:', {
        hasUserToken: !!userToken,
        jobId,
        userId: user?.user_id
      })
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${userToken}`
      }

      const response = await apiClient.get<JobDetails>(
        `/api/job/jobs/${jobId}`,
        { headers }
      )

      // Verify user has access to this job
      if (response.user_id && user?.user_id) {
        const jobUserId = response.user_id.toString()
        const currentUserId = user.user_id.toString()
        
        AuthLogger.log('Checking job access:', {
          jobUserId,
          currentUserId,
          responseUserId: response.user_id
        })
        
        if (jobUserId !== currentUserId) {
          throw new Error('You do not have permission to access this job')
        }
      }

      return response
    },
    enabled: !!user,
    staleTime: 45 * 60 * 1000, // Consider data fresh for 45 minutes
    gcTime: 60 * 60 * 1000 // Keep in cache for 1 hour
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
  } : job

  return {
    job: jobWithFreshUrls,
    loading: isLoadingJob || isRefreshingUrls,
    error: jobError ? (jobError as Error).message : null,
    refreshUrls: refreshJob
  }
} 