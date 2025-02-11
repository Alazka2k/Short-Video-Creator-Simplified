import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/auth/AuthContext'

interface StorageUrlsResponse {
  urls: { [key: string]: string }
}

export function useStorageUrls(storageKeys: string[] = [], options = {}) {
  const { getM2MToken } = useAuth()
  const queryClient = useQueryClient()

  // Query for getting URLs
  const { data, isLoading, error } = useQuery({
    queryKey: ['storage-urls', ...storageKeys],
    queryFn: async () => {
      if (!storageKeys.length) return { urls: {} }

      const m2mToken = await getM2MToken()
      const userToken = localStorage.getItem("access_token")
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${m2mToken}`
      }
      
      if (userToken) {
        headers['x-user-token'] = userToken
      }

      const response = await apiClient.post<StorageUrlsResponse>(
        '/api/storage/refresh-urls',
        { storageKeys },
        { headers }
      )
      
      return response
    },
    // Only fetch if we have storage keys
    enabled: storageKeys.length > 0,
    // Cache for 45 minutes (slightly less than the URL expiry time)
    gcTime: 45 * 60 * 1000,
    staleTime: 44 * 60 * 1000,
    ...options
  })

  // Mutation for refreshing specific URLs
  const { mutate: refreshUrls } = useMutation({
    mutationFn: async (keysToRefresh: string[]) => {
      const m2mToken = await getM2MToken()
      const userToken = localStorage.getItem("access_token")
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${m2mToken}`
      }
      
      if (userToken) {
        headers['x-user-token'] = userToken
      }

      const response = await apiClient.post<StorageUrlsResponse>(
        '/api/storage/refresh-urls',
        { storageKeys: keysToRefresh },
        { headers }
      )
      
      return response
    },
    onSuccess: (data) => {
      // Update the cache with new URLs
      queryClient.setQueryData(['storage-urls', ...storageKeys], data)
    }
  })

  // Helper function to get a URL for a specific storage key
  const getUrl = (storageKey: string): string | undefined => {
    return data?.urls?.[storageKey]
  }

  return {
    urls: data?.urls || {},
    getUrl,
    refreshUrls,
    isLoading,
    error
  }
} 