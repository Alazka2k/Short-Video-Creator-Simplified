import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ImagePreviewProps {
  url: string
  title?: string
  className?: string
  aspectRatio?: string
  alt?: string
  onError?: () => void
  onLoad?: () => void
}

export function ImagePreview({ 
  url, 
  title, 
  className = '', 
  aspectRatio = '16:9',
  alt = 'Preview image',
  onError,
  onLoad
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '16:9':
        return 'aspect-video'
      case '1:1':
        return 'aspect-square'
      case '9:16':
        return 'aspect-[9/16]'
      default:
        return 'aspect-video'
    }
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    setError(null)
    onLoad?.()
  }

  const handleImageError = () => {
    setIsLoading(false)
    setError('Failed to load image')
    onError?.()
  }

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      <div className={`relative ${getAspectRatioClass(aspectRatio)} bg-muted rounded-lg overflow-hidden`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <span className="text-sm">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : (
          <Image
            src={url}
            alt={alt}
            fill
            className="object-contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </div>

      {title && (
        <div className="text-sm font-medium">{title}</div>
      )}
    </div>
  )
} 