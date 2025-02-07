/**
 * Showcase Page
 * 
 * Displays a curated collection of videos created with our platform.
 * Uses a masonry grid layout for visually appealing presentation.
 * 
 * URL: /showcase
 */

import { Sparkles } from 'lucide-react'
import showcaseData from '@/data/showcase-videos.json'
import { ClientVideoGrid } from '@/components/marketing/showcase/ClientVideoGrid'

// Type assertion for the imported data
const showcaseVideos = showcaseData.videos as Array<{
  id: number
  title: string
  platform: 'youtube' | 'tiktok'
  embedUrl: string
}>

export default function ShowcasePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="container relative px-4 md:px-6 py-24">
        {/* Page header */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Video Showcase</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Created with AI Magic
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Explore examples of engaging content created using our platform
          </p>
        </div>

        {/* Video grid */}
        <ClientVideoGrid videos={showcaseVideos} />
      </div>
    </div>
  )
} 