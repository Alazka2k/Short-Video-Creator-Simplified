import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/auth/AuthContext'
import { useState } from 'react'
import { useStorageUrls } from './useStorageUrls'

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
        state.filters.services.forEach(service => 
          queryParams.append('services[]', service)
        )
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

  // Transform jobs data to include fresh URLs
  const jobs = jobsResponse?.data?.map(job => {
    if (!job.metadata?.scenes?.[0]) return job
    
    const scene = job.metadata.scenes[0]
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
    handlePageChange
  }
} 