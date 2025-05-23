'use client'

import { motion } from 'framer-motion'
import voiceData from '@/data/video-creation/voice/voice-select-option.json'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Play, Pause } from 'lucide-react'
import { useState, useRef } from 'react'

// Pick 3 sample categories and 1-2 voices per category
const sampleCategories = voiceData.categories.slice(0, 3).map(cat => ({
  ...cat,
  options: cat.options.slice(0, 2)
}))

export function VoiceGenerationDemo() {
  const [playingPreview, setPlayingPreview] = useState<string | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlayPreview = (previewUrl: string, voiceId: string) => {
    setAudioError(null)
    // If the same voice is playing, pause it
    if (playingPreview === voiceId) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setPlayingPreview(null)
      return
    }
    // Pause any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    // Create and play new audio
    const audio = new Audio(previewUrl)
    audioRef.current = audio
    audio.addEventListener('ended', () => {
      setPlayingPreview(null)
    })
    audio.addEventListener('error', () => {
      setAudioError('Unable to play preview. Please try again.')
      setPlayingPreview(null)
    })
    audio.play().then(() => {
      setPlayingPreview(voiceId)
    }).catch(() => {
      setAudioError('Unable to play preview. Please try again.')
      setPlayingPreview(null)
    })
  }

  return (
    <div className="space-y-6 min-h-[400px]">
      <div className="p-4 rounded-lg bg-accent/5">
        <h4 className="font-medium mb-4">Voice Selection</h4>
        {sampleCategories.map(category => (
          <div key={category.id} className="mb-6">
            <div className="font-semibold text-sm mb-2 text-primary">{category.name}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {category.options.map(voice => (
                <div key={voice.id} className="p-4 rounded-lg border bg-background flex gap-4 items-center">
                  <img
                    src={voice.personaUrl}
                    alt={voice.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    onError={e => (e.currentTarget.src = 'https://placehold.co/48x48?text=🎤')}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{voice.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={e => {
                          e.stopPropagation()
                          handlePlayPreview(voice.previewUrl, voice.id)
                        }}
                      >
                        {playingPreview === voice.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mb-1">{voice.description}</div>
                    <div className="flex flex-wrap gap-1">
                      {voice.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {audioError && <div className="text-xs text-red-500 mt-2">{audioError}</div>}
      </div>
    </div>
  )
} 