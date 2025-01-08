/**
 * Showcase Page
 * 
 * Displays a curated collection of videos created with our platform.
 * Uses a masonry grid layout for visually appealing presentation.
 * 
 * URL: /showcase
 */

'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { VideoCard } from '@/components/marketing/showcase/VideoCard'
import showcaseData from '@/data/showcase-videos.json'

// Type assertion for the imported data
const showcaseVideos = showcaseData.videos as Array<{
  id: number
  title: string
  platform: 'youtube' | 'tiktok'
  embedUrl: string
}>

export default function ShowcasePage() {
  return (
    <div className="relative min-h-screen">
      {/* Background decoration - adjusted opacity and layers */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-accent/5 to-background" />
        <div className="absolute inset-0 bg-grid-white/10" />
      </div>

      <div className="container relative px-4 md:px-6 py-24">
        {/* Page header - improved text contrast */}
        <div className="text-center mb-24">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Video Showcase</span>
          </motion.div>

          <motion.h1 
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Created with AI Magic
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Explore examples of engaging content created using our platform
          </motion.p>
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {showcaseVideos.map((video, index) => (
            <VideoCard
              key={video.id}
              title={video.title}
              platform={video.platform}
              embedUrl={video.embedUrl}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 