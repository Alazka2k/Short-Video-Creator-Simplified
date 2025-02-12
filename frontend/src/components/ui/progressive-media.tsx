import { useProgressiveMedia } from '@/lib/hooks/useProgressiveMedia'
import { cn } from '@/lib/utils'
import { Play, Pause, Volume2, VolumeX, Maximize2, Loader2 } from 'lucide-react'
import Image, { ImageProps } from 'next/image'
import { HTMLAttributes, VideoHTMLAttributes, AudioHTMLAttributes, useRef, useState, useEffect } from 'react'
import { Button } from './button'
import { Slider } from './slider'
import React from 'react'

interface BaseProgressiveProps {
  src: string
  cacheKey?: string
  shouldPreload?: boolean
  showProgress?: boolean
  onMediaLoad?: (url: string) => void
  onMediaError?: (error: string) => void
}

interface ProgressiveImageProps extends Omit<ImageProps, 'src' | 'alt'>, BaseProgressiveProps {
  alt?: string
}

interface ProgressiveVideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'>, BaseProgressiveProps {
  showControls?: boolean
}

interface ProgressiveAudioProps extends Omit<AudioHTMLAttributes<HTMLAudioElement>, 'src'>, BaseProgressiveProps {}

export function ProgressiveImage({
  src,
  alt = '',
  cacheKey,
  shouldPreload,
  showProgress = true,
  className,
  onMediaLoad,
  onMediaError,
  ...props
}: ProgressiveImageProps) {
  console.log('ProgressiveImage: Initializing with src:', src)
  
  const {
    url,
    isLoading,
    error,
    progress
  } = useProgressiveMedia(src, {
    cacheKey: cacheKey || `image-${src}`,
    preload: shouldPreload,
    onProgress: (progress) => {
      console.log('ProgressiveImage: Loading progress:', progress)
    },
    onLoad: (url) => {
      console.log('ProgressiveImage: Media loaded:', url)
      onMediaLoad?.(url)
    },
    onError: (error) => {
      console.error('ProgressiveImage: Media error:', error)
      onMediaError?.(error)
    }
  })

  if (error) {
    console.error('ProgressiveImage: Rendering error state:', error)
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {url ? (
        <img
          src={url}
          alt={alt}
          className={cn('w-full h-full object-contain transition-opacity duration-300', 
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          loading={shouldPreload ? "eager" : "lazy"}
          onError={(e) => {
            console.error('ProgressiveImage: Native img error:', e)
            onMediaError?.('Failed to load image')
          }}
          {...props}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          {showProgress && isLoading && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div className="text-xs text-muted-foreground">
                {Math.round(progress)}%
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ProgressiveVideo({
  src,
  cacheKey,
  shouldPreload,
  showProgress = true,
  showControls = true,
  className,
  onMediaLoad,
  onMediaError,
  ...props
}: ProgressiveVideoProps) {
  const { isLoading, error, url, progress } = useProgressiveMedia(src, {
    cacheKey,
    preload: shouldPreload,
    onLoad: onMediaLoad,
    onError: onMediaError
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
      setIsFullscreen(!isFullscreen)
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative group" ref={containerRef}>
      {url ? (
        <>
          <video
            ref={videoRef}
            src={url}
            className={cn('w-full h-full', className)}
            {...props}
          />
          {showControls && (
            <div className={cn(
              "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent",
              "opacity-0 transition-opacity duration-200",
              "group-hover:opacity-100",
              isFullscreen && "opacity-100"
            )}>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                <div className="flex-1">
                  <Slider
                    value={[currentTime]}
                    min={0}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/80 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="w-20"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          {showProgress && isLoading && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div className="text-xs text-muted-foreground">
                {Math.round(progress)}%
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const ProgressiveAudio = React.forwardRef<HTMLAudioElement, ProgressiveAudioProps>(({
  src,
  cacheKey,
  shouldPreload,
  showProgress = true,
  className,
  onMediaLoad,
  onMediaError,
  ...props
}, ref) => {
  const { isLoading, error, url, progress } = useProgressiveMedia(src, {
    cacheKey,
    preload: shouldPreload,
    onLoad: onMediaLoad,
    onError: onMediaError
  })

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {url ? (
        <audio
          ref={ref}
          src={url}
          className={cn('w-full', className)}
          {...props}
        />
      ) : (
        <div className="flex items-center justify-center h-12 bg-muted rounded-lg">
          {showProgress && isLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div className="text-xs text-muted-foreground">
                {Math.round(progress)}%
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
ProgressiveAudio.displayName = 'ProgressiveAudio' 