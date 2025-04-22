'use client'

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { X, ExternalLink } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Add TypeScript declarations for TikTok global object
declare global {
  interface Window {
    TikTok?: {
      reload: () => void;
    };
  }
}

interface VideoPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  platform: 'youtube' | 'tiktok'
  title: string
}

export function VideoPlayerModal({ isOpen, onClose, videoUrl, platform, title }: VideoPlayerModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [loadingError, setLoadingError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isYoutube = platform === 'youtube'

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Reset error state when opening modal
      setLoadingError(false)
      
      // Set a timeout to catch loading errors for both platforms
      const errorTimeoutId = setTimeout(() => {
        setLoadingError(true)
        console.warn('Video embed timed out - showing fallback UI')
      }, 8000)
      
      // For TikTok specifically
      if (!isYoutube) {
        try {
          // Simplified approach for TikTok - just use an iframe for better CSP compatibility
          // Let the fallback UI handle it if loading fails
          setLoadingError(false)
        } catch (error) {
          console.error('Error setting up TikTok embed:', error)
          setLoadingError(true)
        }
      }
      
      return () => {
        clearTimeout(errorTimeoutId)
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
    
    if (loadingError) {
      // Show fallback UI with link to original content
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center h-full">
          <p className="text-muted-foreground mb-4">Sorry, we couldn't load the video.</p>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => window.open(videoUrl, '_blank')}
          >
            Open in {isYoutube ? 'YouTube' : 'TikTok'}
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      )
    }
    
    if (isYoutube) {
      return (
        <iframe
          ref={iframeRef}
          className="w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&mute=0`}
          title={title}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none' }}
        />
      )
    }
    
    // TikTok embed using direct iframe
    return (
      <iframe
        src={`https://www.tiktok.com/embed/v2/${videoId}`}
        style={{ maxWidth: '325px', minWidth: '325px', minHeight: '575px', border: 'none' }}
        allowFullScreen
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title={title}
        onError={() => setLoadingError(true)}
      ></iframe>
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