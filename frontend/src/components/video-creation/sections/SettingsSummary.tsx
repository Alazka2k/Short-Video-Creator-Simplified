'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import voiceData from '@/data/features/voices.json'
import { ContentState } from '../types'

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
  selectedVisualization: 'plain' | 'video' | 'animation'
  visualSettings: {
    artistStyle: string
    aspectRatio: string
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
  visualSettings
}: SettingsSummaryProps) {
  return (
    <Card className="bg-accent/5">
      <CardHeader>
        <CardTitle className="text-sm">Current Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <div className="font-medium mb-1">Basic Information</div>
          <div className="text-muted-foreground">
            Duration: {selectedDuration.label}
            {focus && <div>Focus: {focus}</div>}
          </div>
        </div>
        
        <div>
          <div className="font-medium mb-1">Content</div>
          <div className="flex flex-wrap gap-2">
            {selectedContent.voice && <Badge>Voice</Badge>}
            {selectedContent.visuals && (
              <>
                <Badge>Visuals</Badge>
                <Badge variant="outline">{selectedVisualization}</Badge>
              </>
            )}
            {selectedContent.music && <Badge>Music</Badge>}
          </div>
        </div>

        {Object.values(scriptParams).some(Boolean) && (
          <div>
            <div className="font-medium mb-1">Script Style</div>
            <div className="flex flex-wrap gap-2">
              {scriptParams.characterPerspective && (
                <Badge variant="outline">{scriptParams.characterPerspective}</Badge>
              )}
              {scriptParams.scriptTone && (
                <Badge variant="outline">{scriptParams.scriptTone}</Badge>
              )}
            </div>
          </div>
        )}

        {selectedContent.voice && selectedVoice && (
          <div>
            <div className="font-medium mb-1">Voice</div>
            <Badge variant="outline">
              {voiceData.voices.find(v => v.id === selectedVoice)?.name}
            </Badge>
          </div>
        )}

        {selectedContent.visuals && (
          <div>
            <div className="font-medium mb-1">Visual Style</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{visualSettings.artistStyle}</Badge>
              <Badge variant="outline">{visualSettings.aspectRatio}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 