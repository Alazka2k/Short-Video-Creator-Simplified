import { useState, useEffect, useCallback, useRef } from 'react'

interface MediaState {
  isLoading: boolean
  error: string | null
  url: string | null
  progress: number
}

interface UseProgressiveMediaOptions {
  cacheKey?: string
  preload?: boolean
  onProgress?: (progress: number) => void
  onLoad?: (url: string) => void
  onError?: (error: string) => void
}

// Helper to determine media type from URL
function getMediaType(url: string): 'image' | 'video' | 'audio' | 'unknown' {
  try {
    // Extract storageKey from S3 URL by looking at the path after the domain
    const urlPath = url.split('amazonaws.com/')[1]
    if (urlPath) {
      const storageKey = urlPath.split('?')[0] // Remove query parameters
      console.log('useProgressiveMedia: Extracted storageKey:', storageKey)

      // Determine type based on storageKey pattern
      if (storageKey.startsWith('image/')) {
        console.log('useProgressiveMedia: Detected image type from storage key pattern')
        return 'image'
      }
      if (storageKey.startsWith('video/') || storageKey.startsWith('animation/')) {
        console.log('useProgressiveMedia: Detected video type from storage key pattern')
        return 'video'
      }
      if (storageKey.startsWith('voice/') || storageKey.startsWith('music/')) {
        console.log('useProgressiveMedia: Detected audio type from storage key pattern')
        return 'audio'
      }
    }

    // Fallback to extension check if not an S3 URL
    const extension = url.split('?')[0].split('.').pop()?.toLowerCase() || ''
    console.log('useProgressiveMedia: Checking file extension:', extension)
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      console.log('useProgressiveMedia: Detected image type from extension')
      return 'image'
    }
    if (['mp4', 'webm', 'ogg'].includes(extension)) {
      console.log('useProgressiveMedia: Detected video type from extension')
      return 'video'
    }
    if (['mp3', 'wav', 'aac'].includes(extension)) {
      console.log('useProgressiveMedia: Detected audio type from extension')
      return 'audio'
    }
  } catch (error) {
    console.error('useProgressiveMedia: Error determining media type:', error)
  }
  
  console.log('useProgressiveMedia: Could not determine media type, using unknown')
  return 'unknown'
}

export function useProgressiveMedia(src: string | null, options: UseProgressiveMediaOptions = {}) {
  const [state, setState] = useState<MediaState>({
    isLoading: true,
    error: null,
    url: null,
    progress: 0
  })

  // Use refs for callbacks to prevent unnecessary re-renders
  const onProgressRef = useRef(options.onProgress)
  const onLoadRef = useRef(options.onLoad)
  const onErrorRef = useRef(options.onError)

  // Update refs when callbacks change
  useEffect(() => {
    onProgressRef.current = options.onProgress
    onLoadRef.current = options.onLoad
    onErrorRef.current = options.onError
  }, [options.onProgress, options.onLoad, options.onError])

  const getCachedUrl = useCallback((key: string) => {
    try {
      console.log('useProgressiveMedia: Checking cache for URL:', src)
      const cache = JSON.parse(localStorage.getItem(key) || '{}')
      const cachedData = cache[src || '']
      if (cachedData) {
        const { url, timestamp } = cachedData
        const age = Date.now() - timestamp
        console.log('useProgressiveMedia: Cache entry found:', {
          url,
          age: Math.round(age / 1000 / 60) + ' minutes old'
        })
        // Check if cache is less than 45 minutes old
        if (age < 45 * 60 * 1000) {
          console.log('useProgressiveMedia: Using cached URL:', url)
          return url
        }
        console.log('useProgressiveMedia: Cache expired, will fetch fresh URL')
      } else {
        console.log('useProgressiveMedia: No cache entry found')
      }
      return null
    } catch (error) {
      console.error('useProgressiveMedia: Error reading cache:', error)
      return null
    }
  }, [src])

  const cacheUrl = useCallback((key: string, url: string) => {
    try {
      console.log('useProgressiveMedia: Caching URL:', url)
      const cache = JSON.parse(localStorage.getItem(key) || '{}')
      cache[src || ''] = {
        url,
        timestamp: Date.now()
      }
      localStorage.setItem(key, JSON.stringify(cache))
      console.log('useProgressiveMedia: URL cached successfully')
    } catch (error) {
      console.error('useProgressiveMedia: Error caching URL:', error)
    }
  }, [src])

  useEffect(() => {
    if (!src) {
      console.log('useProgressiveMedia: No source URL provided')
      setState({
        isLoading: false,
        error: 'No source URL provided',
        url: null,
        progress: 0
      })
      return
    }

    console.log('useProgressiveMedia: Starting media load for:', src)
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    // Check cache first if cacheKey is provided
    if (options.cacheKey) {
      const cachedUrl = getCachedUrl(options.cacheKey)
      if (cachedUrl) {
        setState({
          isLoading: false,
          error: null,
          url: cachedUrl,
          progress: 100
        })
        onLoadRef.current?.(cachedUrl)
        return
      }
    }

    const mediaType = getMediaType(src)
    console.log('useProgressiveMedia: Final media type determination:', mediaType)

    // Handle different media types
    if (mediaType === 'image') {
      const img = new Image()
      
      img.onload = () => {
        console.log('useProgressiveMedia: Image loaded successfully:', src)
        setState({
          isLoading: false,
          error: null,
          url: src,
          progress: 100
        })
        if (options.cacheKey) {
          cacheUrl(options.cacheKey, src)
        }
        onLoadRef.current?.(src)
      }

      img.onerror = (error) => {
        console.error('useProgressiveMedia: Image load error:', error)
        setState({
          isLoading: false,
          error: 'Failed to load image',
          url: null,
          progress: 0
        })
        onErrorRef.current?.('Failed to load image')
      }

      img.src = src
      return () => {
        img.onload = null
        img.onerror = null
      }
    } else if (mediaType === 'video') {
      // For video, create a temporary video element to check loading
      const video = document.createElement('video')
      
      video.onloadeddata = () => {
        console.log('useProgressiveMedia: Video loaded successfully:', src)
        setState({
          isLoading: false,
          error: null,
          url: src,
          progress: 100
        })
        if (options.cacheKey) {
          cacheUrl(options.cacheKey, src)
        }
        onLoadRef.current?.(src)
      }

      video.onerror = (error) => {
        console.error('useProgressiveMedia: Video load error:', error)
        setState({
          isLoading: false,
          error: 'Failed to load video',
          url: null,
          progress: 0
        })
        onErrorRef.current?.('Failed to load video')
      }

      video.preload = 'auto'
      video.src = src

      return () => {
        video.onloadeddata = null
        video.onerror = null
        video.src = ''
      }
    } else {
      // For audio and unknown types, directly use the URL
      console.log(`useProgressiveMedia: Using ${mediaType} URL directly:`, src)
      setState({
        isLoading: false,
        error: null,
        url: src,
        progress: 100
      })
      if (options.cacheKey) {
        cacheUrl(options.cacheKey, src)
      }
      onLoadRef.current?.(src)
    }
  }, [src, options.cacheKey, getCachedUrl, cacheUrl])

  return state
} 