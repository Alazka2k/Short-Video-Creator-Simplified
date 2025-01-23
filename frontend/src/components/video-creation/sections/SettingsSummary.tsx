'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Clock, Mic, Image as ImageIcon, Music, Settings2, Type, ChevronDown, ChevronUp } from 'lucide-react'
import voiceData from '@/data/features/voices.json'
import { ContentState } from '../types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import React from 'react'

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
  return (
    <Card className="bg-card border-muted">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-blue-500" />
          <CardTitle className="text-sm">Current Settings</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        {/* Basic Information */}
        <div className={cn(
          "space-y-3 rounded-lg transition-colors",
          currentStep === 'basic' && "bg-blue-500/5 p-4 -mx-4"
        )}>
          <div className="flex items-center gap-2 text-blue-500">
            <Type className="w-4 h-4" />
            <div className="font-medium">Content Idea</div>
          </div>
          <div className="pl-6 space-y-2">
            <div className="text-muted-foreground line-clamp-3 bg-accent/5 p-3 rounded-md">
              {prompt || 'No content idea provided yet...'}
            </div>
            {focus && (
              <div className="text-muted-foreground bg-accent/5 p-3 rounded-md">
                Focus: {focus}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{selectedDuration.label} (~{selectedDuration.scenes} scenes)</span>
            </div>
          </div>
        </div>
        
        {/* Content Selection */}
        <div className={cn(
          "space-y-3 rounded-lg transition-colors",
          currentStep === 'basic' && "bg-blue-500/5 p-4 -mx-4"
        )}>
          <div className="flex items-center gap-2 text-blue-500">
            <Sparkles className="w-4 h-4" />
            <div className="font-medium">Selected Content</div>
          </div>
          <div className="pl-6 flex flex-wrap gap-2">
            {selectedContent.voice && (
              <Badge variant="outline" className="bg-blue-500/5 border-blue-500/20 flex items-center">
                <Mic className="w-4 h-4 mr-2 text-blue-500" />
                Voice
              </Badge>
            )}
            {selectedContent.visuals && (
              <Badge variant="outline" className="bg-blue-500/5 border-blue-500/20 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2 text-blue-500" />
                Visuals
              </Badge>
            )}
            {selectedContent.music && (
              <Badge variant="outline" className="bg-blue-500/5 border-blue-500/20 flex items-center">
                <Music className="w-4 h-4 mr-2 text-blue-500" />
                Music
              </Badge>
            )}
          </div>
        </div>

        {/* Visualization Type - Only show if visuals are selected */}
        {selectedContent.visuals && (
          <div className={cn(
            "space-y-3 rounded-lg transition-colors",
            currentStep === 'basic' && "bg-blue-500/5 p-4 -mx-4"
          )}>
            <div className="flex items-center gap-2 text-blue-500">
              <ImageIcon className="w-4 h-4" />
              <div className="font-medium">Visualization Type</div>
            </div>
            <div className="pl-6">
              <Badge variant="outline" className="bg-accent/10">
                {visualizationNames[selectedVisualization]}
              </Badge>
            </div>
          </div>
        )}

        {/* Script Style */}
        {Object.values(scriptParams).some(Boolean) && (
          <div className={cn(
            "space-y-3 rounded-lg transition-colors",
            currentStep === 'script' && "bg-blue-500/5 p-4 -mx-4"
          )}>
            <div className="flex items-center gap-2 text-blue-500">
              <Sparkles className="w-4 h-4" />
              <div className="font-medium">Script Style</div>
            </div>
            <div className="pl-6 space-y-2">
              {scriptParams.characterPerspective && (
                <Badge variant="outline" className="bg-accent/10">
                  {scriptParams.characterPerspective}
                </Badge>
              )}
              {scriptParams.scriptTone && (
                <Badge variant="outline" className="bg-accent/10">
                  {scriptParams.scriptTone}
                </Badge>
              )}
              {scriptParams.vocabulary && (
                <Badge variant="outline" className="bg-accent/10">
                  {scriptParams.vocabulary}
                </Badge>
              )}
              {scriptParams.pacingStructure && (
                <Badge variant="outline" className="bg-accent/10">
                  {scriptParams.pacingStructure}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Voice Settings */}
        {selectedContent.voice && selectedVoice && (
          <div className={cn(
            "space-y-3 rounded-lg transition-colors",
            currentStep === 'voice' && "bg-blue-500/5 p-4 -mx-4"
          )}>
            <div className="flex items-center gap-2 text-blue-500">
              <Mic className="w-4 h-4" />
              <div className="font-medium">Voice</div>
            </div>
            <div className="pl-6">
              <Badge variant="outline" className="bg-accent/10">
                {voiceData.voices.find(v => v.id === selectedVoice)?.name}
              </Badge>
            </div>
          </div>
        )}

        {/* Visual Settings */}
        {selectedContent.visuals && (
          <div className={cn(
            "space-y-3 rounded-lg transition-colors",
            currentStep === 'visuals' && "bg-blue-500/5 p-4 -mx-4"
          )}>
            <div className="flex items-center gap-2 text-blue-500">
              <ImageIcon className="w-4 h-4" />
              <div className="font-medium">Visual Style</div>
            </div>
            <div className="pl-6 flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-accent/10">
                {visualSettings.artistStyle}
              </Badge>
              <Badge variant="outline" className="bg-accent/10">
                {visualSettings.aspectRatio}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 