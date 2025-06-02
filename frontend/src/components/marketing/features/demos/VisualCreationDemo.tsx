'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'
import shotStyleData from '@/data/video-creation/image/shot-style_select-option.json'
import aspectRatioData from '@/data/video-creation/image/aspect-ratio_select-option.json'
import { Card, CardContent } from '@/components/ui/card'
import { VisualStyleCarousel } from '@/components/video-creation/sections/VisualStyleCarousel'
import Image from 'next/image'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { useTheme } from 'next-themes'

export function VisualCreationDemo() {
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === 'dark'
  
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
          <h4 className="font-medium mb-2 text-foreground">Style</h4>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map(category => (
              <div key={category.id} className="mb-4">
                <h3 className="text-base font-semibold text-primary mb-3 border-b pb-1 border-border/40 uppercase tracking-wide">
                  {category.name}
                </h3>
                <div className="space-y-3">
                  {category.options.map(option => (
                    <Card
                      key={option.id}
                      className={cn(
                        'cursor-pointer hover:border-primary/50 transition-all',
                        selectedShotStyle === option.id && 'border-primary bg-primary/5'
                      )}
                      onClick={() => setSelectedShotStyle(option.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          {/* Image thumbnail */}
                          <div className={cn(
                            'w-12 h-12 rounded overflow-hidden flex-shrink-0',
                            selectedShotStyle === option.id && 'ring-2 ring-primary'
                          )}>
                            <Image
                              src={option.previewImages[0]}
                              alt={option.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm text-foreground truncate">{option.name}</h4>
                            
                            <Tooltip>
                              <TooltipTrigger className="w-full text-left">
                                <p className="text-xs text-muted-foreground truncate mt-1 cursor-help">
                                  {option.description}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="p-2 bg-card border border-border">
                                <p className="text-xs text-foreground max-w-[250px]">{option.description}</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {option.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-sm">
                                  {tag}
                                </span>
                              ))}
                              {option.tags.length > 2 && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-sm cursor-help">
                                      +{option.tags.length - 2}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="p-2 bg-card border border-border">
                                    <p className="text-xs font-medium mb-1 text-foreground">All tags:</p>
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                      {option.tags.map(tag => (
                                        <span key={tag} className="bg-background border border-muted-foreground/20 text-foreground text-[10px] px-1.5 py-0.5 rounded-sm">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
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
            <div className="rounded-lg border bg-card/50 p-4 mt-6">
              <h3 className="text-sm font-medium mb-3 text-foreground">Preview: {selectedStyle.name}</h3>
              <VisualStyleCarousel previewImages={selectedStyle.previewImages} selectedStyle={selectedStyle.id} />
            </div>
          )}
        </div>

        {/* Aspect Ratio Selection */}
        <div className="space-y-4">
          <h4 className="font-medium mb-2 text-foreground">Aspect Ratio</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            {aspectRatioData.options.map(ratio => (
              <Card
                key={ratio.id}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/50',
                  selectedAspectRatio === ratio.id && 'border-primary bg-primary/5'
                )}
                onClick={() => setSelectedAspectRatio(ratio.id)}
              >
                <CardContent className="p-3 text-center">
                  <h3 className="font-medium text-foreground">{ratio.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{ratio.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}