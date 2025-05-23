'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Sparkles, Video, Music, Image, Mic, Check } from 'lucide-react'
import Select from '@/components/ui/select'
import videoDurationData from '@/data/video-creation/basic/video-duration-prompt.json'
import { Card, CardContent } from '@/components/ui/card'

// Map duration options from the new format (mimic real flow)
const durationOptions = videoDurationData.options.map(option => ({
  label: option.name,
  value: option.sceneAmount * 10,
  scenes: option.sceneAmount,
  description: option.description,
  lengthDescription: option.lengthDescription,
  icon: option.icon
}))

const durationSelectOptions = videoDurationData.options.map(option => ({
  id: option.name,
  label: option.name,
  value: String(option.sceneAmount * 10),
  description: option.description,
  custom: option.icon ? (
    <div className="flex h-12 w-12 items-center justify-center">
      <img src={option.icon} alt={option.name} className="w-8 h-8 object-contain" />
    </div>
  ) : (
    <div className="flex h-12 w-12 items-center justify-center">
      <span className="text-xl">⏱️</span>
    </div>
  )
}))

export function ContentGenerationDemo() {
  const [showFocusField, setShowFocusField] = useState(false)
  const [focus, setFocus] = useState("")
  const [selectedContent, setSelectedContent] = useState({
    voice: true,
    music: true,
    visuals: true
  })
  const [selectedVisualization, setSelectedVisualization] = useState<'plain' | 'video' | 'animation'>('plain')
  const [selectedDuration, setSelectedDuration] = useState<typeof durationOptions[0] | undefined>(durationOptions[0])

  // Handler for Select component
  const handleDurationChange = (value: string | null) => {
    if (!value) {
      setSelectedDuration(undefined)
      return
    }
    const option = durationOptions.find(opt => String(opt.value) === value)
    if (!option) {
      setSelectedDuration(undefined)
      return
    }
    setSelectedDuration(option)
  }

  // Handler for content selection
  const handleContentChange = (key: 'voice' | 'music' | 'visuals') => {
    setSelectedContent(prev => {
      const newState = { ...prev, [key]: !prev[key] }
      // If visuals are disabled, reset visualization type
      if (key === 'visuals' && !newState.visuals) {
        setSelectedVisualization('plain')
      }
      return newState
    })
  }

  return (
    <div className="space-y-6 min-h-[400px]">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-accent/5">
          <h4 className="font-medium mb-2">Video Idea</h4>
          <Textarea 
            placeholder="Describe your video idea..."
            defaultValue="Top 5 history moments"
            className="h-32 bg-transparent border-none text-sm text-muted-foreground focus:outline-none"
          />
          {!showFocusField && (
            <Button
              variant="ghost"
              className="text-xs mt-2"
              onClick={() => setShowFocusField(true)}
            >
              + Add Focus/Theme
            </Button>
          )}
          {showFocusField && (
            <Textarea
              placeholder="Any specific focus or theme for your video..."
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="h-20 mt-4"
            />
          )}
        </div>

        {/* Duration Selection */}
        <div className="space-y-4">
          <h4 className="font-medium">Video Duration</h4>
          <div className="w-full">
            <Select
              data={durationSelectOptions}
              value={selectedDuration ? String(selectedDuration.value) : undefined}
              onChange={handleDurationChange}
              title="Choose Duration"
              allowDeselect={true}
              className="!rounded-lg border-input hover:border-primary/50 [&.border-purple-500\/50]:border-primary [&.bg-purple-500\/5]:bg-primary/5"
            />
          </div>
        </div>
      </div>

      {/* Service Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Content</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card
            className={cn(
              'cursor-pointer transition-colors',
              selectedContent.voice ? 'border-primary' : 'hover:border-primary/50'
            )}
            onClick={() => handleContentChange('voice')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <Mic className={cn('w-8 h-8', selectedContent.voice ? 'text-primary' : 'text-muted-foreground')} />
              <div>
                <div className="font-medium">Voice Narration</div>
                <div className="text-sm text-muted-foreground">AI-powered voiceover</div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={cn(
              'cursor-pointer transition-colors',
              selectedContent.visuals ? 'border-primary' : 'hover:border-primary/50'
            )}
            onClick={() => handleContentChange('visuals')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <Image className={cn('w-8 h-8', selectedContent.visuals ? 'text-primary' : 'text-muted-foreground')} />
              <div>
                <div className="font-medium">Visual Content</div>
                <div className="text-sm text-muted-foreground">AI-generated visuals</div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={cn(
              'cursor-pointer transition-colors',
              selectedContent.music ? 'border-primary' : 'hover:border-primary/50'
            )}
            onClick={() => handleContentChange('music')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <Music className={cn('w-8 h-8', selectedContent.music ? 'text-primary' : 'text-muted-foreground')} />
              <div>
                <div className="font-medium">Background Music</div>
                <div className="text-sm text-muted-foreground">AI-generated music</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualization Options */}
        {selectedContent.visuals && (
          <div className="space-y-4">
            <h4 className="font-medium mb-3">Visualization Type</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card
                className={cn(
                  selectedVisualization === 'plain' ? 'border-primary' : 'hover:border-primary/50'
                )}
                onClick={() => setSelectedVisualization('plain')}
              >
                <CardContent className="flex flex-col items-center p-4">
                  <Image className="w-6 h-6 mb-2 text-primary" />
                  <div className="font-medium">Image</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">Static images for each scene</div>
                </CardContent>
              </Card>
              <Card
                className={cn(
                  selectedVisualization === 'video' ? 'border-primary' : 'hover:border-primary/50'
                )}
                onClick={() => setSelectedVisualization('video')}
              >
                <CardContent className="flex flex-col items-center p-4">
                  <Video className="w-6 h-6 mb-2 text-primary" />
                  <div className="font-medium">Video</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">Dynamic video sequences</div>
                </CardContent>
              </Card>
              <Card
                className={cn(
                  selectedVisualization === 'animation' ? 'border-primary' : 'hover:border-primary/50'
                )}
                onClick={() => setSelectedVisualization('animation')}
              >
                <CardContent className="flex flex-col items-center p-4">
                  <Sparkles className="w-6 h-6 mb-2 text-primary" />
                  <div className="font-medium">Animation</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">Animated effects & transitions</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Generating content...</span>
          <span className="text-primary">80%</span>
        </div>
        <div className="h-2 bg-accent/10 rounded-full overflow-hidden">
          <div 
            className="h-full w-4/5 bg-gradient-to-r from-primary to-accent transition-all duration-500"
          />
        </div>
      </div>
    </div>
  )
} 