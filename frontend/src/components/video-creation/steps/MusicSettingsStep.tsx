'use client'

import { cn } from '@/lib/utils'
import { Music } from 'lucide-react'

/**
 * Note: The music settings functionality is currently not in use.
 * The backend for defining music options in a job is not ready yet.
 * This placeholder is for future implementation when the backend is available.
 */


// This is a placeholder until we have the actual music configuration
const musicStyles = [
  { id: 'upbeat', name: 'Upbeat', description: 'Energetic and positive music' },
  { id: 'calm', name: 'Calm', description: 'Relaxing and peaceful music' },
  { id: 'dramatic', name: 'Dramatic', description: 'Intense and emotional music' },
  { id: 'corporate', name: 'Corporate', description: 'Professional and business-like music' },
  { id: 'inspirational', name: 'Inspirational', description: 'Motivational and uplifting music' }
]

interface MusicSettingsStepProps {
  selectedMusicStyle: string
  setSelectedMusicStyle: (value: string) => void
  isGenerating: boolean
}

export function MusicSettingsStep({
  selectedMusicStyle = musicStyles[0].id,
  setSelectedMusicStyle,
  isGenerating
}: MusicSettingsStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Music Settings</h2>
      <div className="p-4 rounded-lg bg-accent/5">
        <h4 className="font-medium mb-4">Music Style</h4>
        <div className="space-y-4">
          {musicStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedMusicStyle(style.id)}
              className={cn(
                "w-full p-4 rounded-lg transition-colors text-left",
                selectedMusicStyle === style.id ? "bg-primary/20" : "bg-accent/10"
              )}
              disabled={isGenerating}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">{style.name}</div>
                  <div className="text-sm text-muted-foreground">{style.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 