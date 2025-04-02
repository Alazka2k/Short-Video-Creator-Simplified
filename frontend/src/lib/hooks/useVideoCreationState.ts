import { useEffect, useState, useCallback, useRef } from 'react'
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
const VISUAL_SETTINGS_KEY = 'video_creation_visual_settings'
const M2M_TOKEN_KEY = 'video_creation_m2m_token'

interface TokenResponse {
  access_token: string;
  expires_at: number;
}

// Define the job progress state interface
interface JobProgressState {
  jobId: string | null;
  status: 'idle' | 'polling' | 'completed' | 'failed';
  progress: number;
  details: any | null;
  errorMessage?: string | null;
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
  const auth = useAuth();
  if (!auth) {
    throw new Error('useVideoCreationState must be used within an AuthProvider');
  }

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [m2mToken, setM2MToken] = useState<string | null>(null);
  
  // Add job progress state
  const [jobProgress, setJobProgress] = useState<JobProgressState>({
    jobId: null,
    status: 'idle',
    progress: 0,
    details: null
  });
  
  // Reference to store polling interval
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Function to fetch job progress
  const fetchJobProgress = useCallback(async (jobId: string) => {
    try {
      // Get tokens for authentication
      const userToken = localStorage.getItem("access_token");
      const m2mToken = await auth.getM2MToken();
      
      // Set up headers with both tokens
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${m2mToken}`,
      };
      if (userToken) {
        headers['x-user-token'] = userToken;
      }
      
      const response = await apiClient.get<{
        status: string;
        overallProgress: number;
        jobId: string;
        services: string[];
        serviceProgress: Record<string, any>;
        sceneProgress: Record<string, any>;
        errorMessage?: string | null;
      }>(
        `/api/job/jobs/${jobId}/progress`, 
        { headers }
      );
      
      // Update job progress state
      setJobProgress(prev => ({
        ...prev,
        status: response.status === 'in_progress' ? 'polling' : response.status as any,
        progress: response.overallProgress || 0,
        details: response,
        errorMessage: response.errorMessage || null
      }));
      
      // If job is complete or failed, stop polling and reset generating state
      if (response.status === 'completed' || response.status === 'failed') {
        setIsGenerating(false);
        stopPolling();
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching job progress:', error);
      // If there's an error after multiple attempts, stop polling
      if (jobProgress.status === 'polling') {
        setJobProgress(prev => ({
          ...prev,
          status: 'failed',
        }));
        setIsGenerating(false);
        stopPolling();
      }
      return null;
    }
  }, [auth, jobProgress.status, stopPolling]);
  
  // Function to start polling for job progress
  const startPolling = useCallback((jobId: string) => {
    // Stop any existing polling
    stopPolling();
    
    // Update job progress state
    setJobProgress({
      jobId,
      status: 'polling',
      progress: 0,
      details: null
    });
    
    // Initial fetch
    fetchJobProgress(jobId);
    
    // Start polling every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchJobProgress(jobId);
    }, 2000);
  }, [fetchJobProgress]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Initialize state from localStorage or default values
  const [state, setState] = useState<VideoCreationState>(() => {
    if (typeof window === 'undefined') return getDefaultState(defaultValues)
    
    // Load visual settings separately to persist across sessions
    const savedVisualSettings = localStorage.getItem(VISUAL_SETTINGS_KEY)
    let visualSettings = {
      shotStyle: defaultValues?.shotStyle || '',
      aspectRatio: defaultValues?.aspectRatio || '9:16'
    }
    
    if (savedVisualSettings) {
      try {
        visualSettings = JSON.parse(savedVisualSettings)
      } catch (e) {
        console.error('Error parsing saved visual settings:', e)
      }
    }
    
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        return {
          ...parsed,
          visualSettings: {
            ...visualSettings,
            ...parsed.visualSettings
          }
        }
      } catch (e) {
        console.error('Error parsing saved state:', e)
        return {
          ...getDefaultState(defaultValues),
          visualSettings
        }
      }
    }
    return {
      ...getDefaultState(defaultValues),
      visualSettings
    }
  })

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Save full state
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      
      // Save visual settings separately to persist across sessions
      localStorage.setItem(VISUAL_SETTINGS_KEY, JSON.stringify(state.visualSettings))
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

  // Update state function with visual settings persistence
  const updateState = useCallback((updates: Partial<VideoCreationState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates }
      
      // If visual settings are being updated, ensure they're properly merged
      if (updates.visualSettings) {
        newState.visualSettings = {
          ...prev.visualSettings,
          ...updates.visualSettings
        }
      }
      
      return JSON.stringify(newState) !== JSON.stringify(prev) ? newState : prev
    })
  }, [])

  // Initialize M2M token
  useEffect(() => {
    auth.getM2MToken().then(token => setM2MToken(token));
  }, [auth]);

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
    
    // Determine if we need to skip images and visualization
    const skipImage = !state.selectedContent.visuals;
    const skipVisualization = skipImage || state.selectedVisualization === 'image';
    
    // If images are skipped, visualization must also be skipped
    // In that case, we default to 'image' as the visualizationType
    const visualizationType = skipImage 
      ? 'image' 
      : (state.selectedVisualization === 'image' ? 'image' : state.selectedVisualization);

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
          skipImage: skipImage,
          skipVisualization: skipVisualization
        },
        visualizationType: visualizationType
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
      const m2mToken = await auth.getM2MToken();
      
      // Set up headers with both tokens
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${m2mToken}`,
      };
      if (userToken) {
        headers['x-user-token'] = userToken;
      }
      
      const response = await apiClient.post<{ jobId: string }>(
        '/api/job/generate', 
        requestBody,
        { headers }
      );

      // Start polling for job progress
      startPolling(response.jobId);
      
      // Return the jobId from the updated API response format
      return response.jobId;
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while creating the project');
      throw error;
    }
  }, [constructRequestBody, auth.getM2MToken, startPolling]);

  const handleGenerateVideo = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const requestBody = constructRequestBody();
      
      // Get both tokens
      const userToken = localStorage.getItem("access_token");
      const m2mToken = await auth.getM2MToken();
      
      // Set up headers with both tokens
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${m2mToken}`,
      };
      if (userToken) {
        headers['x-user-token'] = userToken;
      }
      
      const response = await apiClient.post<{ jobId: string, status: string }>(
        '/api/job/generate', 
        requestBody,
        { headers }
      );

      // Start polling for job progress
      startPolling(response.jobId);
      
      // Return the jobId from the updated API response format
      return response.jobId;
    } catch (error) {
      console.error('Error generating video:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while generating the video');
      setIsGenerating(false);
      stopPolling();
      throw error;
    }
  }, [constructRequestBody, auth.getM2MToken, startPolling, stopPolling]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      stopPolling();
      setIsGenerating(false);
      setJobProgress({
        jobId: null,
        status: 'idle',
        progress: 0,
        details: null
      });
    };
  }, [stopPolling]);

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
    handleCreateProject,
    jobProgress,
    startPolling,
    stopPolling
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