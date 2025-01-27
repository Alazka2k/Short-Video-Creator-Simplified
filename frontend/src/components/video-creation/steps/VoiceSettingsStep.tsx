'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Pause } from 'lucide-react'
import voiceData from '@/data/video-creation/voice/voice-select-option.json'
import { cn } from '@/lib/utils'

interface VoiceData {
  categories: VoiceCategory[]
}

interface VoiceCategory {
  id: string
  name: string
  description: string
  options: VoiceOption[]
}

interface VoiceOption {
  id: string
  name: string
  description: string
  tags: string[]
  elevenlabsVoiceId: string
  previewUrl: string
  personaUrl: string
}

const voiceDataTyped = voiceData as {
  categories: {
    id: string
    name: string
    description: string
    options: {
      id: string
      name: string
      description: string
      tags: string[]
      elevenlabsVoiceId: string
      previewUrl: string
      personaUrl: string
    }[]
  }[]
}

interface VoiceSettingsStepProps {
  selectedVoice: string
  setSelectedVoice: (value: string) => void
  isGenerating: boolean
}

export function VoiceSettingsStep({
  selectedVoice,
  setSelectedVoice,
  isGenerating
}: VoiceSettingsStepProps) {
  const [currentCategory, setCurrentCategory] = useState(voiceDataTyped.categories[0].id)
  const [playingPreview, setPlayingPreview] = useState<string | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlayPreview = async (previewUrl: string, voiceId: string) => {
    try {
      setAudioError(null)
      
      // Stop current preview if playing
      if (playingPreview === voiceId) {
        audioRef.current?.pause()
        setPlayingPreview(null)
        return
      }

      // Stop any other playing preview
      if (playingPreview) {
        audioRef.current?.pause()
      }

      // Create and play new audio with the ElevenLabs preview URL
      const audio = new Audio(previewUrl)
      audioRef.current = audio

      audio.addEventListener('ended', () => {
        setPlayingPreview(null)
      })

      await audio.play()
      setPlayingPreview(voiceId)
    } catch (error) {
      console.error('Error playing preview:', error)
      setAudioError('Unable to play preview. Please try again.')
      setPlayingPreview(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Category Selection */}
      <div className="flex flex-wrap gap-4">
        {voiceDataTyped.categories.map((category) => (
          <Button
            key={category.id}
            variant={currentCategory === category.id ? "default" : "outline"}
            onClick={() => setCurrentCategory(category.id)}
            disabled={isGenerating}
            className="flex-1 min-w-[120px] max-w-[200px]"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Category Description */}
      <AnimatePresence mode="wait">
        {voiceDataTyped.categories.map((category) => (
          category.id === currentCategory && (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-muted-foreground"
            >
              {category.description}
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Voice Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {voiceDataTyped.categories
          .find(c => c.id === currentCategory)
          ?.options.map((voice) => (
            <Card
              key={voice.id}
              className={cn(
                "p-4 transition-all cursor-pointer hover:shadow-md",
                selectedVoice === voice.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-accent/5"
              )}
              onClick={() => !isGenerating && setSelectedVoice(voice.id)}
            >
              <div className="flex items-start gap-4">
                <img
                  src={voice.personaUrl}
                  alt={voice.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold truncate">{voice.name}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlayPreview(voice.previewUrl, voice.id)
                      }}
                      disabled={isGenerating}
                    >
                      {playingPreview === voice.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {voice.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {voice.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-primary/10 text-primary border-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {/* Error Message */}
      {audioError && (
        <div className="text-sm text-red-500">
          {audioError}
        </div>
      )}
    </div>
  )
} 