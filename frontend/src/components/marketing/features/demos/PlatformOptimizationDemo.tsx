'use client'

import { Download, Share2, Youtube, Instagram } from 'lucide-react'
import { SiTiktok } from 'react-icons/si'
import { cn } from '@/lib/utils'

const platforms = [
  { name: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600' },
  { name: 'TikTok', icon: SiTiktok, color: 'from-pink-500 to-fuchsia-600' },
  { name: 'Instagram', icon: Instagram, color: 'from-purple-500 to-pink-600' }
]

export function PlatformOptimizationDemo() {
  return (
    <div className="space-y-6 min-h-[400px]">
      <div className="p-6 rounded-lg bg-accent/5 space-y-4">
        <div className="flex items-center justify-center gap-4">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors">
            <Download className="w-4 h-4" />
            <span>Download Video</span>
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-muted-foreground text-sm">
            <Share2 className="w-4 h-4" />
            <span>Direct social media sharing coming soon</span>
          </div>
        </div>

        {/* Platform Support */}
        <div className="mt-8">
          <h3 className="text-sm font-medium mb-4 text-center">Supported Platforms</h3>
          <div className="grid grid-cols-3 gap-4">
            {platforms.map((platform) => (
              <div 
                key={platform.name} 
                className={cn(
                  "p-6 rounded-lg bg-gradient-to-br text-white",
                  platform.color
                )}
              >
                <div className="flex flex-col items-center gap-3">
                  <platform.icon className="w-8 h-8" />
                  <div className="text-center">
                    <div className="font-medium">{platform.name}</div>
                    <div className="text-xs opacity-80 mt-1">
                      Optimized Format
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 