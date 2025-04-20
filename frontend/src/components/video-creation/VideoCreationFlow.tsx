'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
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
  renderActionButton?: (
    onClick: () => void, 
    isDisabled: boolean, 
    isGenerating: boolean, 
    jobProgress: any,
    validationData?: {
      prompt: string;
      selectedDuration: any;
      selectedContent: ContentState;
      selectedVoice: string;
      visualSettings: any;
    }
  ) => React.ReactNode
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

function debugLog(message: string, data?: any, isImportant = false) {
  if (typeof window !== 'undefined' && window.__debugCreatePage && isImportant) {
    console.log(`[VideoCreationFlow] ${message}`, data || '');
  }
}

export function VideoCreationFlow({ 
  mode, 
  onSubmit, 
  defaultValues,
  isDemo = false,
  renderActionButton
}: VideoCreationFlowProps) {
  const router = useRouter()
  const { 
    state, 
    updateState, 
    handleGenerateVideo, 
    handleCreateProject, 
    isGenerating, 
    jobProgress 
  } = useVideoCreationState(defaultValues)
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

  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  
  // Add this ref before the canCreateContent useMemo
  const prevValidRef = useRef(false);

  // Replace original canCreateContent with a more robust implementation
  const canCreateContent = useMemo(() => {
    const hasPrompt = prompt && prompt.trim() !== '';
    const hasDuration = !!selectedDuration;
    const hasAnyContentSelected = selectedContent.voice === true || 
                                 selectedContent.visuals === true || 
                                 selectedContent.music === true;
    const hasVoiceIfNeeded = !selectedContent.voice || (selectedContent.voice && selectedVoice !== '');
    const hasVisualsIfNeeded = !selectedContent.visuals || (
      selectedContent.visuals && 
      visualSettings.aspectRatio && 
      visualSettings.shotStyle
    );
    
    const isValid = hasPrompt && hasDuration && hasAnyContentSelected && hasVoiceIfNeeded && hasVisualsIfNeeded && !isGenerating;
    
    // Only log validation state changes
    if (isValid !== prevValidRef.current) {
      debugLog('Validation state changed:', {
        hasPrompt,
        hasDuration,
        hasAnyContentSelected,
        hasVoiceIfNeeded,
        hasVisualsIfNeeded,
        isGenerating,
        isValid
      }, true);
      prevValidRef.current = Boolean(isValid);
    }
    
    return isValid;
  }, [prompt, selectedDuration, selectedContent, selectedVoice, visualSettings, isGenerating]);
  
  // Expose the button click handler to window object for external access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - Adding a custom property to the window object
      window.__videoCreationTrigger = () => {
        if (triggerButtonRef.current) {
          debugLog('Video creation trigger called, can create content:', canCreateContent, true);
          if (canCreateContent) {
            triggerButtonRef.current.click();
          } else {
            debugLog('Cannot create content - validation failed', null, true);
          }
        }
      };
      
      return () => {
        // @ts-ignore - Cleanup
        delete window.__videoCreationTrigger;
      };
    }
  }, [canCreateContent]);
  
  // Keep track of previous validation data to avoid unnecessary parent updates
  const prevValidationDataRef = useRef({
    prompt,
    selectedDuration,
    selectedContent,
    selectedVoice,
    visualSettings
  });
  
  // Update parent component with current validation state whenever it changes
  useEffect(() => {
    // Prepare validation data for parent component
    const validationDataForParent = {
      prompt,
      selectedDuration,
      selectedContent,
      selectedVoice,
      visualSettings
    };
    
    // Only update parent if validation data actually changed
    const hasChanged = JSON.stringify(prevValidationDataRef.current) !== JSON.stringify(validationDataForParent);
    
    // Call renderActionButton if provided to update parent state
    if (renderActionButton && hasChanged) {
      // Only log when debugging is explicitly enabled
      if (typeof window !== 'undefined' && window.__debugCreatePage) {
        console.log('Updating parent with validation data:', validationDataForParent);
      }
      
      renderActionButton(
        onGenerateVideo,
        !canCreateContent,
        isGenerating,
        jobProgress,
        validationDataForParent
      );
      
      // Update ref with current values
      prevValidationDataRef.current = validationDataForParent;
    }
  }, [
    renderActionButton, 
    onGenerateVideo, 
    canCreateContent, 
    isGenerating, 
    jobProgress, 
    prompt, 
    selectedDuration, 
    selectedContent, 
    selectedVoice, 
    visualSettings
  ]);

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
            {isGenerating || jobProgress.status === 'polling' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {jobProgress.status === 'polling' 
                  ? `Creating Video... ${jobProgress.progress}%` 
                  : 'Preparing Job...'}
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
      {/* Replace the conditional renderActionButton call with a simpler approach */}
      {!renderActionButton && (
        <div className="flex flex-col items-center gap-4 pb-6 border-b">
          <Button
            onClick={onGenerateVideo}
            disabled={!canCreateContent}
            className={cn(
              "gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 px-8",
              "w-auto md:w-auto lg:w-auto",
              !canCreateContent && "opacity-70"
            )}
            size="lg"
          >
            {isGenerating || jobProgress.status === 'polling' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {jobProgress.status === 'polling' 
                  ? `Creating Content... ${jobProgress.progress}%` 
                  : 'Preparing Content...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Content
              </>
            )}
          </Button>
        </div>
      )}

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
      
      {/* If external button renderer is provided, render it here outside the view */}
      {renderActionButton && (
        <>
          <button 
            id="create-content-trigger" 
            ref={triggerButtonRef}
            onClick={onGenerateVideo}
            disabled={!canCreateContent || isGenerating}
            className="hidden"
            aria-hidden="true"
            type="button"
          />
        </>
      )}
    </div>
  )
} 