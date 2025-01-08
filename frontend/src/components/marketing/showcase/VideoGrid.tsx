'use client'

import { motion } from 'framer-motion'
import { VideoCard } from './VideoCard'

interface VideoGridProps {
  videos: Array<{
    id: number
    title: string
    platform: 'youtube' | 'tiktok'
    embedUrl: string
  }>
}

export default function VideoGrid({ videos }: VideoGridProps) {
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {videos.map((video, index) => (
        <VideoCard
          key={video.id}
          title={video.title}
          platform={video.platform}
          embedUrl={video.embedUrl}
          delay={index * 0.1}
          index={index}
        />
      ))}
    </motion.div>
  )
} 