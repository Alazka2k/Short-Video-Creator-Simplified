'use client'

import { motion } from 'framer-motion'
import { Sparkles, Video, Music, Image, Mic, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import contentGenConfig from '@/data/features/content-generation.json'
import { useState, useEffect } from 'react'

export function ContentGenerationDemo() {
  const [enabledServices, setEnabledServices] = useState(
    contentGenConfig.services.reduce((acc, service) => ({
      ...acc,
      [service.id]: service.defaultEnabled
    }), {} as Record<string, boolean>)
  )
  const [selectedVisualization, setSelectedVisualization] = useState<'plain' | 'video' | 'animation' | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0
        return prev + 1
      })
    }, 100)
    return () => clearInterval(timer)
  }, [])

  const toggleService = (serviceId: string) => {
    const service = contentGenConfig.services.find(s => s.id === serviceId)
    if (!service || service.required) return

    if (service.id === 'image' && enabledServices[service.id]) {
      setEnabledServices(prev => ({
        ...prev,
        [service.id]: false,
        video: false
      }))
      setSelectedVisualization(null)
    } else {
      setEnabledServices(prev => ({
        ...prev,
        [service.id]: !prev[service.id]
      }))
    }
  }

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
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-accent/5">
            <h4 className="font-medium mb-2">Scene Amount</h4>
            <select className="w-full bg-transparent border-none text-sm text-muted-foreground focus:outline-none">
              {contentGenConfig.sceneAmounts.map(amount => (
                <option key={amount.value} value={amount.value}>{amount.label}</option>
              ))}
            </select>
          </div>
          <div className="p-4 rounded-lg bg-accent/5">
            <h4 className="font-medium mb-2">Focus</h4>
            <input 
              type="text" 
              value="Focus on both positive and negative impacts"
              readOnly
              className="w-full bg-transparent border-none text-sm text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Service Toggle */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {contentGenConfig.services.map((service) => (
            <button
              key={service.id}
              onClick={() => toggleService(service.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                enabledServices[service.id] ? "bg-primary/20" : "bg-accent/5"
              )}
            >
              {service.icon === 'Mic' && <Mic className={cn(
                "w-4 h-4",
                enabledServices[service.id] ? "text-primary" : "text-muted-foreground"
              )} />}
              {service.icon === 'Music' && <Music className={cn(
                "w-4 h-4",
                enabledServices[service.id] ? "text-primary" : "text-muted-foreground"
              )} />}
              {service.icon === 'Image' && <Image className={cn(
                "w-4 h-4",
                enabledServices[service.id] ? "text-primary" : "text-muted-foreground"
              )} />}
              <span className="text-sm">{service.label}</span>
              <Check className={cn(
                "w-4 h-4 ml-1",
                enabledServices[service.id] ? "opacity-100" : "opacity-0"
              )} />
            </button>
          ))}
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
          <span className="text-primary">{progress}%</span>
        </div>
        <div className="h-2 bg-accent/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  )
} 