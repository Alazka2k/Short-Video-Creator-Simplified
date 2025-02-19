import { useState, useEffect } from 'react'
import { AudioPlayer } from './AudioPlayer'
import { ImagePreview } from './ImagePreview'
import { VideoPreview } from './VideoPreview'
import { cn } from '@/lib/utils'
import { AuthLogger } from '@/lib/debug/auth-logger'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Video as VideoIcon, Play as AnimationIcon, Mic as VoiceIcon } from 'lucide-react'
import { useStorageUrls } from '@/lib/hooks/useStorageUrls'

interface MediaContent {
  publicUrl: string
  storageKey: string
  metadata: {
    text?: string
    prompt?: string
    generatedAt?: string
    [key: string]: any
  }
  fileName?: string
  filePath?: string
}

interface ScenePreviewProps {
  sceneId: number
  image?: MediaContent
  video?: MediaContent
  animation?: MediaContent
  voice?: MediaContent
  description?: string
  className?: string
  aspectRatio?: string
}

export function ScenePreview({
  sceneId,
  image,
  video,
  animation,
  voice,
  description,
  className,
  aspectRatio = "1:1"
}: ScenePreviewProps) {
  const [showOriginalImage, setShowOriginalImage] = useState(false)
  const [mediaErrors, setMediaErrors] = useState<{[key: string]: string}>({})

  // Get storage keys for all media
  const storageKeys = [
    image?.storageKey,
    video?.storageKey,
    animation?.storageKey,
    voice?.storageKey
  ].filter((key): key is string => !!key)

  // Use storage URLs hook to keep URLs fresh
  const { urls: freshUrls, refreshUrls } = useStorageUrls(storageKeys)

  // Effect to trigger media loading for all types when URLs are ready
  useEffect(() => {
    if (Object.keys(freshUrls).length > 0) {
      console.log('ScenePreview: Fresh URLs available, triggering media loading for scene', sceneId, freshUrls)
    }
  }, [freshUrls, sceneId])

  const handleMediaError = (type: string) => {
    AuthLogger.error(`Error loading ${type} for scene ${sceneId}:`, {
      errorType: type,
      originalUrl: type === 'image' ? image?.publicUrl : 
                  type === 'video' ? video?.publicUrl : 
                  type === 'animation' ? animation?.publicUrl :
                  type === 'voice' ? voice?.publicUrl : null,
      freshUrl: type === 'image' ? freshUrls[image?.storageKey || ''] :
                type === 'video' ? freshUrls[video?.storageKey || ''] :
                type === 'animation' ? freshUrls[animation?.storageKey || ''] :
                type === 'voice' ? freshUrls[voice?.storageKey || ''] : null
    })
    setMediaErrors(prev => ({
      ...prev,
      [type]: `Failed to load ${type}`
    }))

    // Try refreshing URLs when we encounter an error
    refreshUrls(storageKeys)
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
        return "aspect-[9/16]" // fallback to vertical video
    }
  }

  const getMediaContent = () => {
    if (video?.storageKey && freshUrls[video.storageKey]) {
      console.log('ScenePreview: Loading video for scene', sceneId, freshUrls[video.storageKey])
      return (
        <VideoPreview
          url={freshUrls[video.storageKey]}
          className="w-full h-full object-contain"
          onError={() => handleMediaError('video')}
          onLoad={() => {
            console.log('ScenePreview: Video loaded for scene', sceneId)
            setMediaErrors(prev => {
              const { video, ...rest } = prev
              return rest
            })
          }}
        />
      )
    }

    if (animation?.storageKey && freshUrls[animation.storageKey]) {
      console.log('ScenePreview: Loading animation for scene', sceneId, freshUrls[animation.storageKey])
      return (
        <VideoPreview
          url={freshUrls[animation.storageKey]}
          className="w-full h-full object-contain"
          onError={() => handleMediaError('animation')}
          onLoad={() => {
            console.log('ScenePreview: Animation loaded for scene', sceneId)
            setMediaErrors(prev => {
              const { animation, ...rest } = prev
              return rest
            })
          }}
        />
      )
    }

    if (image?.storageKey && freshUrls[image.storageKey]) {
      console.log('ScenePreview: Loading image for scene', sceneId, freshUrls[image.storageKey])
      return (
        <ImagePreview
          url={freshUrls[image.storageKey]}
          alt={description || image.metadata?.prompt || `Scene ${sceneId} Image`}
          className="w-full h-full object-contain"
          onError={() => handleMediaError('image')}
          onLoad={() => {
            console.log('ScenePreview: Image loaded for scene', sceneId)
            setMediaErrors(prev => {
              const { image, ...rest } = prev
              return rest
            })
          }}
          aspectRatio={aspectRatio}
        />
      )
    }

    return null
  }

  return (
    <div className={cn("grid grid-cols-[1.5fr_1fr] gap-6", className)}>
      {/* Media Content Section */}
      <div className="space-y-4">
        {/* Main Media Container */}
        <div className={cn(
          "relative w-full overflow-hidden rounded-lg border bg-muted",
          getAspectRatioClass(aspectRatio),
          // Add max-width constraints based on aspect ratio
          aspectRatio === "9:16" && "max-w-[250px] mx-auto", // Half width for vertical videos
          aspectRatio === "1:1" && "max-w-[350px] mx-auto", // 30% smaller for square images
          aspectRatio === "16:9" && "max-w-[450px] mx-auto"
        )}>
          {getMediaContent()}
          {Object.entries(mediaErrors).map(([type, error]) => (
            <div 
              key={`error-${type}`}
              className="absolute inset-0 flex items-center justify-center bg-muted"
            >
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ))}
        </div>

        {/* Original Image Toggle */}
        {(video || animation) && image && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOriginalImage(!showOriginalImage)}
            >
              {showOriginalImage ? 'Hide' : 'Show'} Original Image
            </Button>
            
            <div className={cn(
              "relative overflow-hidden rounded-lg border bg-muted",
              getAspectRatioClass(aspectRatio),
              // Add same max-width constraints for original image
              aspectRatio === "9:16" && "max-w-[300px] mx-auto",
              aspectRatio === "1:1" && "max-w-[400px] mx-auto",
            )}>
              {showOriginalImage && image.storageKey && freshUrls[image.storageKey] && (
                <ImagePreview
                  url={freshUrls[image.storageKey]}
                  alt={`Scene ${sceneId} Original Image`}
                  className="w-full h-full"
                  onError={() => handleMediaError('original-image')}
                  aspectRatio={aspectRatio}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Side Content */}
      <div className="space-y-4">
        {/* Description */}
        {description && (
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-card-foreground">{description}</p>
          </div>
        )}

        {/* Voice Content */}
        {voice?.storageKey && freshUrls[voice.storageKey] && (
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <VoiceIcon className="h-4 w-4" />
              <span className="font-medium">Voice Narration</span>
            </div>
            <AudioPlayer
              url={freshUrls[voice.storageKey]}
              onError={() => handleMediaError('voice')}
            />
            {voice.metadata?.text && (
              <p className="mt-2 text-sm text-muted-foreground">{voice.metadata.text}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 