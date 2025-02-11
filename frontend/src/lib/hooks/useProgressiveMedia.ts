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

export function useProgressiveMedia(src: string | null, options: UseProgressiveMediaOptions = {}) {
  const [state, setState] = useState<MediaState>({
    isLoading: false,
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
      const cache = JSON.parse(localStorage.getItem(key) || '{}')
      return cache[src || ''] || null
    } catch {
      return null
    }
  }, [src])

  const setCachedUrl = useCallback((key: string, url: string) => {
    try {
      const cache = JSON.parse(localStorage.getItem(key) || '{}')
      cache[src || ''] = url
      localStorage.setItem(key, JSON.stringify(cache))
    } catch (error) {
      console.error('Error caching URL:', error)
    }
  }, [src])

  const loadMedia = useCallback(async () => {
    if (!src) {
      setState(prev => ({ ...prev, isLoading: false }))
      return
    }

    // Check cache first if cacheKey provided
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

    setState(prev => ({ ...prev, isLoading: true, progress: 0 }))

    try {
      // For images
      if (src.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const img = new Image()
        img.onload = () => {
          setState({
            isLoading: false,
            error: null,
            url: src,
            progress: 100
          })
          if (options.cacheKey) {
            setCachedUrl(options.cacheKey, src)
          }
          onLoadRef.current?.(src)
        }
        img.onerror = () => {
          const errorMessage = 'Failed to load image'
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
            progress: 0
          }))
          onErrorRef.current?.(errorMessage)
        }
        img.src = src
        return
      }

      // For videos and audio
      if (src.match(/\.(mp4|webm|mp3|wav)$/i)) {
        const response = await fetch(src)
        const reader = response.body?.getReader()
        const contentLength = +(response.headers.get('Content-Length') || '0')

        if (!reader) {
          throw new Error('Failed to start streaming')
        }

        let receivedLength = 0
        const chunks: Uint8Array[] = []

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          chunks.push(value)
          receivedLength += value.length

          const progress = (receivedLength / contentLength) * 100
          setState(prev => ({ ...prev, progress }))
          onProgressRef.current?.(progress)
        }

        const blob = new Blob(chunks)
        const url = URL.createObjectURL(blob)

        setState({
          isLoading: false,
          error: null,
          url,
          progress: 100
        })

        if (options.cacheKey) {
          setCachedUrl(options.cacheKey, url)
        }
        onLoadRef.current?.(url)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load media'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        progress: 0
      }))
      onErrorRef.current?.(errorMessage)
    }
  }, [src, options.cacheKey, getCachedUrl, setCachedUrl])

  useEffect(() => {
    let mounted = true
    
    if (src && (options.preload || !state.url)) {
      loadMedia()
    }

    return () => {
      mounted = false
      // Cleanup object URLs when component unmounts
      if (state.url?.startsWith('blob:')) {
        URL.revokeObjectURL(state.url)
      }
    }
  }, [src, options.preload, loadMedia])

  return {
    ...state,
    reload: loadMedia
  }
} 