/**
 * @file useWorkbench.ts
 * @description A React hook for fetching and managing jobs displayed in the user's workbench.
 *
 * This hook handles the state for filters (status, services) and pagination. It fetches
 * the user's jobs from the backend, integrates with `useStorageUrls` to get fresh
 * preview URLs, and provides utility functions for downloading job assets.
 */
import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/hooks/useAuth'
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

/**
 * Custom hook for fetching and managing workbench jobs.
 *
 * @returns An object containing the jobs data, loading and error states,
 * and functions for filtering, pagination, and downloading.
 */
export function useWorkbench() {
  const { isAuthenticated } = useAuth()
  const api = useApiClient()
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

  const { 
    data: jobsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['jobs', state.pagination, state.filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: state.pagination.page.toString(),
        limit: state.pagination.limit.toString(),
        sortBy: state.filters.sortBy,
        sortOrder: state.filters.sortOrder,
      })

      if (state.filters.status) {
        queryParams.append('status', state.filters.status)
      }

      if (state.filters.services?.length) {
        queryParams.append('services', state.filters.services.join(','))
      }

      const response = await api.get<JobsResponse>(
        `/api/job/jobs?${queryParams.toString()}`
      )
      return response.data
    },
    enabled: isAuthenticated,
    staleTime: 5000, // Refresh every 5 seconds for progress updates
    placeholderData: previousData => previousData,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404 || error?.response?.status === 204) {
        return false
      }
      return failureCount < 2
    }
  })

  const previewStorageKeys = jobsResponse?.data?.flatMap(job => {
    if (!job.metadata?.scenes?.[0]) return []
    
    const scene = job.metadata.scenes[0]
    if (scene.image?.storageKey) {
      return [scene.image.storageKey]
    }
    return []
  }) || []

  const { urls: previewUrls } = useStorageUrls(previewStorageKeys)

  const handleFilterChange = (newFilters: Partial<WorkbenchState['filters']>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      pagination: { ...prev.pagination, page: 1 }
    }))
  }

  const handlePageChange = (newPage: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page: newPage }
    }))
  }

  const getAspectRatio = (job: any) => {
    return job.metadata?.parameters?.llmGenParams?.image?.aspectRatio || '1:1'
  }

  const calculateGridSpan = (aspectRatio: string) => {
    switch (aspectRatio) {
      case '16:9':
        return 2
      case '1:1':
        return 1
      case '9:16':
        return 1
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
        api,
        job.metadata.scenes,
        job.job_id,
        job.metadata.llmResult?.title || `content_${job.job_id}`
      )
    } finally {
      setDownloadingJobs(prev => ({ ...prev, [job.job_id]: false }))
    }
  }

  const jobs = jobsResponse?.data?.map(job => {
    if (!job.metadata?.scenes?.[0]) return job
    
    const scene = job.metadata.scenes[0]
    const aspectRatio = getAspectRatio(job)
    const gridSpan = calculateGridSpan(aspectRatio)
    
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
    pagination: jobsResponse?.pagination ? {
      ...jobsResponse.pagination,
      currentPage: state.pagination.page
    } : undefined,
    refetch,
    filters: state.filters,
    handleFilterChange,
    handlePageChange,
    downloadingJobs,
    handleJobDownload,
  }
} 