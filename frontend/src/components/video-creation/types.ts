export type VisualizationType = 'plain' | 'video' | 'animation'

export interface ContentState {
  voice: boolean
  visuals: boolean
  music: boolean
}

export interface ScriptParams {
  characterPerspective: string
  pacingStructure: string
  scriptTone: string
  vocabulary: string
}

export interface VisualSettings {
  artistStyle: string
  shotStyle: string
  aspectRatio: string
}

export interface RequestParams {
  prompt: string
  parameters: {
    llmGenParams: {
      general: {
        sceneAmount: number
        lengthDescription: string
        generalDescription?: string
      }
      script: ScriptParams
      image: {
        artistStyle: string
        aspectRatio: string
        sValue: string
      }
    }
    voiceGenParams: {
      elevenlabsVoiceId: string
    }
    imageGenParams: Record<string, never>
    animationGenParams: Record<string, never>
    videoGenParams: {
      aspectRatio: string
    }
    serviceConfig: {
      skipVoice: boolean
      skipMusic: boolean
      skipImage: boolean
      skipVisualization: boolean
    }
    visualizationType: 'plain' | 'video' | 'animation'
  }
} 