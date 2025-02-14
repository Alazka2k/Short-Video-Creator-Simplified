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