import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/auth/AuthContext'
import { useState } from 'react'
import { useStorageUrls } from './useStorageUrls'
import { handleBulkDownload } from '@/lib/utils/download'
import { toast } from '@/components/ui/use-toast'
import { localStore } from '@/lib/utils/storage-manager'

const WORKBENCH_CACHE_KEY = 'workbench_jobs'

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
    error,
    refetch
  } = useQuery({
    queryKey: ['jobs', state.pagination, state.filters],
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

        if (state.filters.status) {
          queryParams.append('status', state.filters.status)
        }

        if (state.filters.services?.length) {
          queryParams.append('services', state.filters.services.join(','))
        }

        // Get fresh data from API
        const response = await apiClient.get<JobsResponse>(
          `/api/job/jobs?${queryParams.toString()}`,
          { headers }
        )

        // Handle empty response gracefully
        if (!response.data) {
          return {
            data: [],
            pagination: {
              total: 0,
              totalPages: 0
            }
          }
        }

        // Get cached jobs
        const cachedData = localStore.get<JobsResponse>(WORKBENCH_CACHE_KEY)
        
        if (cachedData && response.data.length > 0) {
          // Create a map of existing jobs by ID for quick lookup
          const existingJobs = new Map(
            cachedData.data.map(job => [job.job_id, job])
          )
          
          // Filter out jobs that are already cached
          const newJobs = response.data.filter(job => 
            !existingJobs.has(job.job_id)
          )
          
          // If we found new jobs, update the cache
          if (newJobs.length > 0) {
            const updatedCache = {
              ...cachedData,
              data: [...cachedData.data, ...newJobs]
            }
            localStore.set(WORKBENCH_CACHE_KEY, updatedCache)
          }
        } else if (response.data.length > 0) {
          // If no cache exists and we have data, create it
          localStore.set(WORKBENCH_CACHE_KEY, response)
        }
        
        return response
      } catch (error) {
        console.error('Error fetching workbench jobs:', error)
        // Return empty state instead of throwing
        return {
          data: [],
          pagination: {
            total: 0,
            totalPages: 0
          }
        }
      }
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: Infinity,  // Never garbage collect the data
    retry: (failureCount, error) => {
      // Don't retry if it's a 404 (no jobs) or similar expected errors
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

  // Extract preview storage keys from jobs
  const previewStorageKeys = jobsResponse?.data?.flatMap(job => {
    if (!job.metadata?.scenes?.[0]) return []
    
    const scene = job.metadata.scenes[0]
    // Prefer image for preview
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
    
    // Always use image for preview if available
    const previewUrl = scene.image?.storageKey ? 
      previewUrls[scene.image.storageKey] || scene.image.publicUrl :
      undefined

    return {
      ...job,
      aspectRatio,
      gridSpan,
      previewUrl
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