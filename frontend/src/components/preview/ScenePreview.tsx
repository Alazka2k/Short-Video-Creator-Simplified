import { useState } from 'react'
import { AudioPlayer } from './AudioPlayer'
import { ImagePreview } from './ImagePreview'
import { cn } from '@/lib/utils'
import { AuthLogger } from '@/lib/debug/auth-logger'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MediaContent {
  public_url: string
  storage_key: string
  metadata: any
}

interface ScenePreviewProps {
  sceneId: number
  image?: MediaContent
  video?: MediaContent
  voice?: MediaContent
  description?: string
  className?: string
  aspectRatio?: string
}

export function ScenePreview({ 
  sceneId, 
  image, 
  video, 
  voice,
  description,
  className,
  aspectRatio = "9:16"
}: ScenePreviewProps) {
  const [mediaErrors, setMediaErrors] = useState<{[key: string]: string}>({})
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleMediaError = (type: string) => {
    AuthLogger.error(`Error loading ${type} for scene ${sceneId}:`, {
      errorType: type,
      originalUrl: type === 'image' ? image?.public_url : 
                  type === 'video' ? video?.public_url : 
                  type === 'voice' ? voice?.public_url : null
    })
    setMediaErrors(prev => ({
      ...prev,
      [type]: `Failed to load ${type}`
    }))
  }

  // Convert aspect ratio (e.g., "16:9") to tailwind class
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
        return "aspect-[9/16]" // fallback to vertical video
    }
  }

  // Determine if we should use side-by-side layout
  const useSideBySide = aspectRatio !== "16:9"

  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden", className)}>
      {/* Scene Header */}
      <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
        <h3 className="font-medium">Scene {sceneId}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isCollapsed && "transform rotate-180"
          )} />
        </Button>
      </div>

      {/* Scene Content */}
      {!isCollapsed && (
        <div className="p-6">
          {/* Media Content */}
          <div className={cn(
            useSideBySide ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"
          )}>
            {/* Left Side - Visual Content */}
            <div>
              {/* Video Preview (prioritized over image) */}
              {video?.public_url ? (
                <div className={cn(
                  "relative overflow-hidden rounded-lg border bg-card",
                  useSideBySide ? "max-w-[240px]" : "max-w-[480px]",
                  "mx-auto"
                )}>
                  <div className={cn(
                    getAspectRatioClass(aspectRatio),
                    !useSideBySide && "max-h-[270px]",
                    useSideBySide && "max-h-[426px]"
                  )}>
                    <video 
                      src={video.public_url}
                      controls
                      className="absolute inset-0 h-full w-full object-contain"
                      poster={image?.public_url}
                      preload="none"
                      onError={() => handleMediaError('video')}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              ) : image?.public_url ? (
                <div className={cn(
                  "relative overflow-hidden rounded-lg border bg-card",
                  useSideBySide ? "max-w-[240px]" : "max-w-[480px]",
                  "mx-auto"
                )}>
                  <div className={cn(
                    getAspectRatioClass(aspectRatio),
                    !useSideBySide && "max-h-[270px]",
                    useSideBySide && "max-h-[426px]"
                  )}>
                    <ImagePreview 
                      url={image.public_url}
                      alt={description || `Scene ${sceneId} Image`}
                      className="absolute inset-0 h-full w-full object-contain"
                      onError={() => handleMediaError('image')}
                    />
                  </div>
                </div>
              ) : null}
              {mediaErrors.video && (
                <p className="text-sm text-red-500 mt-2">{mediaErrors.video}</p>
              )}
              {mediaErrors.image && (
                <p className="text-sm text-red-500 mt-2">{mediaErrors.image}</p>
              )}
            </div>

            {/* Right Side - Scene Details and Audio */}
            <div className="space-y-4">
              {/* Scene Details */}
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-medium">Scene Details</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {description || `Scene ${sceneId}`}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Media Type</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {video ? 'Video' : (image ? 'Image' : 'No visual content')}
                    {voice && ' with voice narration'}
                  </p>
                </div>
              </div>
              
              {/* Voice Preview */}
              {voice?.public_url && (
                <div className="rounded-lg border bg-card p-4">
                  <h4 className="text-sm font-medium mb-3">Voice Narration</h4>
                  <AudioPlayer 
                    url={voice.public_url}
                    title={voice?.metadata?.text || description || `Scene ${sceneId} Voice`}
                    onError={() => handleMediaError('voice')}
                  />
                  {mediaErrors.voice && (
                    <p className="text-sm text-red-500 mt-2">{mediaErrors.voice}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* No Content Message */}
          {!image?.public_url && !video?.public_url && !voice?.public_url && (
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm text-muted-foreground text-center">
                No preview content available for this scene
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 