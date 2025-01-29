import { motion } from "framer-motion"
import { ThreeDPhotoCarousel } from "@/components/ui/3d-carousel"
import { useEffect, useState, useMemo, useCallback } from "react"

const IMAGE_CACHE_KEY = 'video_creation_image_cache'

interface VisualStyleCarouselProps {
  previewImages: string[]
}

export function VisualStyleCarousel({ previewImages }: VisualStyleCarouselProps) {
  const [loadedImages, setLoadedImages] = useState<string[]>([])
  const [loadingErrors, setLoadingErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get and set image cache from localStorage
  const getImageCache = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])

  const setImageCache = useCallback((cache: Record<string, string>) => {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache))
  }, [])

  // Memoize the image loading function
  const loadImage = useCallback((src: string) => {
    return new Promise((resolve, reject) => {
      const imageCache = getImageCache()
      
      // If image is already cached, resolve immediately
      if (imageCache[src]) {
        resolve(src)
        return
      }

      const img = new Image()
      img.onload = () => {
        // Update cache with new image
        const updatedCache = { ...imageCache, [src]: src }
        setImageCache(updatedCache)
        resolve(src)
      }
      img.onerror = (error) => {
        console.error("Failed to load:", src, error)
        reject(error)
      }
      img.src = src
    })
  }, [getImageCache, setImageCache])

  // Initialize from cache on mount
  useEffect(() => {
    const imageCache = getImageCache()
    const cachedImages = previewImages.filter(img => imageCache[img])
    if (cachedImages.length > 0) {
      setLoadedImages(cachedImages)
      if (cachedImages.length === previewImages.length) {
        setIsLoading(false)
      }
    }
  }, [previewImages, getImageCache])

  // Load any uncached images
  const loadImages = useCallback(async () => {
    const imageCache = getImageCache()
    const uncachedImages = previewImages.filter(img => !imageCache[img])
    
    if (uncachedImages.length === 0) {
      return
    }

    console.log("Loading uncached images:", uncachedImages)
    setIsLoading(true)

    try {
      const loadedResults = await Promise.all(
        uncachedImages.map(src => 
          loadImage(src)
            .then(result => {
              setLoadedImages(prev => [...prev, src])
              return result
            })
            .catch(error => {
              setLoadingErrors(prev => [...prev, src])
              return error
            })
        )
      )
      console.log("All images processed:", loadedResults)
    } finally {
      setIsLoading(false)
    }
  }, [previewImages, loadImage, getImageCache])

  // Effect to trigger loading of uncached images
  useEffect(() => {
    if (previewImages.length > 0) {
      loadImages()
    }
  }, [previewImages, loadImages])

  const allImagesLoaded = loadedImages.length === previewImages.length

  // Memoize the loaded images array to prevent unnecessary re-renders
  const cachedImages = useMemo(() => loadedImages, [loadedImages])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mt-4 w-full max-w-full overflow-hidden"
    >
      <div className="max-w-[600px] mx-auto">
        {allImagesLoaded ? (
          <div className="h-[250px] relative">
            <ThreeDPhotoCarousel
              images={cachedImages}
              onSelect={() => {}}
            />
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center flex-col gap-4">
            <div className="text-muted-foreground">
              Loading previews... ({loadedImages.length}/{previewImages.length})
            </div>
            {loadingErrors.length > 0 && (
              <div className="text-red-500 text-sm space-y-2">
                <div>Failed to load {loadingErrors.length} images</div>
                <div className="text-xs">
                  First error: {loadingErrors[0]}
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Attempting to load:</div>
              {previewImages.slice(0, 2).map((path, i) => (
                <div key={i} className="font-mono">{path}</div>
              ))}
              {previewImages.length > 2 && (
                <div>...and {previewImages.length - 2} more</div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
} 