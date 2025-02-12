import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ProgressiveVideo } from '@/components/ui/progressive-media'
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
  const [error, setError] = useState<string | null>(null)

  // Reset state when URL changes
  useEffect(() => {
    console.log('VideoPreview: URL changed:', url)
    setIsLoading(true)
    setError(null)
  }, [url])

  const handleLoad = () => {
    console.log('VideoPreview: Video loaded successfully:', url)
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = (error: string) => {
    console.error('VideoPreview: Error loading video:', {
      url,
      error
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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading video...</span>
          </div>
        </div>
      )}
      <ProgressiveVideo
        src={url}
        className={cn(className, isLoading && "opacity-0")}
        onMediaLoad={handleLoad}
        onMediaError={handleError}
        shouldPreload
        showControls
      />
    </div>
  )
} 