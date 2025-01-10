'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Sparkles, 
  Video, 
  Music, 
  Image, 
  Mic, 
  Check,
  ChevronRight,
  Loader2,
  Download
} from 'lucide-react'

interface JobStatus {
  llm: 'pending' | 'completed' | 'failed'
  voice: 'pending' | 'completed' | 'failed'
  image: 'pending' | 'completed' | 'failed'
  video: 'pending' | 'completed' | 'failed'
  assembly: 'pending' | 'completed' | 'failed'
}

const durationOptions = [
  { label: '0-30 Seconds', value: 30, scenes: 5 },
  { label: '30-60 Seconds', value: 60, scenes: 9 },
  { label: 'Up to 90 Seconds', value: 90, scenes: 13 }
]

const visualizationTypes = [
  { id: 'plain', label: 'Plain', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'animation', label: 'Animation', icon: Sparkles }
]

export default function CreatePage() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showFocusField, setShowFocusField] = useState(false)

  // Form state
  const [prompt, setPrompt] = useState('')
  const [focus, setFocus] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(durationOptions[0])
  const [enabledServices, setEnabledServices] = useState({
    voice: true,
    music: true,
    image: true
  })
  const [selectedVisualization, setSelectedVisualization] = useState<string>('plain')

  type ServiceId = keyof typeof enabledServices
  
  const toggleService = (serviceId: ServiceId) => {
    const isImageRelated = serviceId === 'image'
    
    setEnabledServices(prev => {
      const newState = { ...prev }
      
      if (isImageRelated && prev[serviceId]) {
        // If turning off image, also reset visualization
        setSelectedVisualization('plain')
        return { ...newState, [serviceId]: false }
      }
      
      return { ...newState, [serviceId]: !prev[serviceId] }
    })
  }

  const handleGenerateVideo = async () => {
    setIsGenerating(true)
    try {
      const payload = {
        prompt,
        parameters: {
          llmGenParams: {
            general: {
              sceneAmount: selectedDuration.scenes,
              generalDescription: focus,
              targetDuration: selectedDuration.value
            }
          }
        },
        serviceConfig: {
          skipVoice: !enabledServices.voice,
          skipMusic: !enabledServices.music,
          skipImage: !enabledServices.image,
          visualizationType: selectedVisualization
        }
      }

      const response = await fetch('/api/job/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to start video generation')
      }

      const data = await response.json()
      setJobId(data.result.jobId)
      pollJobStatus(data.result.jobId)
    } catch (error) {
      console.error('Error generating video:', error)
      setIsGenerating(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/job/status/${jobId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch job status')
        }

        const data = await response.json()
        setJobStatus(data.progress)

        if (
          data.status === 'completed' ||
          data.status === 'failed' ||
          (data.error && data.error.message)
        ) {
          clearInterval(pollInterval)
          setIsGenerating(false)
        }
      } catch (error) {
        console.error('Error polling job status:', error)
        clearInterval(pollInterval)
        setIsGenerating(false)
      }
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="bg-card rounded-xl border p-8 space-y-8">
          {/* Video Idea Input */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Video Idea</h2>
            <Textarea
              placeholder="Describe your video idea..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-32"
              disabled={isGenerating}
            />
            {!showFocusField && (
              <Button
                variant="ghost"
                className="text-xs"
                onClick={() => setShowFocusField(true)}
              >
                + Add Focus/Theme
              </Button>
            )}
            {showFocusField && (
              <Textarea
                placeholder="Any specific focus or theme for your video..."
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="h-20"
                disabled={isGenerating}
              />
            )}
          </div>

          {/* Duration Selection */}
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

          {/* Service Selection */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Enable/Disable Services</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => toggleService('voice')}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  enabledServices.voice ? "bg-primary/20" : "bg-accent/5"
                )}
                disabled={isGenerating}
              >
                <Mic className={cn(
                  "w-4 h-4",
                  enabledServices.voice ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-sm">Voice</span>
                <Check className={cn(
                  "w-4 h-4 ml-1",
                  enabledServices.voice ? "opacity-100" : "opacity-0"
                )} />
              </button>
              <button
                onClick={() => toggleService('music')}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  enabledServices.music ? "bg-primary/20" : "bg-accent/5"
                )}
                disabled={isGenerating}
              >
                <Music className={cn(
                  "w-4 h-4",
                  enabledServices.music ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-sm">Music</span>
                <Check className={cn(
                  "w-4 h-4 ml-1",
                  enabledServices.music ? "opacity-100" : "opacity-0"
                )} />
              </button>
              <button
                onClick={() => toggleService('image')}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  enabledServices.image ? "bg-primary/20" : "bg-accent/5"
                )}
                disabled={isGenerating}
              >
                <Image className={cn(
                  "w-4 h-4",
                  enabledServices.image ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-sm">Visuals</span>
                <Check className={cn(
                  "w-4 h-4 ml-1",
                  enabledServices.image ? "opacity-100" : "opacity-0"
                )} />
              </button>
            </div>
          </div>

          {/* Visualization Type */}
          {enabledServices.image && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Visualization Type</h2>
              <div className="flex gap-3">
                {visualizationTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedVisualization(type.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                      selectedVisualization === type.id ? "bg-primary/20" : "bg-accent/5"
                    )}
                    disabled={isGenerating}
                  >
                    <type.icon className="w-4 h-4" />
                    <span className="text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateVideo}
            disabled={!prompt.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Video...
              </>
            ) : (
              'Generate Video'
            )}
          </Button>
        </div>

        {/* Generation Progress */}
        {jobStatus && (
          <div className="mt-8 bg-card rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Generation Progress</h3>
            <div className="space-y-4">
              {Object.entries(jobStatus).map(([service, status]) => (
                <div key={service} className="flex items-center gap-4">
                  <div className="w-32 font-medium capitalize">{service}</div>
                  <div className="flex-1 h-2 bg-accent/10 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        status === 'completed' ? 'bg-primary w-full' :
                        status === 'failed' ? 'bg-destructive w-full' :
                        'bg-primary/50 w-1/2 animate-pulse'
                      )}
                    />
                  </div>
                  <div className="w-24 text-sm text-muted-foreground capitalize">
                    {status}
                  </div>
                </div>
              ))}
            </div>

            {jobStatus.assembly === 'completed' && (
              <Button className="mt-6" onClick={() => {}}>
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 