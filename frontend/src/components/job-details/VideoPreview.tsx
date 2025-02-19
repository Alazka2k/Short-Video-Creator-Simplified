import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface VideoPreviewProps {
  url: string
  title?: string
  className?: string
  onError?: (error: Event) => void
  onLoad?: () => void
}

export function VideoPreview({ url, title, className, onError, onLoad }: VideoPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasMetadata, setHasMetadata] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when URL changes
  useEffect(() => {
    console.log('VideoPreview: URL changed:', url)
    setIsLoading(true)
    setHasMetadata(false)
    setHasData(false)
    setError(null)
  }, [url])

  const handleLoad = () => {
    console.log('VideoPreview: Video loaded successfully:', {
      url,
      hasMetadata,
      hasData: true,
      isLoading: false
    })
    setHasData(true)
    setIsLoading(false)
    onLoad?.()
  }

  const handleMetadataLoad = () => {
    console.log('VideoPreview: Video metadata loaded:', {
      url,
      hasMetadata: true,
      hasData,
      isLoading
    })
    setHasMetadata(true)
  }

  const handleError = (error: string) => {
    console.error('VideoPreview: Error loading video:', {
      url,
      error,
      hasMetadata,
      hasData
    })
    setError(error)
    setIsLoading(false)
    if (onError) {
      const errorEvent = new Event('error')
      onError(errorEvent)
    }
  }

  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-destructive/10 rounded-lg p-4",
        className
      )}>
        <span className="text-sm text-destructive">{error}</span>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {(isLoading || !hasData) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              {hasMetadata ? 'Loading video data...' : 'Loading video...'}
            </span>
          </div>
        </div>
      )}
      <video
        src={url}
        className={cn(
          "w-full rounded-lg",
          "transition-opacity duration-200",
          (!hasData || isLoading) ? "opacity-0" : "opacity-100",
          className
        )}
        onLoadedMetadata={(e) => {
          console.log('Video: Metadata loaded', {
            duration: e.currentTarget.duration,
            videoWidth: e.currentTarget.videoWidth,
            videoHeight: e.currentTarget.videoHeight,
            readyState: e.currentTarget.readyState,
            networkState: e.currentTarget.networkState
          })
          handleMetadataLoad()
        }}
        onLoadedData={(e) => {
          console.log('Video: Data loaded', {
            readyState: e.currentTarget.readyState,
            networkState: e.currentTarget.networkState
          })
          setHasData(true)
          setIsLoading(false)
          handleLoad()
        }}
        onCanPlay={(e) => {
          console.log('Video: Can play', {
            readyState: e.currentTarget.readyState,
            networkState: e.currentTarget.networkState
          })
        }}
        onError={(e) => {
          const videoElement = e.currentTarget
          console.error('Video: Error loading video:', {
            error: videoElement.error?.message,
            code: videoElement.error?.code,
            networkState: videoElement.networkState,
            readyState: videoElement.readyState
          })
          handleError('Failed to load video')
        }}
        controls
        muted
        autoPlay
        loop
        playsInline
        crossOrigin="anonymous"
      />
    </div>
  )
} 