'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Youtube, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VideoPlayerModal } from './VideoPlayerModal'
import Image from 'next/image'

interface VideoCardProps {
  title: string
  platform: 'youtube' | 'tiktok'
  embedUrl: string
  delay?: number
  index?: number
}

interface TikTokOEmbed {
  thumbnail_url: string
  author_url: string
  html: string
  width: string
  height: string
}

export function VideoCard({ title, platform, embedUrl, delay = 0, index = 0 }: VideoCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('')
  const isYoutube = platform === 'youtube'

  useEffect(() => {
    const fetchThumbnail = async () => {
      if (isYoutube) {
        const videoId = embedUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([^?&]+)/)?.[1]
        if (videoId) {
          setThumbnailUrl(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`)
        }
      } else {
        try {
          const response = await fetch(`https://www.tiktok.com/oembed?url=${embedUrl}`)
          const data: TikTokOEmbed = await response.json()
          setThumbnailUrl(data.thumbnail_url)
        } catch (error) {
          console.error('Failed to fetch TikTok thumbnail:', error)
          setThumbnailUrl('')
        }
      }
    }

    fetchThumbnail()
  }, [embedUrl, isYoutube])

  // Dynamic styles based on index
  const getCardStyles = () => {
    const styles = [
      "lg:translate-y-4",
      "lg:-translate-y-4",
      "lg:translate-y-8",
    ]
    return styles[index % styles.length]
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.6 }}
        className={cn(
          "group relative cursor-pointer",
          getCardStyles()
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative rounded-2xl overflow-hidden bg-card hover:shadow-xl transition-all duration-300">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Platform badge */}
          <div className="absolute top-4 right-4 z-10 bg-background/95 shadow-lg backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
            {isYoutube ? (
              <Youtube className="w-4 h-4 text-red-500" />
            ) : (
              <svg className="w-4 h-4 text-[#00f2ea]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            )}
            <span className="text-xs font-medium">{isYoutube ? 'YouTube Short' : 'TikTok'}</span>
          </div>

          {/* Video preview */}
          <div className="aspect-[9/16] w-full bg-black/90 relative group/play">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 animate-pulse" />
            )}
            <div className="absolute inset-0 bg-black/40 group-hover/play:bg-black/60 transition-colors duration-300" />
            
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-background/90 p-4 transform group-hover/play:scale-110 transition-transform duration-300">
                <Play className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Title with gradient overlay */}
          <div className="relative p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <h3 className="font-medium text-lg leading-tight text-white">{title}</h3>
          </div>
        </div>
      </motion.div>

      {/* Video player modal */}
      <VideoPlayerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoUrl={embedUrl}
        platform={platform}
        title={title}
      />
    </>
  )
} 