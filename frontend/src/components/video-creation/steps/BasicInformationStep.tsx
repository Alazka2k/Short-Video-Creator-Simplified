'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Textarea
          placeholder="Describe your video idea..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-32"
          disabled={isGenerating}
        />
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs flex items-center gap-1"
            onClick={() => {
              setShowFocusField(!showFocusField)
              if (!showFocusField) setFocus('')
            }}
          >
            {showFocusField ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Hide Focus/Theme
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Add Focus/Theme
              </>
            )}
          </Button>
          {showFocusField && (
            <div className="mt-2">
              <Textarea
                placeholder="Any specific focus or theme for your video..."
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="h-20"
                disabled={isGenerating}
              />
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