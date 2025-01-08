'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the video grid component
const VideoGrid = dynamic(() => import('./VideoGrid'), {
  ssr: false,
  loading: () => <div>Loading videos...</div>
})

interface ClientVideoGridProps {
  videos: Array<{
    id: number
    title: string
    platform: 'youtube' | 'tiktok'
    embedUrl: string
  }>
}

export function ClientVideoGrid({ videos }: ClientVideoGridProps) {
  return (
    <Suspense fallback={<div>Loading videos...</div>}>
      <VideoGrid videos={videos} />
    </Suspense>
  )
} 