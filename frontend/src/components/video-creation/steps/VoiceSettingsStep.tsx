'use client'

import { cn } from '@/lib/utils'
import voiceData from '@/data/features/voices.json'

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
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Voice Settings</h2>
      <div className="p-4 rounded-lg bg-accent/5">
        <h4 className="font-medium mb-4">Voice Selection</h4>
        <div className="space-y-4">
          {voiceData.voices.map((voice) => (
            <button
              key={voice.id}
              onClick={() => setSelectedVoice(voice.id)}
              className={cn(
                "w-full p-4 rounded-lg transition-colors text-left",
                selectedVoice === voice.id ? "bg-primary/20" : "bg-accent/10"
              )}
              disabled={isGenerating}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  🎤
                </div>
                <div>
                  <div className="font-medium">{voice.name}</div>
                  <div className="text-sm text-muted-foreground">{voice.description}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {voice.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 