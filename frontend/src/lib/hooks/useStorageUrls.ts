/**
 * @file useStorageUrls.ts
 * @description A React hook for efficiently fetching and caching temporary signed URLs for private assets.
 *
 * This hook is crucial for displaying user-generated content that is stored securely. It accepts an
 * array of storage keys (e.g., S3 object keys), batches requests for them, and leverages both an
 * in-memory cache and tanstack-query's cache to minimize redundant API calls.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApiClient } from '@/lib/api/apiClient'
import { useAuth } from '@/lib/hooks/useAuth'

interface StorageUrlsResponse {
  urls: { [key: string]: string }
}

// Cache for storing URLs from batch requests
const urlCache = new Map<string, { url: string; timestamp: number }>()

/**
 * Custom hook to fetch and manage temporary, signed URLs for a list of storage keys.
 * It uses a multi-layered caching strategy to optimize performance.
 *
 * @param {string[]} [storageKeys=[]] - An array of storage keys for which to fetch URLs.
 * @param {object} [options={}] - Options passed to the underlying `useQuery` hook.
 * @returns {{
 *   urls: { [key: string]: string },
 *   getUrl: (storageKey: string) => string,
 *   refreshUrls: (keysToRefresh: string[]) => void,
 *   isLoading: boolean,
 *   error: any
 * }} An object containing the map of URLs, a function to get a single URL, a function to manually
 *    refresh URLs, and the loading/error state.
 */
export function useStorageUrls(storageKeys: string[] = [], options = {}) {
  const { isAuthenticated } = useAuth()
  const api = useApiClient()
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

      // The API client interceptor automatically adds the auth header.
      const response = await api.post<StorageUrlsResponse>(
        '/api/storage/refresh-urls',
        { storageKeys: keysToFetch }
      )
      
      // Update cache with new URLs
      Object.entries(response.data.urls).forEach(([key, url]) => {
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

      return { urls: { ...allUrls, ...response.data.urls } }
    },
    // Only fetch if we have uncached keys and user is authenticated
    enabled: keysToFetch.length > 0 && isAuthenticated,
    // Cache for 45 minutes (slightly less than the URL expiry time)
    gcTime: 45 * 60 * 1000,
    staleTime: 44 * 60 * 1000,
    ...options
  })

  // Mutation for refreshing specific URLs
  const { mutate: refreshUrls } = useMutation({
    mutationFn: async (keysToRefresh: string[]) => {
      const response = await api.post<StorageUrlsResponse>(
        '/api/storage/refresh-urls',
        { storageKeys: keysToRefresh }
      )
      
      // Update cache with refreshed URLs
      Object.entries(response.data.urls).forEach(([key, url]) => {
        urlCache.set(key, {
          url,
          timestamp: Date.now()
        })
      })

      return response.data
    },
    onSuccess: (data) => {
      // Invalidate and refetch the main query to update all components
      queryClient.invalidateQueries({ queryKey: ['storage-urls'] })
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