'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import visualConfig from '@/data/features/visual-creation.json'
import { VisualizationType } from '../types'

interface VisualSettingsStepProps {
  selectedVisualization: VisualizationType
  setSelectedVisualization: (value: VisualizationType) => void
  visualSettings: {
    artistStyle: string
    aspectRatio: string
    shotStyle: string
  }
  setVisualSettings: React.Dispatch<React.SetStateAction<{
    artistStyle: string
    aspectRatio: string
    shotStyle: string
  }>>
  isGenerating: boolean
}

export function VisualSettingsStep({
  selectedVisualization,
  setSelectedVisualization,
  visualSettings,
  setVisualSettings,
  isGenerating
}: VisualSettingsStepProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Visualization Type</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {['plain', 'video', 'animation'].map((type) => (
            <Card key={type} className={cn(
              "cursor-pointer transition-colors",
              selectedVisualization === type ? "border-primary" : "hover:border-primary/50"
            )}
            onClick={() => !isGenerating && setSelectedVisualization(type as VisualizationType)}
            >
              <CardContent className="p-4">
                <div className="font-medium capitalize">{type}</div>
                <div className="text-sm text-muted-foreground">
                  {type === 'plain' ? 'Static images' : 
                   type === 'video' ? 'Video sequences' : 
                   'Animated visuals'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Visual Style</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Artist Style</h4>
            <div className="grid gap-2">
              {visualConfig.artistStyles.map((style) => (
                <Card key={style.id} className={cn(
                  "cursor-pointer transition-colors",
                  visualSettings.artistStyle === style.id ? "border-primary" : "hover:border-primary/50"
                )}
                onClick={() => !isGenerating && setVisualSettings(prev => ({ ...prev, artistStyle: style.id }))}
                >
                  <CardContent className="p-4">
                    <div className="font-medium">{style.name}</div>
                    <div className="text-sm text-muted-foreground">By {style.name}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Aspect Ratio</h4>
            <div className="grid gap-2">
              {visualConfig.aspectRatios.map((ratio) => (
                <Card key={ratio.id} className={cn(
                  "cursor-pointer transition-colors",
                  visualSettings.aspectRatio === ratio.id ? "border-primary" : "hover:border-primary/50"
                )}
                onClick={() => !isGenerating && setVisualSettings(prev => ({ ...prev, aspectRatio: ratio.id }))}
                >
                  <CardContent className="p-4">
                    <div className="font-medium">{ratio.name}</div>
                    <div className="text-sm text-muted-foreground">{ratio.width}:{ratio.height}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 