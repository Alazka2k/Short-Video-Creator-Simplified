import { useEffect, useState, useCallback } from 'react'
import { ContentState, ScriptParams, VisualizationType, RequestParams } from '@/components/video-creation/types'
import { durationOptions } from '@/components/video-creation/steps/BasicInformationStep'
import voiceData from '@/data/video-creation/voice/voice-select-option.json'
import videoDurationData from '@/data/video-creation/basic/video-duration-prompt.json'
import characterPerspectiveData from '@/data/video-creation/script/character-perspective_select-option.json'
import scriptToneData from '@/data/video-creation/script/script-tone_select-option.json'
import vocabularyData from '@/data/video-creation/script/vocabulary_select-option.json'
import pacingStructureData from '@/data/video-creation/script/pacing-structure_select-option.json'
import shotStyleData from '@/data/video-creation/image/shot-style_select-option.json'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiClient } from '@/lib/api/apiClient'

const STORAGE_KEY = 'video_creation_state'
const IMAGE_CACHE_KEY = 'video_creation_image_cache'
const M2M_TOKEN_KEY = 'video_creation_m2m_token'

interface M2MTokenData {
  access_token: string;
  expires_at: number; // timestamp when token expires
}

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
  const { getM2MToken } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [m2mToken, setM2MToken] = useState<string | null>(null)
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

  // Initialize M2M token
  useEffect(() => {
    getM2MToken().then(token => setM2MToken(token));
  }, [getM2MToken]);

  const findVoiceId = (selectedId: string): string => {
    if (!selectedId) return '';
    const voice = voiceData.categories
      ?.flatMap(category => category.options)
      .find(option => option.id === selectedId);
    return voice?.elevenlabsVoiceId || '';
  }

  const constructRequestBody = useCallback((): RequestParams => {
    if (!state.prompt || !state.selectedDuration) {
      throw new Error('Missing required fields')
    }

    // Find shot style prompt definition
    const shotStylePrompt = findPromptDefinition(shotStyleData, state.visualSettings.shotStyle);
    // Find voice ID
    const voiceId = findVoiceId(state.selectedVoice);

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
            shotStyle: shotStylePrompt
          }
        },
        voiceGenParams: {
          elevenlabsVoiceId: voiceId
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
    setError(null);
    try {
      const requestBody = constructRequestBody();
      
      // Get both tokens
      const userToken = localStorage.getItem("access_token");
      const m2mToken = await getM2MToken();
      
      // Set up headers with both tokens
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${m2mToken}`,
      };
      if (userToken) {
        headers['x-user-token'] = userToken;
      }
      
      const response = await apiClient.post<{ result: { jobId: string } }>(
        '/api/job/generate', 
        requestBody,
        { headers }
      );

      // Just return the jobId without navigating
      return response.result.jobId;
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while creating the project');
      throw error;
    }
  }, [constructRequestBody, getM2MToken]);

  const handleGenerateVideo = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const requestBody = constructRequestBody();
      
      // Get both tokens
      const userToken = localStorage.getItem("access_token");
      const m2mToken = await getM2MToken();
      
      // Set up headers with both tokens
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${m2mToken}`,
      };
      if (userToken) {
        headers['x-user-token'] = userToken;
      }
      
      const response = await apiClient.post<{ result: { jobId: string } }>(
        '/api/job/generate', 
        requestBody,
        { headers }
      );

      // Just return the jobId without navigating
      return response.result.jobId;
    } catch (error) {
      console.error('Error generating video:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while generating the video');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [constructRequestBody, getM2MToken]);

  return {
    state,
    updateState,
    imageCache: {
      get: getImageCache,
      set: setImageCache
    },
    isGenerating,
    error,
    handleGenerateVideo,
    handleCreateProject
  }
}

// Helper function to get default state
function getDefaultState(defaultValues?: any): VideoCreationState {
  const defaultVoice = voiceData.categories[0]?.options[0]?.id || '';
  
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
    selectedVoice: defaultValues?.voice || defaultVoice,
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
  if (!selectedId) return '';
  const option = data.categories
    ?.flatMap((category: any) => category.options)
    .find((option: any) => option.id === selectedId)
  return option?.promptDefinition || option?.prompt || ''
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