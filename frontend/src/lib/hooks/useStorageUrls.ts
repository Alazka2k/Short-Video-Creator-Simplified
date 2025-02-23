import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/auth/AuthContext'

interface StorageUrlsResponse {
  urls: { [key: string]: string }
}

// Cache for storing URLs from batch requests
const urlCache = new Map<string, { url: string; timestamp: number }>()

export function useStorageUrls(storageKeys: string[] = [], options = {}) {
  const auth = useAuth()
  if (!auth) throw new Error('Auth context not available')
  
  const { getM2MToken } = auth
  const queryClient = useQueryClient()

  // Filter out keys that are already in cache and not expired
  const keysToFetch = storageKeys.filter(key => {
    const cached = urlCache.get(key)
    if (!cached) return true
    // Check if cache is less than 45 minutes old
    return Date.now() - cached.timestamp > 45 * 60 * 1000
  })

  // Query for getting URLs
  const { data, isLoading, error } = useQuery({
    queryKey: ['storage-urls', ...keysToFetch],
    queryFn: async () => {
      if (!keysToFetch.length) {
        // Return cached URLs for all requested keys
        const cachedUrls: { [key: string]: string } = {}
        storageKeys.forEach(key => {
          const cached = urlCache.get(key)
          if (cached) {
            cachedUrls[key] = cached.url
          }
        })
        return { urls: cachedUrls }
      }

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
        { storageKeys: keysToFetch },
        { headers }
      )
      
      // Update cache with new URLs
      Object.entries(response.urls).forEach(([key, url]) => {
        urlCache.set(key, {
          url,
          timestamp: Date.now()
        })
      })

      // Combine new URLs with cached ones
      const allUrls: { [key: string]: string } = {}
      storageKeys.forEach(key => {
        const cached = urlCache.get(key)
        if (cached) {
          allUrls[key] = cached.url
        }
      })

      return { urls: { ...allUrls, ...response.urls } }
    },
    // Only fetch if we have uncached keys
    enabled: keysToFetch.length > 0,
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
      
      // Update cache with refreshed URLs
      Object.entries(response.urls).forEach(([key, url]) => {
        urlCache.set(key, {
          url,
          timestamp: Date.now()
        })
      })

      return response
    },
    onSuccess: (data) => {
      // Update the cache with new URLs
      queryClient.setQueryData(['storage-urls', ...storageKeys], data)
    }
  })

  // Get all URLs (both cached and fresh)
  const allUrls: { [key: string]: string } = {
    ...(data?.urls || {}),
    ...Object.fromEntries(
      storageKeys
        .map(key => {
          const cached = urlCache.get(key)
          return cached ? [key, cached.url] : null
        })
        .filter((entry): entry is [string, string] => entry !== null)
    )
  }

  return {
    urls: allUrls,
    getUrl: (storageKey: string) => allUrls[storageKey],
    refreshUrls,
    isLoading,
    error
  }
} 