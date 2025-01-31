'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect, useId } from 'react'
import { VisualizationType, ContentState } from '@/components/video-creation/types'
import Select from '@/components/ui/select'
import { RequiredContentSelection } from '../sections/RequiredContentSelection'
import { VisualizationTypeSelection } from '../sections/VisualizationTypeSelection'

// Import example prompts
import promptExamples from '@/data/video-creation/basic/input-prompt.json'
import focusExamples from '@/data/video-creation/basic/focus-prompt.json'
import videoDurationData from '@/data/video-creation/basic/video-duration-prompt.json'

// Map duration options from the new format
export const durationOptions = videoDurationData.options.map(option => ({
  label: option.name,
  value: option.sceneAmount * 10,
  scenes: option.sceneAmount,
  description: option.description,
  lengthDescription: option.lengthDescription,
  serviceRestrictions: option.serviceRestrictions
}))

// Map duration options to the format expected by the Select component
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

interface BasicInformationStepProps {
  prompt: string
  setPrompt: (value: string) => void
  focus: string
  setFocus: (value: string) => void
  showFocusField: boolean
  setShowFocusField: (value: boolean) => void
  selectedDuration: typeof durationOptions[0] | null | undefined
  setSelectedDuration: (value: typeof durationOptions[0] | null | undefined) => void
  isGenerating: boolean
  hasVisualContent: boolean
  setHasVisualContent: (value: boolean) => void
  hasVoiceContent: boolean
  setHasVoiceContent: (value: boolean) => void
  hasMusicContent: boolean
  setHasMusicContent: (value: boolean) => void
  selectedVisualization: VisualizationType
  setSelectedVisualization: (value: VisualizationType) => void
}

export function BasicInformationStep({
  prompt,
  setPrompt,
  focus,
  setFocus,
  showFocusField,
  setShowFocusField,
  selectedDuration,
  setSelectedDuration,
  isGenerating,
  hasVisualContent,
  setHasVisualContent,
  hasVoiceContent,
  setHasVoiceContent,
  hasMusicContent,
  setHasMusicContent,
  selectedVisualization,
  setSelectedVisualization
}: BasicInformationStepProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isFocusFieldFocused, setIsFocusFieldFocused] = useState(false)
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0)
  const [currentFocusExampleIndex, setCurrentFocusExampleIndex] = useState(0)
  const promptId = useId()
  const focusId = useId()

  // Rotate through examples
  useEffect(() => {
    if (!isFocused && !prompt) {
      const interval = setInterval(() => {
        setCurrentExampleIndex((prev) => 
          (prev + 1) % promptExamples.examples.length
        )
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [isFocused, prompt])

  // Rotate through focus examples
  useEffect(() => {
    if (!isFocusFieldFocused && !focus && showFocusField) {
      const interval = setInterval(() => {
        setCurrentFocusExampleIndex((prev) => 
          (prev + 1) % focusExamples.examples.length
        )
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [isFocusFieldFocused, focus, showFocusField])

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
      
    // After setting duration, update content selection based on service restrictions
    if (option.serviceRestrictions?.length > 0) {
      const allowedServices = new Set(option.serviceRestrictions.map(s => s.toLowerCase()))
      
      // Disable voice if not allowed
      if (hasVoiceContent && !allowedServices.has('voice')) {
        setHasVoiceContent(false)
      }
      
      // Disable visuals if no visual service is allowed
      const hasVisualService = ['image', 'video', 'animation'].some(service => allowedServices.has(service))
      if (hasVisualContent && !hasVisualService) {
        setHasVisualContent(false)
        setSelectedVisualization('image')
      }
      
      // Disable music if not allowed
      if (hasMusicContent && !allowedServices.has('music')) {
        setHasMusicContent(false)
      }
    }
  }

  const handleContentChange = (content: ContentState) => {
    // Update each state based on the incoming content
    if (content.voice !== hasVoiceContent) {
      setHasVoiceContent(content.voice);
    }
    if (content.visuals !== hasVisualContent) {
      setHasVisualContent(content.visuals);
    }
    if (content.music !== hasMusicContent) {
      setHasMusicContent(content.music);
    }

    // If visuals are disabled, reset visualization type to image
    if (!content.visuals) {
      setSelectedVisualization('image');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="group relative mt-8 pt-2">
          <label
            htmlFor={promptId}
            className={cn(
              "absolute -top-7 left-0 z-20 origin-left text-lg font-semibold transition-all duration-300",
              prompt || isFocused
                ? "-translate-y-1.5 scale-90 text-foreground"
                : "text-muted-foreground"
            )}
          >
            Describe your video idea
          </label>
          <Textarea
            id={promptId}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-32 resize-none bg-background focus-visible:ring-0 focus-visible:ring-offset-0 border-input text-sm"
            disabled={isGenerating}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {!prompt && !isFocused && (
            <div className="absolute inset-[1px] pointer-events-none flex items-start p-3">
              <TextGenerateEffect
                words={promptExamples.examples[currentExampleIndex]}
                className="!m-0 !p-0 !text-sm !font-normal text-muted-foreground/50"
                duration={2}
              />
            </div>
          )}
        </div>
        <div className="relative pt-4">
          <Button
            variant="outline"
            onClick={() => setShowFocusField(!showFocusField)}
            disabled={isGenerating}
            className="border border-input hover:bg-accent hover:text-accent-foreground"
          >
            {showFocusField ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Hide Focus/Theme
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Add Focus/Theme
              </>
            )}
          </Button>
          {showFocusField && (
            <div className="mt-8 pt-2">
              <div className="group relative">
                <label
                  htmlFor={focusId}
                  className={cn(
                    "absolute -top-7 left-0 z-20 origin-left text-lg font-semibold transition-all duration-300",
                    focus || isFocusFieldFocused
                      ? "-translate-y-1.5 scale-90 text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  Focus/Theme
                </label>
                <Textarea
                  id={focusId}
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  className="h-20 resize-none bg-background focus-visible:ring-0 focus-visible:ring-offset-0 border-input text-sm"
                  disabled={isGenerating}
                  onFocus={() => setIsFocusFieldFocused(true)}
                  onBlur={() => setIsFocusFieldFocused(false)}
                />
                {!focus && !isFocusFieldFocused && (
                  <div className="absolute inset-[1px] pointer-events-none flex items-start p-3">
                    <TextGenerateEffect
                      words={focusExamples.examples[currentFocusExampleIndex]}
                      className="!m-0 !p-0 !text-sm !font-normal text-muted-foreground/50"
                      duration={2}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Video Duration</h2>
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

      <RequiredContentSelection
        selectedContent={{
          voice: hasVoiceContent,
          visuals: hasVisualContent,
          music: hasMusicContent
        }}
        setSelectedContent={handleContentChange}
        isGenerating={isGenerating}
        selectedVisualization={selectedVisualization}
        setSelectedVisualization={setSelectedVisualization}
        selectedDuration={selectedDuration}
      />

      {hasVisualContent && (
        <VisualizationTypeSelection
          selectedVisualization={selectedVisualization}
          setSelectedVisualization={setSelectedVisualization}
          isGenerating={isGenerating}
          selectedDuration={selectedDuration}
        />
      )}
    </div>
  )
} 