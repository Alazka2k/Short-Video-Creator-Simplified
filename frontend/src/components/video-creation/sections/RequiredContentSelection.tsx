'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Mic, Music, Image } from 'lucide-react'
import { ContentState, VisualizationType } from '../types'

interface RequiredContentSelectionProps {
  selectedContent: ContentState
  setSelectedContent: (content: ContentState) => void
  isGenerating: boolean
  selectedVisualization: VisualizationType
  setSelectedVisualization: (value: VisualizationType) => void
  selectedDuration?: {
    serviceRestrictions?: string[]
  } | null
}

export function RequiredContentSelection({
  selectedContent,
  setSelectedContent,
  isGenerating,
  selectedVisualization,
  setSelectedVisualization,
  selectedDuration
}: RequiredContentSelectionProps) {

  const isServiceAllowed = (service: string) => {
    if (!selectedDuration?.serviceRestrictions) return true;
    
    const restrictions = selectedDuration.serviceRestrictions.map(r => r.toLowerCase());
    
    // For visual content, check if any visual type is allowed
    if (service === 'visuals') {
      return restrictions.some(r => 
        ['image', 'video', 'animation'].includes(r)
      );
    }
    
    return restrictions.includes(service.toLowerCase());
  }

  const handleVisualContentChange = () => {
    const isAllowed = isServiceAllowed('visuals');
    if (!isGenerating && isAllowed) {
      const newVisuals = !selectedContent.visuals;
      setSelectedContent({
        ...selectedContent,
        visuals: newVisuals
      });
      
      // If disabling visuals, reset visualization type
      if (!newVisuals) {
        setSelectedVisualization('image');
      }
    }
  }

  const handleVoiceContentChange = () => {
    const isAllowed = isServiceAllowed('voice');
    if (!isGenerating && isAllowed) {
      setSelectedContent({
        ...selectedContent,
        voice: !selectedContent.voice
      });
    }
  }

  const handleMusicContentChange = () => {
    const isAllowed = isServiceAllowed('music');
    if (!isGenerating && isAllowed) {
      setSelectedContent({
        ...selectedContent,
        music: !selectedContent.music
      });
    }
  }

  // Remove monitoring effect
  useEffect(() => {}, [selectedContent]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Content</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={cn(
          "cursor-pointer transition-colors",
          selectedContent.voice ? "border-primary" : "hover:border-primary/50",
          !isServiceAllowed('voice') && "opacity-50 cursor-not-allowed"
        )}
        onClick={(e) => {
          e.preventDefault();
          handleVoiceContentChange();
        }}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <Mic className={cn(
              "w-8 h-8",
              selectedContent.voice ? "text-primary" : "text-muted-foreground"
            )} />
            <div>
              <div className="font-medium">Voice Narration</div>
              <div className="text-sm text-muted-foreground">AI-powered voiceover</div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "cursor-pointer transition-colors",
          selectedContent.visuals ? "border-primary" : "hover:border-primary/50",
          !isServiceAllowed('visuals') && "opacity-50 cursor-not-allowed"
        )}
        onClick={(e) => {
          e.preventDefault();
          handleVisualContentChange();
        }}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <Image className={cn(
              "w-8 h-8",
              selectedContent.visuals ? "text-primary" : "text-muted-foreground"
            )} />
            <div>
              <div className="font-medium">Visual Content</div>
              <div className="text-sm text-muted-foreground">AI-generated visuals</div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "cursor-pointer transition-colors",
          selectedContent.music ? "border-primary" : "hover:border-primary/50",
          !isServiceAllowed('music') && "opacity-50 cursor-not-allowed"
        )}
        onClick={(e) => {
          e.preventDefault();
          handleMusicContentChange();
        }}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <Music className={cn(
              "w-8 h-8",
              selectedContent.music ? "text-primary" : "text-muted-foreground"
            )} />
            <div>
              <div className="font-medium">Background Music</div>
              <div className="text-sm text-muted-foreground">AI-generated music</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 