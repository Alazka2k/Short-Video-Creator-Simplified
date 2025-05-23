'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'
import shotStyleData from '@/data/video-creation/image/shot-style_select-option.json'
import aspectRatioData from '@/data/video-creation/image/aspect-ratio_select-option.json'
import { Card, CardContent } from '@/components/ui/card'
import { VisualStyleCarousel } from '@/components/video-creation/sections/VisualStyleCarousel'
import Image from 'next/image'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

export function VisualCreationDemo() {
  // Shot style selection
  const [selectedShotStyle, setSelectedShotStyle] = useState(shotStyleData.categories[0].options[0].id)
  // Aspect ratio selection
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatioData.options[0].id)

  // Find selected shot style object
  const filteredCategories = shotStyleData.categories.map(category => ({
    ...category,
    options: category.options.filter(opt => opt.demo)
  })).filter(category => category.options.length > 0)

  const selectedStyle = filteredCategories
    .flatMap(cat => cat.options)
    .find(opt => opt.id === selectedShotStyle)

  return (
    <TooltipProvider>
      <div className="space-y-8 min-h-[400px]">
        {/* Style Selection */}
        <div className="space-y-4">
          <h4 className="font-medium mb-2">Style</h4>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map(category => (
              <div key={category.id} className="min-w-0">
                <div className="text-base font-semibold text-muted-foreground mb-3 border-b pb-1 border-border/40 uppercase tracking-wide">{category.name}</div>
                <div className="flex flex-col gap-4">
                  {category.options.map(option => (
                    <Card
                      key={option.id}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedShotStyle === option.id ? 'border-primary' : 'hover:border-primary/50'
                      )}
                      style={{ minHeight: 120 }}
                      onClick={() => setSelectedShotStyle(option.id)}
                    >
                      <CardContent className="p-5 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'rounded-lg overflow-hidden bg-muted flex-shrink-0',
                            selectedShotStyle === option.id ? 'ring-2 ring-primary' : ''
                          )} style={{ width: 56, height: 56 }}>
                            <Image
                              src={option.previewImages[0]}
                              alt={option.name}
                              width={56}
                              height={56}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base truncate">{option.name}</div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-xs text-muted-foreground line-clamp-2 cursor-help">
                                  {option.description}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <span className="text-xs">{option.description}</span>
                              </TooltipContent>
                            </Tooltip>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {option.tags.map(tag => (
                                <span key={tag} className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Carousel for selected style */}
          {selectedStyle && (
            <div className="pt-4">
              <VisualStyleCarousel previewImages={selectedStyle.previewImages} selectedStyle={selectedStyle.id} />
            </div>
          )}
        </div>

        {/* Aspect Ratio Selection */}
        <div className="space-y-4">
          <h4 className="font-medium mb-2">Aspect Ratio</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            {aspectRatioData.options.map(ratio => (
              <Card
                key={ratio.id}
                className={cn(
                  'cursor-pointer transition-colors flex flex-col h-[110px] p-0 border',
                  selectedAspectRatio === ratio.id ? 'border-primary' : 'hover:border-primary/50'
                )}
                onClick={() => setSelectedAspectRatio(ratio.id)}
              >
                <CardContent className="flex flex-col items-center px-3 py-2 h-full justify-center">
                  <div className="font-medium text-base mb-2">{ratio.name}</div>
                  <div className="flex items-center justify-center mt-1">
                    <div className="text-xs text-muted-foreground text-center px-1">{ratio.description}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
} 