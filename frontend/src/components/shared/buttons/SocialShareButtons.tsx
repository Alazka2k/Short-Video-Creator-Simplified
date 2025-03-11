import { Button } from "@/components/ui/button"
import { Youtube, Instagram } from "lucide-react"
import { TikTokIcon } from "@/components/icons/TikTokIcon"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SocialShareButtonsProps {
  videoUrl: string
  title?: string
  className?: string
  onShare?: (platform: 'youtube' | 'tiktok' | 'instagram') => Promise<void>
}

export function SocialShareButtons({
  videoUrl,
  title = "",
  className = "",
  onShare
}: SocialShareButtonsProps) {
  const handleShare = async (platform: 'youtube' | 'tiktok' | 'instagram') => {
    try {
      if (onShare) {
        await onShare(platform)
      } else {
        // Default share behavior
        switch (platform) {
          case 'youtube':
            window.open(`https://studio.youtube.com/channel/upload?videoId=${encodeURIComponent(videoUrl)}`, '_blank')
            break
          case 'tiktok':
            window.open('https://www.tiktok.com/upload', '_blank')
            break
          case 'instagram':
            window.open('https://www.instagram.com/create/reels/', '_blank')
            break
        }
      }
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('youtube')}
              className="hover:text-red-500 hover:border-red-500/50"
            >
              <Youtube className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share to YouTube</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('tiktok')}
              className="hover:text-black hover:border-black/50 dark:hover:text-white dark:hover:border-white/50"
            >
              <TikTokIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share to TikTok</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('instagram')}
              className="hover:text-pink-500 hover:border-pink-500/50"
            >
              <Instagram className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share to Instagram</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
} 