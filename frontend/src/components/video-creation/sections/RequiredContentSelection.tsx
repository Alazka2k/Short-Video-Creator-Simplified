'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Mic, Music, Image } from 'lucide-react'
import { ContentState, VisualizationType } from '../types'

interface RequiredContentSelectionProps {
  selectedContent: ContentState
  setSelectedContent: React.Dispatch<React.SetStateAction<ContentState>>
  isGenerating: boolean
  selectedVisualization: VisualizationType
  setSelectedVisualization: React.Dispatch<React.SetStateAction<VisualizationType>>
}

export function RequiredContentSelection({
  selectedContent,
  setSelectedContent,
  isGenerating,
  selectedVisualization,
  setSelectedVisualization
}: RequiredContentSelectionProps) {

  useEffect(() => {
    if (selectedContent.visuals) {
      setSelectedVisualization('image')
    }
  }, [selectedContent.visuals, setSelectedVisualization])

  const handleVisualContentChange = () => {
    if (!isGenerating) {
      setSelectedContent(prev => {
        const newVisuals = !prev.visuals;
        if (newVisuals) {
          setSelectedVisualization('image');
        }
        return { ...prev, visuals: newVisuals };
      });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Content</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={cn(
          "cursor-pointer transition-colors",
          selectedContent.voice ? "border-primary" : "hover:border-primary/50"
        )}
        onClick={() => !isGenerating && setSelectedContent(prev => ({ ...prev, voice: !prev.voice }))}
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
          selectedContent.visuals ? "border-primary" : "hover:border-primary/50"
        )}
        onClick={handleVisualContentChange}
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
          selectedContent.music ? "border-primary" : "hover:border-primary/50"
        )}
        onClick={() => !isGenerating && setSelectedContent(prev => ({ ...prev, music: !prev.music }))}
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