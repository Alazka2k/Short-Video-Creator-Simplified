'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Volume2 } from 'lucide-react'
import voiceData from '@/data/video-creation/voice/voice-select-option.json'

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
  const [volume, setVolume] = useState(0.8)
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

      // Create and play new audio
      const audio = new Audio(previewUrl)
      audio.volume = volume
      audioRef.current = audio

      audio.addEventListener('ended', () => {
        setPlayingPreview(null)
      })

      await audio.play()
      setPlayingPreview(voiceId)
    } catch (error) {
      setAudioError('Unable to play preview. Please try again.')
      setPlayingPreview(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Category Selection */}
      <div className="flex gap-4">
        {voiceDataTyped.categories.map((category) => (
          <Button
            key={category.id}
            variant={currentCategory === category.id ? "default" : "outline"}
            onClick={() => setCurrentCategory(category.id)}
            disabled={isGenerating}
            className="flex-1"
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
      <div className="grid grid-cols-2 gap-4">
        {voiceDataTyped.categories
          .find(c => c.id === currentCategory)
          ?.options.map((voice) => (
            <Card
              key={voice.id}
              className={`p-6 transition-all cursor-pointer hover:shadow-md ${
                selectedVoice === voice.id
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:bg-accent/5'
              }`}
              onClick={() => !isGenerating && setSelectedVoice(voice.id)}
            >
              <div className="flex items-start gap-4">
                {/* Voice Persona Image */}
                <img
                  src={voice.personaUrl}
                  alt={voice.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{voice.name}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
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

                  <p className="text-sm text-muted-foreground">
                    {voice.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
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

      {/* Volume Control */}
      <div className="flex items-center gap-4 w-[200px]">
        <Volume2 className="w-4 h-4" />
        <Slider
          value={[volume * 100]}
          onValueChange={(value) => {
            const newVolume = value[0] / 100
            setVolume(newVolume)
            if (audioRef.current) {
              audioRef.current.volume = newVolume
            }
          }}
          max={100}
          step={1}
        />
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