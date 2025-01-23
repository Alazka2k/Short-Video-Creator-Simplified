'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Image as ImageIcon, Film, Box } from 'lucide-react'
import Image from 'next/image'

const visualizationTypes = [
  {
    id: 'image',
    name: 'Image',
    description: 'High-quality AI-generated static images for each scene',
    icon: ImageIcon,
    preview: '/creation/visualization-type-preview/image_scene_1.png',
    type: 'image'
  },
  {
    id: 'animation',
    name: '3D Effect',
    description: 'Animated effects and transitions between scenes',
    icon: Box,
    preview: '/creation/visualization-type-preview/animation_scene_1.mp4',
    type: 'video'
  },
  {
    id: 'video',
    name: 'Video',
    description: 'Dynamic video sequences with smooth transitions',
    icon: Film,
    preview: '/creation/visualization-type-preview/video_scene_1.mp4',
    type: 'video'
  }
]

interface VisualizationTypeSelectionProps {
  selectedVisualization: 'image' | 'video' | 'animation'
  setSelectedVisualization: React.Dispatch<React.SetStateAction<'image' | 'video' | 'animation'>>
  isGenerating: boolean
}

export function VisualizationTypeSelection({
  selectedVisualization,
  setSelectedVisualization,
  isGenerating
}: VisualizationTypeSelectionProps) {
  const [hoveredCard, setHoveredCard] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Visualization Type</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {visualizationTypes.map((type) => (
          <Card 
            key={type.id} 
            className={cn(
              "cursor-pointer transition-all hover:scale-[1.02] overflow-hidden",
              selectedVisualization === type.id 
                ? "ring-2 ring-primary ring-offset-4 ring-offset-background" 
                : "hover:border-primary/50"
            )}
            onClick={() => !isGenerating && setSelectedVisualization(type.id as 'image' | 'video' | 'animation')}
            onMouseEnter={() => setHoveredCard(type.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardContent className="p-0">
              {/* Preview Image/Video */}
              <div className="relative w-full aspect-[9/16] border-b">
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
                {type.type === 'image' ? (
                  <Image
                    src={type.preview}
                    alt={type.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <video
                    src={type.preview}
                    autoPlay={hoveredCard === type.id || selectedVisualization === type.id}
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {React.createElement(type.icon, { 
                    className: cn(
                      "w-4 h-4",
                      selectedVisualization === type.id ? "text-primary" : "text-muted-foreground"
                    )
                  })}
                  <div className="font-medium">{type.name}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {type.description}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 