'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Sparkles, Video, Music, Image, Mic, Check } from 'lucide-react'

const durationOptions = [
  { label: '0-30 Seconds', value: 30, scenes: 5 },
  { label: '30-60 Seconds', value: 60, scenes: 9 },
  { label: 'Up to 90 Seconds', value: 90, scenes: 13 }
]

export function ContentGenerationDemo() {
  const [enabledServices, setEnabledServices] = useState({
    voice: true,
    music: true,
    image: true
  })
  const [selectedVisualization, setSelectedVisualization] = useState<'plain' | 'video' | 'animation'>('plain')
  const [selectedDuration, setSelectedDuration] = useState(durationOptions[0])

  return (
    <div className="space-y-6 min-h-[400px]">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-accent/5">
          <h4 className="font-medium mb-2">Video Idea</h4>
          <input 
            type="text" 
            value="Top 5 history moments"
            readOnly
            className="w-full bg-transparent border-none text-sm text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="p-4 rounded-lg bg-accent/5">
          <h4 className="font-medium mb-2">Duration</h4>
          <select 
            value={selectedDuration.value}
            onChange={(e) => setSelectedDuration(durationOptions.find(d => d.value === Number(e.target.value)) || durationOptions[0])}
            className="w-full bg-transparent border-none text-sm text-muted-foreground focus:outline-none"
          >
            {durationOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} (~{option.scenes} scenes)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Service Toggle */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setEnabledServices(prev => ({ ...prev, voice: !prev.voice }))}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
              enabledServices.voice ? "bg-primary/20" : "bg-accent/5"
            )}
          >
            <Mic className={cn(
              "w-4 h-4",
              enabledServices.voice ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="text-sm">Voice</span>
            <Check className={cn(
              "w-4 h-4 ml-1",
              enabledServices.voice ? "opacity-100" : "opacity-0"
            )} />
          </button>
          <button
            onClick={() => setEnabledServices(prev => ({ ...prev, music: !prev.music }))}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
              enabledServices.music ? "bg-primary/20" : "bg-accent/5"
            )}
          >
            <Music className={cn(
              "w-4 h-4",
              enabledServices.music ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="text-sm">Music</span>
            <Check className={cn(
              "w-4 h-4 ml-1",
              enabledServices.music ? "opacity-100" : "opacity-0"
            )} />
          </button>
          <button
            onClick={() => {
              setEnabledServices(prev => {
                const newState = { ...prev, image: !prev.image }
                if (!newState.image) {
                  setSelectedVisualization('plain')
                }
                return newState
              })
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
              enabledServices.image ? "bg-primary/20" : "bg-accent/5"
            )}
          >
            <Image className={cn(
              "w-4 h-4",
              enabledServices.image ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="text-sm">Visuals</span>
            <Check className={cn(
              "w-4 h-4 ml-1",
              enabledServices.image ? "opacity-100" : "opacity-0"
            )} />
          </button>
      </div>

        {/* Visualization Options */}
        {enabledServices.image && (
          <div className="p-4 rounded-lg bg-accent/5">
            <h4 className="font-medium mb-3">Visualization Type</h4>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedVisualization('plain')}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  selectedVisualization === 'plain' ? "bg-primary/20" : "bg-accent/10"
                )}
              >
                <Image className="w-4 h-4" />
                <span className="text-sm">Plain</span>
              </button>
              <button
                onClick={() => setSelectedVisualization('video')}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  selectedVisualization === 'video' ? "bg-primary/20" : "bg-accent/10"
                )}
              >
                <Video className="w-4 h-4" />
                <span className="text-sm">Video</span>
              </button>
              <button
                onClick={() => setSelectedVisualization('animation')}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  selectedVisualization === 'animation' ? "bg-primary/20" : "bg-accent/10"
                )}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Animation</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
        <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Generating content...</span>
          <span className="text-primary">80%</span>
        </div>
        <div className="h-2 bg-accent/10 rounded-full overflow-hidden">
          <div 
            className="h-full w-4/5 bg-gradient-to-r from-primary to-accent transition-all duration-500"
              />
            </div>
        </div>
    </div>
  )
} 