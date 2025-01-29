import { motion } from "framer-motion"
import { ThreeDPhotoCarousel } from "@/components/ui/3d-carousel"
import { useEffect, useState } from "react"

interface VisualStyleCarouselProps {
  previewImages: string[]
}

export function VisualStyleCarousel({ previewImages }: VisualStyleCarouselProps) {
  const [loadedImages, setLoadedImages] = useState<string[]>([])
  const [loadingErrors, setLoadingErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("Starting to load images:", previewImages)
    setIsLoading(true)
    setLoadedImages([])
    setLoadingErrors([])

    const loadImage = (src: string) => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          console.log("Successfully loaded:", src)
          setLoadedImages(prev => [...prev, src])
          resolve(src)
        }
        img.onerror = (error) => {
          console.error("Failed to load:", src, error)
          setLoadingErrors(prev => [...prev, src])
          reject(error)
        }
        img.src = src
      })
    }

    Promise.all(previewImages.map(src => loadImage(src).catch(err => err)))
      .finally(() => {
        setIsLoading(false)
        console.log("Finished loading attempt")
      })
  }, [previewImages])

  const allImagesLoaded = loadedImages.length === previewImages.length

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
              images={loadedImages}
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