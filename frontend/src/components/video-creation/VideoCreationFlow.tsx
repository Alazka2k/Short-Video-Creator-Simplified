'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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

// Import step components
import { BasicInformationStep, durationOptions } from './steps/BasicInformationStep'
import { VoiceSettingsStep } from './steps/VoiceSettingsStep'
import { VisualSettingsStep } from './steps/VisualSettingsStep'
import { ScriptSettingsStep } from './steps/ScriptSettingsStep'

// Import new components
import { SettingsSummary } from './sections/SettingsSummary'
import { RequiredContentSelection } from './sections/RequiredContentSelection'
import { VisualizationTypeSelection } from './sections/VisualizationTypeSelection'

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

export function VideoCreationFlow({ 
  mode, 
  onSubmit, 
  defaultValues,
  isDemo = false 
}: VideoCreationFlowProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showFocusField, setShowFocusField] = useState(false)

  // Form state
  const [prompt, setPrompt] = useState(defaultValues?.prompt || '')
  const [focus, setFocus] = useState(defaultValues?.focus || '')
  const [selectedDuration, setSelectedDuration] = useState(defaultValues?.duration || durationOptions[0])
  const [selectedContent, setSelectedContent] = useState<ContentState>({
    voice: true,
    visuals: true,
    music: true
  })

  // Advanced options
  const [selectedVoice, setSelectedVoice] = useState(defaultValues?.voice || voiceData.voices[0].id)
  const [selectedVisualization, setSelectedVisualization] = useState<VisualizationType>(defaultValues?.visualization || 'plain')
  const [visualSettings, setVisualSettings] = useState({
    artistStyle: defaultValues?.artistStyle || visualConfig.artistStyles[0].id,
    shotStyle: defaultValues?.shotStyle || visualConfig.shotStyles[0].id,
    aspectRatio: defaultValues?.aspectRatio || visualConfig.aspectRatios[0].id
  })

  // Script parameters
  const [scriptParams, setScriptParams] = useState<ScriptParams>({
    characterPerspective: defaultValues?.characterPerspective || '',
    pacingStructure: defaultValues?.pacingStructure || '',
    scriptTone: defaultValues?.scriptTone || '',
    vocabulary: defaultValues?.vocabulary || ''
  })

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

  const handleCreateProject = async () => {
    if (isDemo) return

    try {
      const requestBody: RequestParams = {
        prompt,
        parameters: {
          llmGenParams: {
            general: {
              sceneAmount: selectedDuration.scenes,
              lengthDescription: getDurationDescription(selectedDuration),
              generalDescription: focus || undefined
            },
            script: scriptParams,
            image: {
              artistStyle: visualSettings.artistStyle,
              aspectRatio: visualSettings.aspectRatio,
              sValue: "500" // Default value for now
            }
          },
          voiceGenParams: {
            elevenlabsVoiceId: selectedVoice
          },
          imageGenParams: {},
          animationGenParams: {},
          videoGenParams: {
            aspectRatio: visualSettings.aspectRatio
          },
          serviceConfig: {
            skipVoice: !selectedContent.voice,
            skipMusic: !selectedContent.music,
            skipImage: !selectedContent.visuals,
            skipVisualization: selectedVisualization === 'plain'
          },
          visualizationType: selectedVisualization
        }
      }

      const response = await fetch('/api/job/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const data = await response.json()
      router.push(`/projects/${data.result.jobId}`)
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const handleGenerateVideo = async () => {
    if (isDemo) return

    setIsGenerating(true)
    try {
      const requestBody: RequestParams = {
        prompt,
        parameters: {
          llmGenParams: {
            general: {
              sceneAmount: selectedDuration.scenes,
              lengthDescription: getDurationDescription(selectedDuration),
              generalDescription: focus || undefined
            },
            script: scriptParams,
            image: {
              artistStyle: visualSettings.artistStyle,
              aspectRatio: visualSettings.aspectRatio,
              sValue: "500" // Default value for now
            }
          },
          voiceGenParams: {
            elevenlabsVoiceId: selectedVoice
          },
          imageGenParams: {},
          animationGenParams: {},
          videoGenParams: {
            aspectRatio: visualSettings.aspectRatio
          },
          serviceConfig: {
            skipVoice: !selectedContent.voice,
            skipMusic: !selectedContent.music,
            skipImage: !selectedContent.visuals,
            skipVisualization: selectedVisualization === 'plain'
          },
          visualizationType: selectedVisualization
        }
      }

      const response = await fetch('/api/job/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...requestBody,
          assemblyConfig: {
            immediate: true
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate video')
      }

      const data = await response.json()
      router.push(`/videos/${data.result.jobId}`)
    } catch (error) {
      console.error('Error generating video:', error)
      setIsGenerating(false)
    }
  }

  const renderStepContent = (stepId: string) => {
    return (
      <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
        <div className="space-y-8">
          {stepId === 'basic' && (
            <>
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
              />
              
              <RequiredContentSelection
                selectedContent={selectedContent}
                setSelectedContent={setSelectedContent}
                isGenerating={isGenerating}
              />

              {selectedContent.visuals && (
                <VisualizationTypeSelection
                  selectedVisualization={selectedVisualization}
                  setSelectedVisualization={setSelectedVisualization}
                  isGenerating={isGenerating}
                />
              )}
            </>
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
              selectedVisualization={selectedVisualization}
              setSelectedVisualization={(value) => setSelectedVisualization(value)}
              visualSettings={visualSettings}
              setVisualSettings={setVisualSettings}
              isGenerating={isGenerating}
            />
          )}
        </div>

        <div className="space-y-8">
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
    )
  }

  const activeSteps = STEPS.filter(step => {
    if (step.id === 'voice') return selectedContent.voice
    if (step.id === 'visuals') return selectedContent.visuals
    return true
  })

  if (mode === 'quick') {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">Quick Create</h1>
            <Button
              variant="outline"
            onClick={() => router.push('/create')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Advanced Mode
            </Button>
        </div>

        {/* Quick creation content */}
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
          />
          <RequiredContentSelection
            selectedContent={selectedContent}
            setSelectedContent={setSelectedContent}
            isGenerating={isGenerating}
          />
      </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCreateProject}
            disabled={!prompt.trim() || isGenerating}
          >
            <Download className="w-4 h-4 mr-2" />
            Save as Project
          </Button>
          <Button
            className="flex-1"
            onClick={handleGenerateVideo}
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Video</h1>
        <Tabs value={activeSteps[currentStep].id} onValueChange={(value) => {
          const newIndex = activeSteps.findIndex(step => step.id === value)
          setCurrentStep(newIndex)
        }}>
          <TabsList>
            {activeSteps.map((step) => (
              <TabsTrigger 
                key={step.id}
                value={step.id}
                disabled={isGenerating}
                className="gap-2"
              >
                {React.createElement(step.icon, { className: "w-4 h-4" })}
                {step.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        </div>

      {/* Content */}
      <ScrollArea className="min-h-[500px] pr-4">
        {renderStepContent(activeSteps[currentStep].id)}
      </ScrollArea>

      {/* Navigation */}
      <div className="flex justify-between">
            <Button
          variant="ghost"
              onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 0 || isGenerating}
          className="gap-2"
            >
          <ArrowLeft className="w-4 h-4" />
          {activeSteps[currentStep - 1]?.title || 'Previous'}
            </Button>

        {currentStep === activeSteps.length - 1 ? (
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleCreateProject}
                  disabled={!prompt.trim() || isGenerating}
              className="gap-2"
                >
              <Download className="w-4 h-4" />
              Save as Project
                </Button>
                <Button
                  onClick={handleGenerateVideo}
                  disabled={!prompt.trim() || isGenerating}
              className="gap-2"
                >
                  {isGenerating ? (
                    <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Video
                </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={isGenerating}
            className="gap-2"
              >
            {activeSteps[currentStep + 1]?.title || 'Continue'}
            <ChevronRight className="w-4 h-4" />
              </Button>
        )}
      </div>
    </div>
  )
} 