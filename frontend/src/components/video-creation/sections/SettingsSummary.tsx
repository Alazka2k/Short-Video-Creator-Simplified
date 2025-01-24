'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Clock, Mic, Image as ImageIcon, Music, Settings2, Type, ChevronDown, ChevronUp } from 'lucide-react'
import voiceData from '@/data/features/voices.json'
import characterPerspectiveData from '@/data/video-creation/script/character-perspective_select-option.json'
import scriptToneData from '@/data/video-creation/script/script-tone_select-option.json'
import vocabularyData from '@/data/video-creation/script/vocabulary_select-option.json'
import pacingStructureData from '@/data/video-creation/script/pacing-structure_select-option.json'
import artistStyleData from '@/data/video-creation/image/artist-style_select-option.json'
import aspectRatioData from '@/data/video-creation/image/aspect-ratio_select-option.json'
import { ContentState } from '../types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SettingsSummaryProps {
  prompt: string
  focus?: string
  selectedDuration: {
    label: string
    value: number
    scenes: number
  }
  selectedContent: ContentState
  scriptParams: {
    characterPerspective: string
    pacingStructure: string
    scriptTone: string
    vocabulary: string
  }
  selectedVoice: string
  selectedVisualization: 'image' | 'video' | 'animation'
  visualSettings: {
    artistStyle: string
    aspectRatio: string
  }
  currentStep?: string
}

const visualizationNames = {
  image: 'Image',
  animation: '3D Effect',
  video: 'Video'
}

// Helper function to find option data from nested JSON structure
const findOptionData = (data: any, id: string) => {
  if (!id) return null
  for (const category of data.categories || []) {
    const option = category.options?.find((opt: any) => opt.id === id)
    if (option) return option
  }
  return data.options?.find((opt: any) => opt.id === id)
}

// Helper function to format setting display
const formatSettingDisplay = (option: any) => {
  if (!option) return null
  return {
    name: option.name,
    description: option.description,
    tags: option.tags?.join(' • ')
  }
}

export function SettingsSummary({ 
  prompt,
  focus,
  selectedDuration,
  selectedContent,
  scriptParams,
  selectedVoice,
  selectedVisualization,
  visualSettings,
  currentStep = 'basic'
}: SettingsSummaryProps) {
  // Format script settings data
  const characterPerspectiveDisplay = formatSettingDisplay(
    findOptionData(characterPerspectiveData, scriptParams.characterPerspective)
  )
  const scriptToneDisplay = formatSettingDisplay(
    findOptionData(scriptToneData, scriptParams.scriptTone)
  )
  const vocabularyDisplay = formatSettingDisplay(
    findOptionData(vocabularyData, scriptParams.vocabulary)
  )
  const pacingStructureDisplay = formatSettingDisplay(
    findOptionData(pacingStructureData, scriptParams.pacingStructure)
  )

  // Format visual settings data
  const artistStyleDisplay = formatSettingDisplay(
    findOptionData(artistStyleData, visualSettings.artistStyle)
  )
  const aspectRatioDisplay = findOptionData(aspectRatioData, visualSettings.aspectRatio)

  return (
    <TooltipProvider>
      <Card className="bg-card border-primary/20 shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Current Settings</CardTitle>
              <p className="text-sm text-muted-foreground">Your selected options and preferences</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-sm pt-6">
          {/* Basic Information */}
          <div className={cn(
            "space-y-3 rounded-lg transition-colors border",
            currentStep === 'basic' 
              ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20" 
              : "border-muted/50 bg-muted/5"
          )}>
            <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" />
                <div className="font-medium">Content Idea</div>
              </div>
              {currentStep === 'basic' && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  Current Tab
                </Badge>
              )}
            </div>
            <div className="pl-6 space-y-3">
              <div className="bg-accent/5 p-3 rounded-md">
                <div className="flex items-start gap-2">
                  <Type className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-muted-foreground line-clamp-4">
                    {prompt || 'No content idea provided yet...'}
                  </div>
                </div>
              </div>
              {focus && (
                <div className="bg-accent/5 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-muted-foreground line-clamp-2">
                      {focus}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground bg-accent/5 p-3 rounded-md">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{selectedDuration.label}</span>
                <span className="text-muted-foreground/60">•</span>
                <span className="text-muted-foreground/80">~{selectedDuration.scenes} scenes</span>
              </div>
            </div>
          </div>
          
          {/* Content Selection */}
          <div className={cn(
            "space-y-3 rounded-lg transition-colors border",
            currentStep === 'basic' 
              ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20" 
              : "border-muted/50 bg-muted/5"
          )}>
            <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <div className="font-medium">Selected Content</div>
              </div>
              {currentStep === 'basic' && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  Current Tab
                </Badge>
              )}
            </div>
            <div className="p-3">
              {!selectedContent.voice && !selectedContent.visuals && !selectedContent.music ? (
                <div className="text-sm text-muted-foreground italic">
                  No content types selected yet
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedContent.voice && (
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 flex items-center">
                      <Mic className="w-4 h-4 mr-2 text-primary" />
                      Voice
                    </Badge>
                  )}
                  {selectedContent.visuals && (
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2 text-primary" />
                      Visuals
                    </Badge>
                  )}
                  {selectedContent.music && (
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 flex items-center">
                      <Music className="w-4 h-4 mr-2 text-primary" />
                      Music
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Visualization Type - Only show if visuals are selected */}
          {selectedContent.visuals && (
            <div className={cn(
              "space-y-3 rounded-lg transition-colors border",
              currentStep === 'basic' 
                ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20" 
                : "border-muted/50 bg-muted/5"
            )}>
              <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <div className="font-medium">Visualization Type</div>
                </div>
                {currentStep === 'basic' && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    Current Tab
                  </Badge>
                )}
              </div>
              <div className="p-3">
                {!selectedVisualization ? (
                  <div className="text-sm text-yellow-500 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    Please select a visualization type
                  </div>
                ) : (
                  <Badge variant="outline" className="bg-primary/5 border-primary/20">
                    {visualizationNames[selectedVisualization]}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Script Style */}
          {Object.values(scriptParams).some(Boolean) && (
            <div className={cn(
              "space-y-3 rounded-lg transition-colors border",
              currentStep === 'script' 
                ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20" 
                : "border-muted/50 bg-muted/5"
            )}>
              <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div className="font-medium">Script Style</div>
                </div>
                {currentStep === 'script' && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    Current Tab
                  </Badge>
                )}
              </div>
              <div className="pl-6 space-y-2">
                {characterPerspectiveDisplay && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-primary/5 border-primary/20 cursor-help">
                        {characterPerspectiveDisplay.name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p className="font-medium">{characterPerspectiveDisplay.description}</p>
                      {characterPerspectiveDisplay.tags && (
                        <p className="text-xs text-muted-foreground mt-1">{characterPerspectiveDisplay.tags}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )}
                {scriptToneDisplay && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-primary/5 border-primary/20 cursor-help">
                        {scriptToneDisplay.name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p className="font-medium">{scriptToneDisplay.description}</p>
                      {scriptToneDisplay.tags && (
                        <p className="text-xs text-muted-foreground mt-1">{scriptToneDisplay.tags}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )}
                {vocabularyDisplay && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-primary/5 border-primary/20 cursor-help">
                        {vocabularyDisplay.name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p className="font-medium">{vocabularyDisplay.description}</p>
                      {vocabularyDisplay.tags && (
                        <p className="text-xs text-muted-foreground mt-1">{vocabularyDisplay.tags}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )}
                {pacingStructureDisplay && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-primary/5 border-primary/20 cursor-help">
                        {pacingStructureDisplay.name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p className="font-medium">{pacingStructureDisplay.description}</p>
                      {pacingStructureDisplay.tags && (
                        <p className="text-xs text-muted-foreground mt-1">{pacingStructureDisplay.tags}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )}

          {/* Voice Settings */}
          {selectedContent.voice && (
            <div className={cn(
              "space-y-3 rounded-lg transition-colors border",
              currentStep === 'voice' 
                ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20" 
                : "border-muted/50 bg-muted/5"
            )}>
              <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-primary" />
                  <div className="font-medium">Voice</div>
                </div>
                {currentStep === 'voice' && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    Current Tab
                  </Badge>
                )}
              </div>
              <div className="p-3">
                {!selectedVoice ? (
                  <div className="text-sm text-yellow-500 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    Please select a voice in the Voice Settings tab
                  </div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-primary/5 border-primary/20 cursor-help">
                        {voiceData.voices?.find(v => v.id === selectedVoice)?.name || selectedVoice}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{voiceData.voices?.find(v => v.id === selectedVoice)?.description || 'Voice description will be available soon'}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )}

          {/* Visual Settings */}
          {selectedContent.visuals && (
            <div className={cn(
              "space-y-3 rounded-lg transition-colors border",
              currentStep === 'visuals' 
                ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20" 
                : "border-muted/50 bg-muted/5"
            )}>
              <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <div className="font-medium">Visual Style</div>
                </div>
                {currentStep === 'visuals' && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    Current Tab
                  </Badge>
                )}
              </div>
              <div className="p-3">
                {!visualSettings.artistStyle ? (
                  <div className="text-sm text-yellow-500 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    Please select visual settings in the Visual Settings tab
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {artistStyleDisplay && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="bg-primary/5 border-primary/20 cursor-help">
                            {artistStyleDisplay.name}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{artistStyleDisplay.description}</p>
                          {artistStyleDisplay.tags && (
                            <p className="text-xs text-muted-foreground mt-1">{artistStyleDisplay.tags}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {aspectRatioDisplay && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="bg-primary/5 border-primary/20 cursor-help">
                            {aspectRatioDisplay.name}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{aspectRatioDisplay.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
} 