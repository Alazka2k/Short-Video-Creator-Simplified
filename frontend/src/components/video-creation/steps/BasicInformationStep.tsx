'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect, useId } from 'react'

// Import example prompts
import promptExamples from '@/data/video-creation/basic/input-prompt.json'
import focusExamples from '@/data/video-creation/basic/focus-prompt.json'

export const durationOptions = [
  // TODO: Remove this test option before go-live
  { label: 'Test (1 Scene)', value: 10, scenes: 1 },
  { label: '0-30 Seconds', value: 30, scenes: 5 },
  { label: '30-60 Seconds', value: 60, scenes: 9 },
  { label: 'Up to 90 Seconds', value: 90, scenes: 13 }
]

interface BasicInformationStepProps {
  prompt: string
  setPrompt: (value: string) => void
  focus: string
  setFocus: (value: string) => void
  showFocusField: boolean
  setShowFocusField: (value: boolean) => void
  selectedDuration: typeof durationOptions[0]
  setSelectedDuration: (value: typeof durationOptions[0]) => void
  isGenerating: boolean
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
  isGenerating
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
        <div className="flex gap-4">
          {durationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedDuration(option)}
              className={cn(
                "flex-1 p-4 rounded-lg border-2 transition-colors",
                selectedDuration.value === option.value
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-accent/5 hover:bg-accent/10"
              )}
              disabled={isGenerating}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-muted-foreground">
                ~{option.scenes} scenes
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 