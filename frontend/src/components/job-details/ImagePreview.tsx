import { useState, useEffect } from 'react'
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

interface ImagePreviewProps {
  url: string
  alt?: string
  className?: string
  onError?: (error: React.SyntheticEvent<HTMLImageElement, Event>) => void
  onLoad?: () => void
  aspectRatio?: string
}

export function ImagePreview({ url, alt, className, onError, onLoad, aspectRatio = "16:9" }: ImagePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reset state when URL changes
  useEffect(() => {
    console.log('ImagePreview: URL changed:', url)
    setIsLoading(true)
    setError(null)
    setZoomLevel(1)
  }, [url])

  const handleLoad = () => {
    console.log('ImagePreview: Image loaded successfully:', url)
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('ImagePreview: Error loading image:', {
      url,
      error: e,
      type: e.type,
      target: e.target
    })
    setError('Failed to load image')
    setIsLoading(false)
    onError?.(e)
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    setZoomLevel(1) // Reset zoom when toggling fullscreen
  }

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case "16:9":
        return "aspect-video" // 16/9
      case "1:1":
        return "aspect-square" // 1/1
      case "9:16":
        return "aspect-[9/16]" // 9/16
      default:
        // For custom ratios, calculate the percentage
        const [width, height] = ratio.split(":").map(Number)
        if (width && height) {
          return `aspect-[${width}/${height}]`
        }
        return "aspect-video" // fallback to 16:9
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
    <div className={cn("relative group", className)}>
      <div className={cn(
        "relative overflow-hidden rounded-lg",
        isFullscreen ? "fixed inset-4 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" :
        "bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-500/20"
      )}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        <div className={cn(
          "relative w-full",
          getAspectRatioClass(aspectRatio)
        )}>
          <Image
            src={url}
            alt={alt || "Preview"}
            className={cn(
              "object-contain w-full h-full transition-opacity duration-200",
              isFullscreen ? "max-h-[calc(100vh-2rem)]" : "",
              isLoading && "opacity-0"
            )}
            style={{ transform: `scale(${zoomLevel})` }}
            onLoad={handleLoad}
            onError={handleError}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Controls */}
        <div className={cn(
          "absolute top-2 right-2 flex items-center gap-2 opacity-0 transition-opacity duration-200",
          "group-hover:opacity-100",
          isFullscreen && "opacity-100"
        )}>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
            className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80 border-violet-500/20 hover:border-violet-500/40"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80 border-violet-500/20 hover:border-violet-500/40"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80 border-violet-500/20 hover:border-violet-500/40"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fullscreen overlay close handler */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-40 cursor-pointer"
          onClick={toggleFullscreen}
        />
      )}
    </div>
  )
} 