import { motion } from "framer-motion"
import { ThreeDPhotoCarousel } from "@/components/ui/3d-carousel"
import { useEffect, useState, useMemo, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"


interface VisualStyleCarouselProps {
  previewImages: string[]
  selectedStyle?: string
}

export function VisualStyleCarousel({ 
  previewImages,
  selectedStyle 
}: VisualStyleCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [loadingErrors, setLoadingErrors] = useState<string[]>([])

  // Reset states when style changes
  useEffect(() => {
    setLoadedImages(new Set())
    setLoadingStates({})
    setIsInitialLoad(true)
    setLoadingErrors([])
    setCurrentIndex(0)
  }, [selectedStyle])

  // Load all images for the current style
  const loadImage = useCallback((src: string) => {
    return new Promise<void>((resolve, reject) => {
      const imgElement = document.createElement('img')
      
      imgElement.onload = () => {
        setLoadedImages(prev => new Set([...prev, src]))
        setLoadingStates(prev => ({ ...prev, [src]: false }))
        resolve()
      }

      imgElement.onerror = () => {
        setLoadingErrors(prev => [...prev, src])
        setLoadingStates(prev => ({ ...prev, [src]: false }))
        reject(new Error(`Failed to load image: ${src}`))
      }

      setLoadingStates(prev => ({ ...prev, [src]: true }))
      // Ensure the path is relative to the public directory
      const imagePath = src.startsWith('/') ? src : `/${src}`
      imgElement.src = imagePath
    })
  }, [])

  // Load all images for the current style
  useEffect(() => {
    if (!selectedStyle || previewImages.length === 0) return

    const loadAllImages = async () => {
      try {
        // Load first image immediately, then load the rest in parallel
        if (previewImages.length > 0) {
          await loadImage(previewImages[0])
          
          // Load remaining images in parallel
          await Promise.all(
            previewImages.slice(1).map(src => loadImage(src))
          )
        }
        setIsInitialLoad(false)
      } catch (error) {
        console.error('Error loading images:', error)
      }
    }

    loadAllImages()
  }, [selectedStyle, previewImages, loadImage])

  // Calculate loading progress
  const loadingProgress = useMemo(() => {
    if (previewImages.length === 0) return 0
    const loadedCount = loadedImages.size
    return Math.round((loadedCount / previewImages.length) * 100)
  }, [previewImages.length, loadedImages.size])

  // Show loading state during initial load
  if (isInitialLoad && loadingProgress < 100) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mt-4 w-full max-w-full overflow-hidden"
      >
        <div className="max-w-[600px] mx-auto">
          <div className="h-[250px] flex items-center justify-center flex-col gap-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <div className="text-sm text-muted-foreground space-y-2">
              <div>Loading style previews... {loadingProgress}%</div>
              {loadingErrors.length > 0 && (
                <div className="text-destructive text-xs">
                  Failed to load {loadingErrors.length} images
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Show carousel once images are loaded
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mt-4 w-full max-w-full overflow-hidden"
    >
      <div className="max-w-[600px] mx-auto">
          <div className="h-[250px] relative">
            <ThreeDPhotoCarousel
              images={previewImages.map(src => src.startsWith('/') ? src : `/${src}`)}
              onSelect={(index) => {
                setCurrentIndex(index)
                setIsInitialLoad(false)
              }}
            />
          {/* Loading overlay for individual images */}
          {Object.entries(loadingStates).map(([img, isLoading]) => (
            isLoading && (
              <div 
                key={img}
                className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
              >
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )
          ))}
          </div>
      </div>
    </motion.div>
  )
} 