'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { 
  Sparkles, 
  Video, 
  Image, 
  Mic, 
  ChevronRight,
  Loader2,
  Download,
  Settings,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import voiceData from '@/data/features/voices.json'
import visualConfig from '@/data/features/visual-creation.json'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useVideoCreationState } from '@/lib/hooks/useVideoCreationState'
import { useToast } from '@/components/ui/use-toast'

// Import step components
import { BasicInformationStep, durationOptions } from './steps/BasicInformationStep'
import { VoiceSettingsStep } from './steps/VoiceSettingsStep'
import { VisualSettingsStep } from './steps/VisualSettingsStep'
import { ScriptSettingsStep } from './steps/ScriptSettingsStep'

// Import new components
import { SettingsSummary } from './sections/SettingsSummary'
import { RequiredContentSelection } from './sections/RequiredContentSelection'
import { VisualizationTypeSelection } from './sections/VisualizationTypeSelection'
import { ProcessSteps } from './sections/ProcessSteps'

// Import types
import { ContentState, ScriptParams, RequestParams, VisualizationType } from './types'

interface VideoCreationFlowProps {
  mode: 'quick' | 'normal' | 'demo'
  onSubmit?: (data: any) => void
  defaultValues?: any
  isDemo?: boolean
}

const STEPS = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Video details and content',
    icon: Video
  },
  {
    id: 'script',
    title: 'Script Settings',
    description: 'Style and tone',
    icon: Sparkles
  },
  {
    id: 'voice',
    title: 'Voice Settings',
    description: 'Voice and audio',
    icon: Mic
  },
  {
    id: 'visuals',
    title: 'Visual Settings',
    description: 'Look and feel',
    icon: Image
  }
]

interface State {
  currentStep: number
  prompt: string
  focus: string
  selectedDuration: typeof durationOptions[0] | null | undefined
  selectedContent: ContentState
  selectedVoice: string
  selectedVisualization: VisualizationType
  visualSettings: any
  scriptParams: ScriptParams
  showFocusField: boolean
}

export function VideoCreationFlow({ 
  mode, 
  onSubmit, 
  defaultValues,
  isDemo = false 
}: VideoCreationFlowProps) {
  const router = useRouter()
  const { state, updateState, handleGenerateVideo, handleCreateProject, isGenerating } = useVideoCreationState(defaultValues)
  const { toast } = useToast()

  // Destructure state for easier access
  const {
    currentStep,
    prompt,
    focus,
    selectedDuration,
    selectedContent,
    selectedVoice,
    selectedVisualization,
    visualSettings,
    scriptParams,
    showFocusField
  } = state

  // Update functions with proper typing
  const setCurrentStep = useCallback((step: number) => updateState({ currentStep: step }), [updateState])
  const setPrompt = useCallback((value: string) => updateState({ prompt: value }), [updateState])
  const setFocus = useCallback((value: string) => updateState({ focus: value }), [updateState])
  const setSelectedDuration = useCallback((value: typeof durationOptions[0] | null | undefined) => updateState({ selectedDuration: value }), [updateState])
  
  const setSelectedContent = useCallback((value: ContentState | ((prev: ContentState) => ContentState)) => {
    if (typeof value === 'function') {
      updateState({ selectedContent: value(selectedContent) })
    } else {
      updateState({ selectedContent: value })
    }
  }, [updateState, selectedContent])

  const setSelectedVoice = useCallback((value: string) => updateState({ selectedVoice: value }), [updateState])
  
  const setSelectedVisualization = useCallback((value: VisualizationType | ((prev: VisualizationType) => VisualizationType)) => {
    if (typeof value === 'function') {
      updateState({ selectedVisualization: value(selectedVisualization) })
    } else {
      updateState({ selectedVisualization: value })
    }
  }, [updateState, selectedVisualization])

  const setVisualSettings = useCallback((value: typeof visualSettings | ((prev: typeof visualSettings) => typeof visualSettings)) => {
    if (typeof value === 'function') {
      updateState({ visualSettings: value(visualSettings) })
    } else {
      updateState({ visualSettings: value })
    }
  }, [updateState, visualSettings])

  const setScriptParams = useCallback((value: ScriptParams | ((prev: ScriptParams) => ScriptParams)) => {
    if (typeof value === 'function') {
      updateState({ scriptParams: value(scriptParams) })
    } else {
      updateState({ scriptParams: value })
    }
  }, [updateState, scriptParams])

  const setShowFocusField = useCallback((value: boolean) => updateState({ showFocusField: value }), [updateState])

  const getDurationDescription = (duration: typeof durationOptions[0]): string => {
    switch(duration.value) {
      case 30:
        return "30 seconds optimized for social media, with first 3 seconds containing the hook"
      case 60:
        return "50-60 seconds optimized for YouTube Shorts, with first 3 seconds containing the hook"
      case 90:
        return "90 seconds optimized for TikTok, with first 3 seconds containing the hook"
      default:
        return `${duration.value} seconds with first 3 seconds containing the hook`
    }
  }

  // Helper function to invert aspect ratio (e.g., "9:16" -> "16:9")
  const invertAspectRatio = (ratio: string): string => {
    const [width, height] = ratio.split(':')
    return `${height}:${width}`
  }

  const onCreateProject = async () => {
    try {
      const jobId = await handleCreateProject()
      toast({
        title: "Content Creation Started",
        description: `Job ID: ${jobId}. You can check the status in the Content Workbench.`,
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create content",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const onGenerateVideo = async () => {
    try {
      const jobId = await handleGenerateVideo()
      toast({
        title: "Content Creation Started",
        description: `Job ID: ${jobId}. You can check the status in the Content Workbench.`,
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const renderStepContent = (stepId: string) => {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr,320px] px-4">
        {/* Main content area */}
        <div className="space-y-8 min-h-0">
          {stepId === 'basic' && (
            <div className="space-y-8 overflow-visible pb-8">
              <BasicInformationStep
                prompt={prompt}
                setPrompt={setPrompt}
                focus={focus}
                setFocus={setFocus}
                showFocusField={showFocusField}
                setShowFocusField={setShowFocusField}
                selectedDuration={selectedDuration}
                setSelectedDuration={setSelectedDuration}
                isGenerating={isGenerating}
                hasVisualContent={selectedContent.visuals}
                setHasVisualContent={(value) => setSelectedContent(prev => ({ ...prev, visuals: value }))}
                hasVoiceContent={selectedContent.voice}
                setHasVoiceContent={(value) => setSelectedContent(prev => ({ ...prev, voice: value }))}
                hasMusicContent={selectedContent.music}
                setHasMusicContent={(value) => setSelectedContent(prev => ({ ...prev, music: value }))}
                selectedVisualization={selectedVisualization}
                setSelectedVisualization={setSelectedVisualization}
              />
            </div>
          )}

          {stepId === 'script' && (
            <ScriptSettingsStep
              scriptParams={scriptParams}
              setScriptParams={setScriptParams}
              isGenerating={isGenerating}
            />
          )}

          {stepId === 'voice' && selectedContent.voice && (
            <VoiceSettingsStep
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              isGenerating={isGenerating}
            />
          )}

          {stepId === 'visuals' && selectedContent.visuals && (
            <VisualSettingsStep
              visualSettings={visualSettings}
              setVisualSettings={setVisualSettings}
              selectedVisualization={selectedVisualization}
              isGenerating={isGenerating}
            />
          )}
        </div>

        {/* Settings summary - Now sticky */}
        <div className="lg:sticky lg:top-8 space-y-8">
          <SettingsSummary 
            prompt={prompt}
            focus={focus}
            selectedDuration={selectedDuration}
            selectedContent={selectedContent}
            scriptParams={scriptParams}
            selectedVoice={selectedVoice}
            selectedVisualization={selectedVisualization}
            visualSettings={visualSettings}
            currentStep={stepId}
          />
        </div>
      </div>
    )
  }

  const activeSteps = STEPS.filter(step => {
    if (step.id === 'voice') return selectedContent.voice
    if (step.id === 'visuals') return selectedContent.visuals
    return true
  })

  // Add validation check for Create Content button
  const canCreateContent = useMemo(() => {
    return (
      prompt.trim() !== '' && // Has prompt
      selectedDuration && // Has duration selected
      selectedContent && // Has content type selected
      (selectedContent.voice ? selectedVoice !== '' : true) && // Has voice if voice is selected
      (selectedContent.visuals ? visualSettings.aspectRatio !== '' : true) && // Has aspect ratio if visuals selected
      !isGenerating // Not currently generating
    )
  }, [prompt, selectedDuration, selectedContent, selectedVoice, visualSettings, isGenerating])

  if (mode === 'quick') {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Quick Create</h2>
            <p className="text-muted-foreground mt-1">Create a video in just a few steps</p>
          </div>
            <Button
              variant="outline"
            onClick={() => router.push('/create')}
            className="gap-2"
            >
            <Settings className="w-4 h-4" />
              Advanced Mode
            </Button>
        </div>

        {/* Quick creation content */}
        <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
          <div className="space-y-8">
            <BasicInformationStep
              prompt={prompt}
              setPrompt={setPrompt}
              focus={focus}
              setFocus={setFocus}
              showFocusField={showFocusField}
              setShowFocusField={setShowFocusField}
              selectedDuration={selectedDuration}
              setSelectedDuration={setSelectedDuration}
              isGenerating={isGenerating}
              hasVisualContent={selectedContent.visuals}
              setHasVisualContent={(value) => setSelectedContent(prev => ({ ...prev, visuals: value }))}
              hasVoiceContent={selectedContent.voice}
              setHasVoiceContent={(value) => setSelectedContent(prev => ({ ...prev, voice: value }))}
              hasMusicContent={selectedContent.music}
              setHasMusicContent={(value) => setSelectedContent(prev => ({ ...prev, music: value }))}
              selectedVisualization={selectedVisualization}
              setSelectedVisualization={setSelectedVisualization}
            />
          </div>

          {/* Settings summary - Sticky */}
          <div className="lg:sticky lg:top-8 space-y-8">
            <SettingsSummary 
              prompt={prompt}
              focus={focus}
              selectedDuration={selectedDuration}
              selectedContent={selectedContent}
              scriptParams={scriptParams}
              selectedVoice={selectedVoice}
              selectedVisualization={selectedVisualization}
              visualSettings={visualSettings}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCreateProject}
            disabled={!prompt.trim() || isGenerating}
          >
            <Download className="w-4 h-4 mr-2" />
            Save as Project
          </Button>
          <Button
            className="flex-1"
            onClick={onGenerateVideo}
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Video
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Create Button */}
      <div className="flex flex-col items-center gap-4 pb-6 border-b">
        <div className="relative">
          <Button
            onClick={onGenerateVideo}
            disabled={!canCreateContent}
            className={cn(
              "relative px-16 py-6 w-[600px] z-10",
              "bg-gradient-to-r from-background via-accent/5 to-background",
              "dark:from-slate-900 dark:via-slate-800 dark:to-slate-900",
              "hover:from-accent/5 hover:via-accent/10 hover:to-accent/5",
              "dark:hover:from-slate-800 dark:hover:via-slate-700 dark:hover:to-slate-800",
              "transition-all duration-300",
              "shadow-lg hover:shadow-xl",
              "border border-border/50",
              !canCreateContent && "opacity-50 cursor-not-allowed hover:from-background hover:via-accent/5 hover:to-background dark:hover:from-slate-900 dark:hover:via-slate-800 dark:hover:to-slate-900"
            )}
            size="lg"
          >
            <div className="relative flex items-center justify-center gap-3">
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-lg font-medium text-primary">Creating Content...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-lg font-medium text-primary">Create Content</span>
                </>
              )}
            </div>
          </Button>
          <div className="absolute inset-[-2px] -z-10 rounded-lg overflow-hidden">
            <HoverBorderGradient
              as="div"
              containerClassName="w-full h-full"
              className={cn(
                "bg-transparent transition-opacity duration-300",
                !canCreateContent && "opacity-30"
              )}
              duration={3}
            />
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <ProcessSteps
        steps={activeSteps}
        currentStep={currentStep}
        onChange={(value) => {
          const newIndex = STEPS.findIndex(step => step.id === value)
          if (newIndex !== -1 && activeSteps.some(step => step.id === STEPS[newIndex].id)) {
            setCurrentStep(newIndex)
          }
        }}
        isGenerating={isGenerating}
      />

      {/* Content */}
      <ScrollArea className="min-h-[600px]">
        <div className="animate-in slide-in-from-right duration-500">
          {renderStepContent(STEPS[currentStep].id)}
        </div>
      </ScrollArea>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 0 || isGenerating}
          className="relative group"
        >
          <div className="relative flex items-center gap-2">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{STEPS[currentStep - 1]?.title || 'Previous'}</span>
          </div>
        </Button>

        {currentStep < STEPS.length - 1 && (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={isGenerating}
            className="relative group"
          >
            <div className="relative flex items-center gap-2">
              <span>{STEPS[currentStep + 1]?.title || 'Next'}</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Button>
        )}
      </div>
    </div>
  )
} 