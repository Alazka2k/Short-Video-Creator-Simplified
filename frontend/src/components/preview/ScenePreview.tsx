import { useState } from 'react'
import { AudioPlayer } from './AudioPlayer'
import { ImagePreview } from './ImagePreview'
import { cn } from '@/lib/utils'
import { AuthLogger } from '@/lib/debug/auth-logger'

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

  // Metadata section component
  const MetadataSection = () => (
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
  )

  return (
    <div className={cn("space-y-4", className)}>
      {/* Scene Description */}
      {description && !useSideBySide && (
        <p className="text-muted-foreground">{description}</p>
      )}

      {/* Additional Metadata - Show at top only for non-side-by-side layout */}
      {!useSideBySide && <MetadataSection />}

      {/* Media Content */}
      <div className={cn(
        useSideBySide ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"
      )}>
        {/* Left Side - Visual Content */}
        <div className="space-y-4">
          {/* Video Preview (prioritized over image) */}
          {video?.public_url && (
            <div>
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
              {mediaErrors.video && (
                <p className="text-sm text-red-500 mt-2">{mediaErrors.video}</p>
              )}
            </div>
          )}

          {/* Image Preview (shown only if no video) */}
          {!video?.public_url && image?.public_url && (
            <div>
              <div className={cn(
                "overflow-hidden",
                useSideBySide ? "max-w-[240px]" : "max-w-[480px]",
                "mx-auto"
              )}>
                <ImagePreview 
                  url={image.public_url}
                  alt={description || `Scene ${sceneId} Image`}
                  onError={() => handleMediaError('image')}
                />
              </div>
              {mediaErrors.image && (
                <p className="text-sm text-red-500 mt-2">{mediaErrors.image}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Audio and Metadata */}
        <div className="space-y-4">
          {/* Metadata - Show on right side for side-by-side layout */}
          {useSideBySide && <MetadataSection />}
          
          {/* Voice Preview */}
          {voice?.public_url && (
            <div>
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

        {/* No Content Message */}
        {!image?.public_url && !video?.public_url && !voice?.public_url && (
          <div className="p-4 rounded-lg border bg-card col-span-full">
            <p className="text-sm text-muted-foreground text-center">
              No preview content available for this scene
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 