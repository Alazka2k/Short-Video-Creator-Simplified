import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { AspectRatioContainer } from '@/components/shared/containers/AspectRatioContainer'

interface VideoPreviewProps {
  url: string
  title?: string
  className?: string
  aspectRatio?: string
  onError?: () => void
  onLoad?: () => void
}

export function VideoPreview({ 
  url, 
  title, 
  className = '', 
  aspectRatio = '16:9',
  onError, 
  onLoad 
}: VideoPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasMetadata, setHasMetadata] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoAspectRatio, setVideoAspectRatio] = useState<string | null>(null)

  // Reset state when URL changes
  useEffect(() => {
    setIsLoading(true)
    setHasMetadata(false)
    setHasData(false)
    setError(null)
    setVideoAspectRatio(null)
  }, [url])

  const handleLoad = () => {
    setHasData(true)
    setIsLoading(false)
    onLoad?.()
  }

  const handleMetadataLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement
    const ratio = video.videoWidth / video.videoHeight
    
    // Determine the actual video aspect ratio
    let actualRatio = '16:9'
    if (Math.abs(ratio - 1) < 0.1) {
      actualRatio = '1:1'
    } else if (ratio < 1) {
      actualRatio = '9:16'
    }
    
    setVideoAspectRatio(actualRatio)
    setHasMetadata(true)
  }

  const handleError = () => {
    setError('Failed to load video')
    setIsLoading(false)
    onError?.()
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

  // Determine if we need to adjust the video display based on aspect ratio mismatch
  const shouldLetterbox = videoAspectRatio && videoAspectRatio !== aspectRatio

  return (
    <div className={cn("w-full", className)}>
      <AspectRatioContainer aspectRatio={aspectRatio} className="overflow-hidden rounded-lg border border-violet-500/20">
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
            "absolute inset-0 w-full h-full",
            shouldLetterbox ? "object-contain" : "object-cover",
            "transition-opacity duration-200",
            (!hasData || isLoading) ? "opacity-0" : "opacity-100"
          )}
          onLoadedMetadata={handleMetadataLoad}
          onLoadedData={handleLoad}
          onError={handleError}
          controls
          muted
          autoPlay
          loop
          playsInline
          crossOrigin="anonymous"
        />
      </AspectRatioContainer>

      {title && (
        <div className="text-sm font-medium mt-2">{title}</div>
      )}
    </div>
  )
} 