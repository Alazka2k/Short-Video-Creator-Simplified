'use client'

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import Script from 'next/script'

interface VideoPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  platform: 'youtube' | 'tiktok'
  title: string
}

export function VideoPlayerModal({ isOpen, onClose, videoUrl, platform, title }: VideoPlayerModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const isYoutube = platform === 'youtube'

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Reload TikTok embed script when modal opens
    if (isOpen && !isYoutube) {
      const script = document.createElement('script')
      script.src = 'https://www.tiktok.com/embed.js'
      script.async = true
      document.body.appendChild(script)
      
      return () => {
        document.body.removeChild(script)
      }
    }
  }, [isOpen, isYoutube])

  // Extract video ID based on platform
  const getVideoId = () => {
    if (isYoutube) {
      const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([^?&]+)/);
      return match?.[1] || '';
    }
    const match = videoUrl.match(/\/video\/(\d+)/);
    return match?.[1] || '';
  }

  // Get embed content based on platform
  const getEmbedContent = () => {
    const videoId = getVideoId()
    if (isYoutube) {
      return (
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&mute=0`}
          title={title}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none' }}
        />
      )
    }
    
    // TikTok embed
    return (
      <blockquote 
        className="tiktok-embed" 
        cite={videoUrl}
        data-video-id={videoId}
        style={{ maxWidth: '325px', minWidth: '325px' }}
      >
        <section>
          <a href={videoUrl} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </section>
      </blockquote>
    )
  }

  if (!isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "p-0 overflow-hidden bg-black border-none",
        isYoutube ? "sm:max-w-[400px]" : "sm:max-w-[325px]"
      )}>
        <DialogTitle className="sr-only">
          {title}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Video player for {title}
        </DialogDescription>
        
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-50 rounded-full bg-background/90 p-2 hover:bg-background/70 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className={cn(
          "w-full",
          isYoutube ? "aspect-[9/16]" : "min-h-[575px]"
        )}>
          {getEmbedContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
} 