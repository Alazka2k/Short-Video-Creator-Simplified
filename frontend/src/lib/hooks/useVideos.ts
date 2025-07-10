/**
 * @file useVideos.ts
 * @description A React hook to fetch, filter, and paginate a user's completed videos.
 *
 * This hook manages the state for video filters and pagination, fetches the list of
 * assembled videos from the backend using tanstack-query, and integrates with the
 * `useStorageUrls` hook to ensure video URLs are always fresh.
 */
import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/hooks/useAuth'
import { useStorageUrls } from './useStorageUrls'
import { handleBulkDownload } from '@/lib/utils/download'
import { toast } from '@/components/ui/use-toast'
import { useState } from 'react'

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

/**
 * Custom hook for fetching and managing a user's videos.
 *
 * @returns An object containing the video data, loading states, error states,
 * and functions to handle pagination and filtering.
 */
export function useVideos() {
  const { isAuthenticated } = useAuth()
  const api = useApiClient()

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
      const queryParams = new URLSearchParams({
        page: state.pagination.page.toString(),
        limit: state.pagination.limit.toString(),
        sortBy: state.filters.sortBy,
        sortOrder: state.filters.sortOrder,
      })

      if (state.filters.platform) {
        queryParams.append('platform', state.filters.platform)
      }

      // The API client interceptor automatically adds the auth header.
      const response = await api.get<VideosResponse>(
        `/api/assembly/videos?${queryParams.toString()}`
      )
      
      return response.data
    },
    enabled: isAuthenticated,
    staleTime: 30000, // Consider data stale after 30 seconds
    placeholderData: (previousData) => previousData,
    retry: (failureCount, error: any) => {
      // Don't retry for 404s or other "not found" responses.
      if (error?.response?.status === 404 || error?.response?.status === 204) {
        return false
      }
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
        api,
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