import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ProgressiveVideo } from '@/components/ui/progressive-media'

interface VideoPreviewProps {
  url: string
  title?: string
  className?: string
  onError?: (error: Event) => void
  onLoad?: () => void
}

export function VideoPreview({ url, title, className, onError, onLoad }: VideoPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reset state when URL changes
  useEffect(() => {
    setIsLoading(true)
    setError(null)
  }, [url])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    const errorMessage = 'Failed to load video'
    setError(errorMessage)
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
    <ProgressiveVideo
      src={url}
      className={className}
      onMediaLoad={handleLoad}
      onMediaError={handleError}
      shouldPreload
      showControls
    />
  )
} 