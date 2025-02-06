import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/auth/AuthContext'

interface WorkbenchState {
  jobs: any[]
  loading: boolean
  error: string | null
  filters: {
    status?: string
    services?: string[]
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
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
  const { getM2MToken } = useAuth()
  const [state, setState] = useState<WorkbenchState>({
    jobs: [],
    loading: true,
    error: null,
    filters: {
      sortBy: 'created_at',
      sortOrder: 'desc'
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    }
  })

  useEffect(() => {
    loadJobs()
  }, [state.pagination.page, state.filters])

  const loadJobs = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
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

      // Get both tokens
      const userToken = localStorage.getItem("access_token")
      const m2mToken = await getM2MToken()
      
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
      
      setState(prev => ({
        ...prev,
        jobs: response.data,
        loading: false,
        pagination: {
          ...prev.pagination,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        }
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load jobs'
      }))
    }
  }

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

  return {
    ...state,
    handleFilterChange,
    handlePageChange
  }
} 