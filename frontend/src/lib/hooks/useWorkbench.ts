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
    // Keep data fresh for 1 minute, but poll actively if jobs are running.
    staleTime: 60000, 
    // Poll every 5 seconds, but only if there's an active job in progress.
    refetchInterval: (query) => {
      const data = query.state.data as JobsResponse | undefined;
      const hasActiveJob = data?.data.some(job => job.status === 'in_progress' || job.status === 'queued');
      return hasActiveJob ? 5000 : false;
    },
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
    const aspectRatio = getAspectRatio(job);
    const gridSpan = calculateGridSpan(aspectRatio);
    
    // Default to the dynamic preview URL if it exists
    let previewUrl = job.metadata?.scenes?.[0]?.image?.storageKey ? 
      previewUrls[job.metadata.scenes[0].image.storageKey] || job.metadata.scenes[0].image.publicUrl :
      undefined;

    // --- Logic for Non-Visual Job Thumbnails ---
    const services = new Set(job.service_sequence || []);
    const isVisual = services.has('image') || services.has('video') || services.has('animation');

    if (!isVisual) {
      if (services.has('music')) {
        previewUrl = '/workbench/thumbnails/music_thumbnail.png';
      } else if (services.has('voice')) {
        previewUrl = '/workbench/thumbnails/voice_thumbnail.png';
      } else {
        previewUrl = '/workbench/thumbnails/script_thumbnail.png';
      }
    }
    
    return {
      ...job,
      aspectRatio,
      gridSpan,
      previewUrl // This will be either the dynamic URL or our new static one
    };
  }) || [];

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