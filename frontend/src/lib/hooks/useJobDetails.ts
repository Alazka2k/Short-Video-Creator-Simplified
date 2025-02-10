import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/auth/AuthContext'
import { AuthLogger } from '@/lib/debug/auth-logger'

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
    llmResult: any
    parameters: any
  }
  prompt: string
  error: string | null
}

interface UseJobDetailsState {
  job: JobDetails | null
  loading: boolean
  error: string | null
}

export function useJobDetails(jobId: string) {
  const { getM2MToken, user } = useAuth()
  const [state, setState] = useState<UseJobDetailsState>({
    job: null,
    loading: true,
    error: null
  })

  const loadJob = async () => {
    try {
      const m2mToken = await getM2MToken()
      const userToken = localStorage.getItem("access_token")

      AuthLogger.log('Loading job with tokens:', {
        hasM2MToken: !!m2mToken,
        hasUserToken: !!userToken,
        jobId,
        userId: user?.user_id
      })
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${m2mToken}`
      }

      // Only add user token if it exists
      if (userToken) {
        headers['x-user-token'] = userToken
      }

      const response = await apiClient.get<JobDetails>(
        `/api/job/jobs/${jobId}`,
        { headers }
      )

      // Log media URLs for debugging
      AuthLogger.log('Media URLs:', {
        jobId,
        scenes: response.metadata.scenes.map(scene => ({
          sceneId: scene.sceneId,
          imageUrl: scene.image?.public_url,
          videoUrl: scene.video?.public_url,
          voiceUrl: scene.voice?.public_url
        })),
        musicUrl: response.metadata.music?.public_url
      })

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

      setState(prev => ({
        ...prev,
        job: response,
        loading: false
      }))
    } catch (error) {
      AuthLogger.error('Error loading job:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load job details'
      }))
    }
  }

  // Load initial job data
  useEffect(() => {
    if (user) {
      loadJob()
    }
  }, [jobId, user])

  // Refresh job data periodically (every 45 minutes)
  useEffect(() => {
    if (!user) return

    const refreshInterval = setInterval(loadJob, 45 * 60 * 1000)
    return () => clearInterval(refreshInterval)
  }, [jobId, user])

  return {
    ...state,
    refreshUrls: loadJob // Expose refresh function for manual refresh if needed
  }
} 