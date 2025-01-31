'use client'

import React, { useEffect, useRef } from 'react'
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
  setSelectedVisualization: (value: 'image' | 'video' | 'animation') => void
  isGenerating: boolean
  selectedDuration?: {
    serviceRestrictions?: string[]
  } | null
}

export function VisualizationTypeSelection({
  selectedVisualization,
  setSelectedVisualization,
  isGenerating,
  selectedDuration
}: VisualizationTypeSelectionProps) {
  const [hoveredCard, setHoveredCard] = React.useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    visualizationTypes.forEach(type => {
      if (type.type === 'video') {
        const video = videoRefs.current[type.id];
        if (video) {
          if (hoveredCard === type.id || selectedVisualization === type.id) {
            video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = 0;
          }
        }
      }
    });
  }, [hoveredCard, selectedVisualization]);

  const isServiceAllowed = (service: string) => {
    if (!selectedDuration?.serviceRestrictions) return true;
    const restrictions = selectedDuration.serviceRestrictions.map(r => r.toLowerCase());
    // Special handling for visualization types
    if (service === 'animation' || service === 'video' || service === 'image') {
      return restrictions.some(r => ['image', 'video', 'animation'].includes(r));
    }
    return restrictions.includes(service);
  }

  const handleVisualizationChange = (type: 'image' | 'video' | 'animation') => {
    if (!isGenerating && isServiceAllowed(type)) {
      setSelectedVisualization(type);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Visualization Type</h3>
      <div className="grid gap-6 sm:grid-cols-3">
        {visualizationTypes.map((type) => {
          const isAllowed = isServiceAllowed(type.id);
          return (
            <Card 
              key={type.id} 
              className={cn(
                "cursor-pointer transition-all hover:scale-[1.02]",
                selectedVisualization === type.id 
                  ? "ring-2 ring-primary ring-offset-8 ring-offset-background" 
                  : "hover:border-primary/50",
                !isAllowed && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
              onClick={() => handleVisualizationChange(type.id as 'image' | 'video' | 'animation')}
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
                      ref={(el) => {
                        if (el) videoRefs.current[type.id] = el;
                      }}
                      src={type.preview}
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
          );
        })}
      </div>
    </div>
  )
} 