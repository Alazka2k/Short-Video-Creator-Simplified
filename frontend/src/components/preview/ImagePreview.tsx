import { useState } from 'react'
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImagePreviewProps {
  url: string
  alt?: string
  className?: string
  onError?: (error: Event) => void
}

export function ImagePreview({ url, alt, className }: ImagePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

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

  return (
    <div className={cn("relative group", className)}>
      <div className={cn(
        "relative overflow-hidden rounded-lg border bg-card",
        isFullscreen && "fixed inset-4 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      )}>
        <img
          src={url}
          alt={alt || "Preview"}
          className={cn(
            "w-full h-full object-contain transition-transform duration-200",
            isFullscreen ? "max-h-[calc(100vh-2rem)]" : "max-h-[400px]"
          )}
          style={{ transform: `scale(${zoomLevel})` }}
        />

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
            className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80"
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