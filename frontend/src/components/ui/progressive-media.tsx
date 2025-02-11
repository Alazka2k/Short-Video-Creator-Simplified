import { useProgressiveMedia } from '@/lib/hooks/useProgressiveMedia'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import Image, { ImageProps } from 'next/image'
import { HTMLAttributes, VideoHTMLAttributes, AudioHTMLAttributes } from 'react'

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

interface ProgressiveVideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'>, BaseProgressiveProps {}

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
  const { isLoading, error, url, progress } = useProgressiveMedia(src, {
    cacheKey,
    preload: shouldPreload,
    onLoad: onMediaLoad,
    onError: onMediaError
  })

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {url ? (
        <Image
          src={url}
          alt={alt}
          className={cn('transition-opacity duration-300', className)}
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

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {url ? (
        <video
          src={url}
          className={cn('w-full h-full', className)}
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

export function ProgressiveAudio({
  src,
  cacheKey,
  shouldPreload,
  showProgress = true,
  className,
  onMediaLoad,
  onMediaError,
  ...props
}: ProgressiveAudioProps) {
  const { isLoading, error, url, progress } = useProgressiveMedia(src, {
    cacheKey,
    preload: shouldPreload,
    onLoad: onMediaLoad,
    onError: onMediaError
  })

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {url ? (
        <audio
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
} 