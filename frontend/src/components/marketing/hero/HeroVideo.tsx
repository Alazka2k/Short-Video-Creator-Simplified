'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEMO_CONTENT = [
  {
    src: '/demo/demo_science_01.png',
    alt: 'Science education video example showing complex concepts made simple',
    title: 'Science Made Simple',
    description: 'Transform complex topics into engaging content'
  },
  {
    src: '/demo/demo_philosophy_01.png',
    alt: 'Philosophy and deep thoughts video example with abstract visualization',
    title: 'Deep Insights',
    description: 'Share wisdom and philosophical concepts'
  },
  {
    src: '/demo/demo_horror_01.png',
    alt: 'Horror and mystery story video example with atmospheric visuals',
    title: 'Mystery Stories',
    description: 'Create captivating mysterious content'
  },
  {
    src: '/demo/demo_music_01.png',
    alt: 'Music and sound design video example with visual elements',
    title: 'Music & Sound',
    description: 'Explain music theory and sound concepts'
  },
  {
    src: '/demo/demo_mystery_01.png',
    alt: 'Unexplained mysteries and phenomena video example',
    title: 'Unsolved Mysteries',
    description: 'Explore historical mysteries and phenomena'
  }
]

const AUTO_ROTATE_INTERVAL = 5000 // 5 seconds

export function HeroVideo() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-rotate slides
  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % DEMO_CONTENT.length)
    }, AUTO_ROTATE_INTERVAL)

    return () => clearInterval(timer)
  }, [isPaused])

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % DEMO_CONTENT.length)
    setIsPaused(true) // Pause auto-rotation when user interacts
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + DEMO_CONTENT.length) % DEMO_CONTENT.length)
    setIsPaused(true) // Pause auto-rotation when user interacts
  }

  // Reset pause state when mouse leaves the carousel
  const handleMouseLeave = () => {
    setIsPaused(false)
  }

  // Pause auto-rotation when mouse enters
  const handleMouseEnter = () => {
    setIsPaused(true)
  }

  return (
    <div 
      className="relative w-full max-w-sm mx-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Aspect ratio container */}
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-2xl">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />

        {/* Images */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            className="absolute inset-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3
            }}
          >
            <Image
              src={DEMO_CONTENT[currentIndex].src}
              alt={DEMO_CONTENT[currentIndex].alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={currentIndex === 0}
              onError={() => setImageError(true)}
            />

            {/* Title Overlay */}
            <motion.div 
              className={cn(
                "absolute bottom-16 left-4 right-4",
                "bg-background/80 backdrop-blur-sm",
                "p-4 rounded-xl"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold">
                {DEMO_CONTENT[currentIndex].title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {DEMO_CONTENT[currentIndex].description}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Fallback for image error */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-sm text-muted-foreground">Preview not available</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="absolute inset-0 flex items-center justify-between p-4 z-20">
          <button
            onClick={prev}
            className="p-1 rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="p-1 rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          {DEMO_CONTENT.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setIsPaused(true)
              }}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-primary w-4'
                  : 'bg-primary/20 hover:bg-primary/40'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 