import { useState, useEffect } from 'react'
import { AudioPlayer } from '@/components/shared/media/AudioPlayer'
import { ImagePreview } from '@/components/shared/media/ImagePreview'
import { VideoPreview } from '@/components/shared/media/VideoPreview'
import { cn } from '@/lib/utils'
import { Logger } from '@/lib/debug/logger'
import { ChevronDown, SquareLibrary, Download, RefreshCw, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Video as VideoIcon, Play as AnimationIcon, Mic as VoiceIcon } from 'lucide-react'
import { useStorageUrls } from '@/lib/hooks/useStorageUrls'
import { Separator } from '@/components/ui/separator'
import { handleMediaDownload } from '@/lib/utils/download'
import { useApiClient } from '@/lib/api/apiClient'

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
  const [isDownloading, setIsDownloading] = useState<{[key: string]: boolean}>({})
  const logger = new Logger('ScenePreview')
  const api = useApiClient();
  
  // Initialize with a function to check sessionStorage first
  const [isExpanded, setIsExpanded] = useState(() => {
    // Check if we have stored expanded scenes
    const expandedScenes = sessionStorage.getItem('expanded-scenes')
    if (expandedScenes) {
      try {
        const expandedScenesArray = JSON.parse(expandedScenes)
        // If we have stored state, use it
        return expandedScenesArray.includes(sceneId)
      } catch (e) {
        console.error('Error parsing expanded scenes from sessionStorage:', e)
      }
    }
    
    // If no stored state or error, default to first scene expanded
    return sceneId === 1
  })

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
      //console.log('ScenePreview: Fresh URLs available, triggering media loading for scene', sceneId, freshUrls)
    }
  }, [freshUrls, sceneId])

  // Effect to save expanded state to sessionStorage
  useEffect(() => {
    const expandedScenes = sessionStorage.getItem('expanded-scenes')
    let expandedScenesArray: number[] = []
    
    if (expandedScenes) {
      try {
        expandedScenesArray = JSON.parse(expandedScenes)
      } catch (e) {
        console.error('Error parsing expanded scenes from sessionStorage:', e)
      }
    }
    
    if (isExpanded && !expandedScenesArray.includes(sceneId)) {
      expandedScenesArray.push(sceneId)
    } else if (!isExpanded && expandedScenesArray.includes(sceneId)) {
      expandedScenesArray = expandedScenesArray.filter(id => id !== sceneId)
    }
    
    sessionStorage.setItem('expanded-scenes', JSON.stringify(expandedScenesArray))
  }, [isExpanded, sceneId])

  const handleMediaError = (type: string) => {
    logger.error(`Error loading ${type} for scene ${sceneId}:`, {
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
      return (
        <div className="w-full h-full">
          <VideoPreview
            url={freshUrls[video.storageKey]}
            aspectRatio={aspectRatio}
            onError={() => handleMediaError('video')}
            onLoad={() => {
              setMediaErrors(prev => {
                const { video, ...rest } = prev
                return rest
              })
            }}
          />
        </div>
      )
    }

    if (animation?.storageKey && freshUrls[animation.storageKey]) {
      return (
        <div className="w-full h-full">
          <VideoPreview
            url={freshUrls[animation.storageKey]}
            aspectRatio={aspectRatio}
            onError={() => handleMediaError('animation')}
            onLoad={() => {
              setMediaErrors(prev => {
                const { animation, ...rest } = prev
                return rest
              })
            }}
          />
        </div>
      )
    }

    if (image?.storageKey && freshUrls[image.storageKey]) {
      return (
        <ImagePreview
          url={freshUrls[image.storageKey]}
          alt={description || image.metadata?.prompt || `Scene ${sceneId} Image`}
          aspectRatio={aspectRatio}
          onError={() => handleMediaError('image')}
          onLoad={() => {
            setMediaErrors(prev => {
              const { image, ...rest } = prev
              return rest
            })
          }}
        />
      )
    }

    return null
  }

  const handleDownload = async (type: 'image' | 'video' | 'voice' | 'animation', content?: MediaContent) => {
    if (!content?.storageKey) return;
    
    const freshUrl = freshUrls[content.storageKey];
    if (!freshUrl) {
      await refreshUrls([content.storageKey]);
      return; // Will trigger a re-render with fresh URL
    }

    setIsDownloading(prev => ({ ...prev, [type]: true }));
    try {
      await handleMediaDownload(api, type, {
        ...content,
        publicUrl: freshUrl // Use the fresh URL instead of the original publicUrl
      });
    } finally {
      setIsDownloading(prev => ({ ...prev, [type]: false }));
    }
  }

  return (
    <div className={cn("rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 p-[1px]", className)}>
      <div className="rounded-xl bg-card">
        {/* Header with expand/collapse control */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Scene {sceneId}</h3>
            {description && (
              <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                {description}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Collapsible content */}
        {isExpanded && (
          <div className={cn("grid gap-6", (image || video || animation) ? "grid-cols-[1.5fr_1fr]" : "grid-cols-1")}>
            {/* Left Side - Media Content Section */}
            {(image || video || animation) && (
            <div className="flex items-center justify-center p-6 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
              {/* Main Media Container */}
              <div className={cn(
                "relative w-full",
                // Add max-width constraints based on aspect ratio
                aspectRatio === "9:16" && "max-w-[300px] mx-auto",
                aspectRatio === "1:1" && "max-w-[400px] mx-auto",
                aspectRatio === "16:9" && "max-w-full"
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
            </div>
            )}

            {/* Right Side - Controls and Info */}
            <div className="space-y-4 p-6">
              {/* Description */}
              {description && (
                <div className="rounded-lg border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-4 transition-all duration-200 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)] hover:border-violet-500/40">
                  <div className="flex items-center gap-2 mb-2">
                    <SquareLibrary className="h-4 w-4 text-violet-500" />
                    <span className="font-medium">Description</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              )}

              {/* Voice Content */}
              {voice?.storageKey && freshUrls[voice.storageKey] && (
                <div className="rounded-lg border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-4 transition-all duration-200 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)] hover:border-violet-500/40">
                  <div className="flex items-center gap-2 mb-2">
                    <VoiceIcon className="h-4 w-4 text-violet-500" />
                    <span className="font-medium">Voice Narration</span>
                  </div>
                  <AudioPlayer
                    url={freshUrls[voice.storageKey]}
                    onError={() => handleMediaError('voice')}
                  />
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload('voice', voice)}
                      disabled={isDownloading['voice']}
                      className="border-violet-500/20 hover:border-violet-500/40"
                    >
                      {isDownloading['voice'] ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="border-violet-500/20 hover:border-violet-500/40"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Recreate
                    </Button>
                  </div>
                </div>
              )}

              {/* Visualization Controls */}
              {(image || video || animation) && (
              <div className="rounded-lg border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-4 transition-all duration-200 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)] hover:border-violet-500/40">
                <div className="flex items-center gap-2 mb-2">
                  {video ? <VideoIcon className="h-4 w-4 text-violet-500" /> : 
                  animation ? <AnimationIcon className="h-4 w-4 text-violet-500" /> : 
                   <ImageIcon className="h-4 w-4 text-violet-500" />}
                  <span className="font-medium">Visualization</span>
                </div>

                <div className={cn("space-y-4", !video && !animation && "space-y-2")}>
                  {/* Image Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ImageIcon className="h-3 w-3" />
                      <span>Image</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload('image', image)}
                        disabled={isDownloading['image']}
                        className="border-violet-500/20 hover:border-violet-500/40"
                      >
                        {isDownloading['image'] ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="border-violet-500/20 hover:border-violet-500/40"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Recreate
                      </Button>
                      {(video || animation) && image && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowOriginalImage(!showOriginalImage)}
                          className="border-violet-500/20 hover:border-violet-500/40"
                        >
                          {showOriginalImage ? 'Hide' : 'Show'} Original
                        </Button>
                      )}
                    </div>
                    
                    {/* Original Image Preview */}
                    {showOriginalImage && image?.storageKey && freshUrls[image.storageKey] && (
                      <div className={cn(
                        "relative overflow-hidden rounded-lg border border-violet-500/20 bg-muted mt-2",
                        getAspectRatioClass(aspectRatio),
                        // Add same max-width constraints for original image
                        aspectRatio === "9:16" && "max-w-[150px] mx-auto",
                        aspectRatio === "1:1" && "max-w-[250px] mx-auto",
                      )}>
                        <ImagePreview
                          url={freshUrls[image.storageKey]}
                          alt={`Scene ${sceneId} Original Image`}
                          className="w-full h-full"
                          onError={() => handleMediaError('original-image')}
                          aspectRatio={aspectRatio}
                        />
                      </div>
                    )}
                  </div>

                  {/* Separator between Image and Video/Animation */}
                  {(video || animation) && (
                    <Separator className="my-2" />
                  )}

                  {/* Video/Animation Section */}
                  {(video || animation) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {video ? (
                          <>
                            <VideoIcon className="h-3 w-3" />
                            <span>Video</span>
                          </>
                        ) : animation ? (
                          <>
                            <VideoIcon className="h-3 w-3" />
                            <span>Animation</span>
                          </>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(video ? 'video' : 'animation', video || animation)}
                          disabled={isDownloading[video ? 'video' : 'animation']}
                          className="border-violet-500/20 hover:border-violet-500/40"
                        >
                          {isDownloading[video ? 'video' : 'animation'] ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-1" />
                          )}
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="border-violet-500/20 hover:border-violet-500/40"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Recreate
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 