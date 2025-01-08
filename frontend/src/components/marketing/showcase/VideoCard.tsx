'use client'

import { motion } from 'framer-motion'
import { Youtube } from 'lucide-react'

interface VideoCardProps {
  title: string
  platform: 'youtube' | 'tiktok'
  embedUrl: string
  delay?: number
}

export function VideoCard({ title, platform, embedUrl, delay = 0 }: VideoCardProps) {
  const isYoutube = platform === 'youtube'
  
  // Extract video ID from URL
  const getVideoId = () => {
    if (isYoutube) {
      return embedUrl.split('/').pop()?.split('?')[0]
    }
    return embedUrl.split('/').pop()
  }

  // Get embed URL with proper parameters
  const getEmbedUrl = () => {
    const videoId = getVideoId()
    if (isYoutube) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0`
    }
    // TikTok embed with custom parameters
    return `https://www.tiktok.com/embed/v2/${videoId}?autoplay=0&hideSharingButton=1&hideComment=1&hidelike=1`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="group relative"
    >
      <div className="relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/20 transition-colors">
        {/* Platform badge */}
        <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
          {isYoutube ? (
            <Youtube className="w-4 h-4 text-red-500" />
          ) : (
            <svg className="w-4 h-4 text-[#00f2ea]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          )}
          <span className="text-xs font-medium">{isYoutube ? 'YouTube Short' : 'TikTok'}</span>
        </div>

        {/* Video embed with improved styling */}
        <div className="aspect-[9/16] w-full bg-black">
          <iframe
            className="w-full h-full"
            src={getEmbedUrl()}
            title={title}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none' }}
          />
        </div>

        {/* Title */}
        <div className="p-4">
          <h3 className="font-medium text-lg leading-tight">{title}</h3>
        </div>
      </div>
    </motion.div>
  )
} 