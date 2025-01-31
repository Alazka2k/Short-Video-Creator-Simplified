import { useEffect, useState, useCallback } from 'react'
import { ContentState, ScriptParams, VisualizationType, RequestParams } from '@/components/video-creation/types'
import { durationOptions } from '@/components/video-creation/steps/BasicInformationStep'
import voiceData from '@/data/features/voices.json'
import videoDurationData from '@/data/video-creation/basic/video-duration-prompt.json'
import characterPerspectiveData from '@/data/video-creation/script/character-perspective_select-option.json'
import scriptToneData from '@/data/video-creation/script/script-tone_select-option.json'
import vocabularyData from '@/data/video-creation/script/vocabulary_select-option.json'
import pacingStructureData from '@/data/video-creation/script/pacing-structure_select-option.json'
import shotStyleData from '@/data/video-creation/image/shot-style_select-option.json'

const STORAGE_KEY = 'video_creation_state'
const IMAGE_CACHE_KEY = 'video_creation_image_cache'

interface VideoCreationState {
  currentStep: number
  prompt: string
  focus: string
  selectedDuration: typeof durationOptions[0] | null | undefined
  selectedContent: ContentState
  selectedVoice: string
  selectedVisualization: VisualizationType
  visualSettings: {
    shotStyle: string
    aspectRatio: string
  }
  scriptParams: ScriptParams
  showFocusField: boolean
}

export function useVideoCreationState(defaultValues?: any) {
  const [isGenerating, setIsGenerating] = useState(false)
  // Initialize state from localStorage or default values
  const [state, setState] = useState<VideoCreationState>(() => {
    if (typeof window === 'undefined') return getDefaultState(defaultValues)
    
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        return parsed
      } catch (e) {
        console.error('Error parsing saved state:', e)
        return getDefaultState(defaultValues)
      }
    }
    return getDefaultState(defaultValues)
  })

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state])

  // Image cache handling
  const getImageCache = useCallback(() => {
    if (typeof window === 'undefined') return {}
    try {
      return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])

  const setImageCache = useCallback((cache: Record<string, string>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache))
    }
  }, [])

  // State update function
  const updateState = useCallback((updates: Partial<VideoCreationState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates }
      return JSON.stringify(newState) !== JSON.stringify(prev) ? newState : prev
    })
  }, [])

  const constructRequestBody = useCallback((): RequestParams => {
    if (!state.prompt || !state.selectedDuration) {
      throw new Error('Missing required fields')
    }

    return {
      prompt: state.prompt,
      parameters: {
        llmGenParams: {
          general: {
            sceneAmount: state.selectedDuration.scenes,
            lengthDescription: state.selectedDuration.lengthDescription,
            generalDescription: state.focus || undefined
          },
          script: {
            characterPerspective: findPromptDefinition(characterPerspectiveData, state.scriptParams.characterPerspective),
            pacingStructure: findPromptDefinition(pacingStructureData, state.scriptParams.pacingStructure),
            scriptTone: findPromptDefinition(scriptToneData, state.scriptParams.scriptTone),
            vocabulary: findPromptDefinition(vocabularyData, state.scriptParams.vocabulary)
          },
          image: {
            aspectRatio: state.visualSettings.aspectRatio,
            sValue: "500",
            shotStyle: findPromptDefinition(shotStyleData, state.visualSettings.shotStyle)
          }
        },
        voiceGenParams: {
          elevenlabsVoiceId: state.selectedVoice
        },
        imageGenParams: {},
        animationGenParams: {},
        videoGenParams: {
          aspectRatio: state.selectedVisualization === 'video' 
            ? invertAspectRatio(state.visualSettings.aspectRatio)
            : state.visualSettings.aspectRatio
        },
        serviceConfig: {
          skipVoice: !state.selectedContent.voice,
          skipMusic: !state.selectedContent.music,
          skipImage: !state.selectedContent.visuals,
          skipVisualization: state.selectedVisualization === 'image'
        },
        visualizationType: state.selectedVisualization === 'image' ? 'image' : state.selectedVisualization
      }
    }
  }, [
    state.prompt,
    state.focus,
    state.selectedDuration,
    state.selectedContent,
    state.scriptParams,
    state.selectedVoice,
    state.selectedVisualization,
    state.visualSettings
  ])

  const handleCreateProject = useCallback(async () => {
    try {
      const requestBody = constructRequestBody()
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
      return data.result.jobId
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }, [constructRequestBody])

  const handleGenerateVideo = useCallback(async () => {
    setIsGenerating(true)
    try {
      const requestBody = constructRequestBody()
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
      return data.result.jobId
    } catch (error) {
      console.error('Error generating video:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [constructRequestBody])

  return {
    state,
    updateState,
    imageCache: {
      get: getImageCache,
      set: setImageCache
    },
    isGenerating,
    handleGenerateVideo,
    handleCreateProject
  }
}

// Helper function to get default state
function getDefaultState(defaultValues?: any): VideoCreationState {
  return {
    currentStep: 0,
    prompt: defaultValues?.prompt || '',
    focus: defaultValues?.focus || '',
    selectedDuration: defaultValues?.duration !== undefined ? defaultValues.duration : durationOptions[0],
    selectedContent: {
      voice: false,
      visuals: false,
      music: false
    },
    selectedVoice: defaultValues?.voice || voiceData.voices[0].id,
    selectedVisualization: defaultValues?.visualization || 'image',
    visualSettings: {
      shotStyle: defaultValues?.shotStyle || '',
      aspectRatio: defaultValues?.aspectRatio || '9:16'
    },
    scriptParams: {
      characterPerspective: defaultValues?.characterPerspective || '',
      pacingStructure: defaultValues?.pacingStructure || '',
      scriptTone: defaultValues?.scriptTone || '',
      vocabulary: defaultValues?.vocabulary || ''
    },
    showFocusField: false
  }
}

// Helper to find prompt definition
const findPromptDefinition = (data: any, selectedId: string): string => {
  const option = data.categories
    ?.flatMap((category: any) => category.options)
    .find((option: any) => option.id === selectedId)
  return option?.prompt || ''
}

// Helper to find duration option
const findDurationOption = (selectedValue: number) => {
  return videoDurationData.options.find(option => option.sceneAmount === selectedValue)
}

// Helper to invert aspect ratio
const invertAspectRatio = (ratio: string): string => {
  const [width, height] = ratio.split(':')
  return `${height}:${width}`
} 