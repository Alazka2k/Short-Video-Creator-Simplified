import { useEffect, useState, useCallback } from 'react'
import { ContentState, ScriptParams, VisualizationType } from '@/components/video-creation/types'
import { durationOptions } from '@/components/video-creation/steps/BasicInformationStep'
import voiceData from '@/data/features/voices.json'

const STORAGE_KEY = 'video_creation_state'
const IMAGE_CACHE_KEY = 'video_creation_image_cache'

interface VideoCreationState {
  currentStep: number
  prompt: string
  focus: string
  selectedDuration: typeof durationOptions[0]
  selectedContent: ContentState
  selectedVoice: string
  selectedVisualization: VisualizationType
  visualSettings: {
    artistStyle: string
    shotStyle: string
    aspectRatio: string
  }
  scriptParams: ScriptParams
  showFocusField: boolean
}

export function useVideoCreationState(defaultValues?: any) {
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

  return {
    state,
    updateState,
    imageCache: {
      get: getImageCache,
      set: setImageCache
    }
  }
}

// Helper function to get default state
function getDefaultState(defaultValues?: any): VideoCreationState {
  return {
    currentStep: 0,
    prompt: defaultValues?.prompt || '',
    focus: defaultValues?.focus || '',
    selectedDuration: defaultValues?.duration || durationOptions[0],
    selectedContent: {
      voice: true,
      visuals: true,
      music: true
    },
    selectedVoice: defaultValues?.voice || voiceData.voices[0].id,
    selectedVisualization: defaultValues?.visualization || 'image',
    visualSettings: {
      artistStyle: defaultValues?.artistStyle || '',
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