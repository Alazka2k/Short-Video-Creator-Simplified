import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/auth/AuthContext'
import { useStorageUrls } from './useStorageUrls'
import { handleBulkDownload } from '@/lib/utils/download'
import { toast } from '@/components/ui/use-toast'
import { useState } from 'react'
import { localStore } from '@/lib/utils/storage-manager'

const VIDEOS_CACHE_KEY = 'completed_videos'

interface CacheData {
  data: VideosResponse
  timestamp: number
}

interface VideoState {
  filters: {
    platform?: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
  pagination: {
    page: number
    limit: number
  }
}

export interface AssembledVideo {
  assembly_id: number
  job_id: string
  user_id: number
  template_id: string
  status: 'completed' | 'processing' | 'failed'
  created_at: string
  updated_at: string
  storage_key: string
  public_url: string
  creatomate_id: string
  metadata: {
    jobData: {
      id: string
      scenes: number
      status: string
    }
    duration: number
    fileSize: number
    frameRate: number
    startTime: string
    resolution: {
      width: number
      height: number
    }
    templateInfo: {
      id: string
      name: string
      aspectRatio: string
      sceneAmount: number
    }
  }
  job: {
    job_id: string
    status: string
    title: string
    description: string
    sceneCount: number
  }
}

interface VideosResponse {
  data: AssembledVideo[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function useVideos() {
  const auth = useAuth()
  if (!auth) throw new Error('useVideos must be used within an AuthProvider')
  const { getM2MToken } = auth

  const [state, setState] = useState<VideoState>({
    filters: {
      sortBy: 'created_at',
      sortOrder: 'desc'
    },
    pagination: {
      page: 1,
      limit: 20
    }
  })

  // Query for assembled videos
  const { 
    data: videosResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['assembled-videos', state],
    queryFn: async () => {
      try {
        const m2mToken = await getM2MToken()
        const userToken = localStorage.getItem("access_token")
        
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${m2mToken}`
        }
        
        if (userToken) {
          headers['x-user-token'] = userToken
        }

        const queryParams = new URLSearchParams({
          page: state.pagination.page.toString(),
          limit: state.pagination.limit.toString(),
          sortBy: state.filters.sortBy,
          sortOrder: state.filters.sortOrder
        })

        if (state.filters.platform) {
          queryParams.append('platform', state.filters.platform)
        }

        // Get fresh data from API
        const response = await apiClient.get<VideosResponse>(
          `/api/assembly/videos?${queryParams.toString()}`,
          { headers }
        )

        // Handle empty response gracefully
        if (!response.data) {
          return {
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 20,
              totalPages: 0
            }
          }
        }

        // Get cached completed videos
        const cachedData = localStore.get<VideosResponse>(VIDEOS_CACHE_KEY)
        
        if (cachedData && response.data.length > 0) {
          // Create a map of existing videos by ID for quick lookup
          const existingVideos = new Map(
            cachedData.data.map(video => [video.assembly_id, video])
          )
          
          // Filter out completed videos that are already cached
          const newCompletedVideos = response.data.filter(video => 
            video.status === 'completed' && !existingVideos.has(video.assembly_id)
          )
          
          // If we found new completed videos, update the cache
          if (newCompletedVideos.length > 0) {
            const updatedCache = {
              ...cachedData,
              data: [...cachedData.data, ...newCompletedVideos]
            }
            localStore.set(VIDEOS_CACHE_KEY, updatedCache)
          }
        } else if (response.data.some(video => video.status === 'completed')) {
          // If no cache exists and we have completed videos, create it
          const completedVideos = {
            ...response,
            data: response.data.filter(video => video.status === 'completed')
          }
          localStore.set(VIDEOS_CACHE_KEY, completedVideos)
        }
        
        return response
      } catch (error) {
        console.error('Error fetching videos:', error)
        // Return empty state instead of throwing
        return {
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0
          }
        }
      }
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: Infinity,  // Never garbage collect the data
    retry: (failureCount, error) => {
      // Don't retry if it's a 404 (no videos) or similar expected errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status
        if (status === 404 || status === 204) {
          return false
        }
      }
      // Only retry up to 2 times for other errors
      return failureCount < 2
    }
  })

  // Extract storage keys from videos
  const storageKeys = videosResponse?.data?.map(video => video.storage_key) || []

  // Use storage URLs hook
  const { urls: freshUrls, isLoading: isRefreshingUrls } = useStorageUrls(storageKeys)

  // Transform videos data with fresh URLs
  const videos = videosResponse?.data?.map(video => ({
    ...video,
    public_url: freshUrls[video.storage_key] || video.public_url
  }))

  const handleDownload = async (video: AssembledVideo) => {
    try {
      if (!video.public_url) {
        throw new Error('No video URL available')
      }

      await handleBulkDownload(
        [{
          video: {
            publicUrl: video.public_url,
            storageKey: video.storage_key
          }
        }],
        video.job_id,
        video.job.title || `video_${video.assembly_id}`
      )
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download video",
        variant: "destructive"
      })
    }
  }

  const handleFilterChange = (filters: Partial<VideoState['filters']>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      pagination: { ...prev.pagination, page: 1 } // Reset to first page on filter change
    }))
  }

  const handlePageChange = (page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page }
    }))
  }

  return {
    videos,
    pagination: videosResponse?.pagination,
    loading: isLoading || isRefreshingUrls,
    error: error ? (error as Error).message : null,
    handleDownload,
    handleFilterChange,
    handlePageChange,
    filters: state.filters,
    refresh: refetch
  }
} 