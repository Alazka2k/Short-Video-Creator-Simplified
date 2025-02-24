import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/auth/AuthContext'
import { useState } from 'react'
import { useStorageUrls } from './useStorageUrls'
import { handleBulkDownload } from '@/lib/utils/download'
import { toast } from '@/components/ui/use-toast'

interface WorkbenchState {
  filters: {
    status?: string
    services?: string[]
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
  pagination: {
    page: number
    limit: number
  }
}

interface JobsResponse {
  data: any[]
  pagination: {
    total: number
    totalPages: number
  }
}

export function useWorkbench() {
  const auth = useAuth()
  if (!auth) throw new Error('useWorkbench must be used within an AuthProvider')
  const { getM2MToken } = auth
  const [state, setState] = useState<WorkbenchState>({
    filters: {
      sortBy: 'created_at',
      sortOrder: 'desc'
    },
    pagination: {
      page: 1,
      limit: 20
    }
  })
  const [downloadingJobs, setDownloadingJobs] = useState<Record<string, boolean>>({})

  // Query for jobs
  const { 
    data: jobsResponse,
    isLoading,
    error
  } = useQuery({
    queryKey: ['jobs', state.pagination, state.filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: state.pagination.page.toString(),
        limit: state.pagination.limit.toString(),
        sortBy: state.filters.sortBy,
        sortOrder: state.filters.sortOrder
      })

      if (state.filters.status) {
        queryParams.append('status', state.filters.status)
      }

      if (state.filters.services?.length) {
        queryParams.append('services', state.filters.services.join(','))
      }

      const m2mToken = await getM2MToken()
      const userToken = localStorage.getItem("access_token")
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${m2mToken}`
      }
      
      if (userToken) {
        headers['x-user-token'] = userToken
      }

      const response = await apiClient.get<JobsResponse>(
        `/api/job/jobs?${queryParams.toString()}`,
        { headers }
      )
      
      return response
    }
  })

  // Extract preview storage keys from jobs
  const previewStorageKeys = jobsResponse?.data?.flatMap(job => {
    if (!job.metadata?.scenes?.[0]) return []
    
    const scene = job.metadata.scenes[0]
    if (scene.video?.storageKey) {
      return [scene.video.storageKey]
    }
    if (scene.animation?.storageKey) {
      return [scene.animation.storageKey]
    }
    if (scene.image?.storageKey) {
      return [scene.image.storageKey]
    }
    return []
  }) || []

  // Use our storage URLs hook
  const { urls: previewUrls } = useStorageUrls(previewStorageKeys)

  const handleFilterChange = (newFilters: Partial<WorkbenchState['filters']>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      pagination: { ...prev.pagination, page: 1 } // Reset to first page on filter change
    }))
  }

  const handlePageChange = (newPage: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page: newPage }
    }))
  }

  // Helper function to get aspect ratio from metadata
  const getAspectRatio = (job: any) => {
    return job.metadata?.parameters?.llmGenParams?.image?.aspectRatio || '1:1'
  }

  // Helper function to calculate grid span based on aspect ratio
  const calculateGridSpan = (aspectRatio: string) => {
    switch (aspectRatio) {
      case '16:9':
        return 2 // Wider images span 2 columns
      case '1:1':
        return 1 // Square images span 1 column
      case '9:16':
        return 1 // Vertical images span 1 column
      default:
        return 1
    }
  }

  const handleJobDownload = async (job: any) => {
    if (!job?.metadata?.scenes) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "No content available to download",
      })
      return
    }

    setDownloadingJobs(prev => ({ ...prev, [job.job_id]: true }))
    try {
      await handleBulkDownload(
        job.metadata.scenes,
        job.job_id,
        job.metadata.llmResult?.title || `content_${job.job_id}`
      )
    } finally {
      setDownloadingJobs(prev => ({ ...prev, [job.job_id]: false }))
    }
  }

  // Transform jobs data to include fresh URLs and aspect ratio information
  const jobs = jobsResponse?.data?.map(job => {
    if (!job.metadata?.scenes?.[0]) return job
    
    const scene = job.metadata.scenes[0]
    const aspectRatio = getAspectRatio(job)
    const gridSpan = calculateGridSpan(aspectRatio)
    
    const updatedScene = {
      ...scene,
      video: scene.video && {
        ...scene.video,
        publicUrl: previewUrls[scene.video.storageKey] || scene.video.publicUrl
      },
      animation: scene.animation && {
        ...scene.animation,
        publicUrl: previewUrls[scene.animation.storageKey] || scene.animation.publicUrl
      },
      image: scene.image && {
        ...scene.image,
        publicUrl: previewUrls[scene.image.storageKey] || scene.image.publicUrl
      }
    }

    return {
      ...job,
      aspectRatio,
      gridSpan,
      metadata: {
        ...job.metadata,
        scenes: [updatedScene, ...job.metadata.scenes.slice(1)]
      }
    }
  }) || []

  return {
    jobs,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    filters: state.filters,
    pagination: {
      ...state.pagination,
      total: jobsResponse?.pagination.total || 0,
      totalPages: jobsResponse?.pagination.totalPages || 0
    },
    handleFilterChange,
    handlePageChange,
    handleJobDownload,
    downloadingJobs
  }
} 