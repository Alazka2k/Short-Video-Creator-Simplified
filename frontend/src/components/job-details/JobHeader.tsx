import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  Image as ImageIcon, 
  Music as MusicIcon,
  Video as VideoIcon,
  Mic as VoiceIcon,
  Play as AnimationIcon,
  Bot as LLMIcon,
  ChevronDown,
  Hash
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import voiceData from '@/data/video-creation/voice/voice-select-option.json'

interface JobHeaderProps {
  title: string
  description: string
  hashtag?: string
  created_at: string
  aspectRatio?: string
  shotStyle?: string
  service_sequence: string[]
  prompt: string
  metadata: {
    parameters: {
      voiceGenParams?: {
        elevenlabsVoiceId?: string
      }
      llmGenParams?: {
        script?: {
          scriptTone?: string
          vocabulary?: string
          pacingStructure?: string
          characterPerspective?: string
        }
      }
    }
    scenes?: Array<{
      voice?: {
        elevenlabsVoiceId?: string
      }
    }>
  }
  focus?: string
}

export function JobHeader({
  title,
  description,
  hashtag,
  created_at,
  aspectRatio,
  shotStyle,
  service_sequence = [],
  prompt,
  metadata,
  focus
}: JobHeaderProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  // Get voice ID either from parameters or from the first scene's voice
  const elevenlabsVoiceId = metadata?.parameters?.voiceGenParams?.elevenlabsVoiceId || 
                           metadata?.scenes?.[0]?.voice?.elevenlabsVoiceId

  const scriptInfo = metadata?.parameters?.llmGenParams?.script

  // Find voice name from elevenlabsVoiceId
  const getVoiceName = (id: string) => {
    for (const category of voiceData.categories) {
      const voice = category.options.find(v => v.elevenlabsVoiceId === id)
      if (voice) return voice.name
    }
    return id
  }

  // Parse hashtags from string
  const getHashtags = (hashtagString?: string) => {
    if (!hashtagString) return []
    return hashtagString.split(' ').filter(tag => tag.startsWith('#'))
  }

  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'llm':
        return <LLMIcon className="w-4 h-4 text-blue-500" />
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-500" />
      case 'voice':
        return <VoiceIcon className="w-4 h-4 text-purple-500" />
      case 'music':
        return <MusicIcon className="w-4 h-4 text-pink-500" />
      case 'video':
        return <VideoIcon className="w-4 h-4 text-sky-500" />
      case 'animation':
        return <AnimationIcon className="w-4 h-4 text-orange-500" />
      default:
        return null
    }
  }

  const getServiceLabel = (service: string) => {
    switch (service.toLowerCase()) {
      case 'llm':
        return 'Script'
      case 'image':
        return 'Image'
      case 'voice':
        return 'Voice'
      case 'music':
        return 'Music'
      case 'video':
        return 'Video'
      case 'animation':
        return 'Animation'
      default:
        return service
    }
  }

  return (
    <div className="space-y-4 bg-card rounded-lg border p-6">
      {/* Title and Creation Time */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {created_at && (
            <p className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Hashtags */}
      {hashtag && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          {getHashtags(hashtag).map((tag) => (
            <div 
              key={tag}
              className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full"
            >
              <Hash className="w-4 h-4" />
              <span>{tag.substring(1)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Voice */}
      {elevenlabsVoiceId && (
        <div className="flex flex-wrap items-center gap-4 border-t pt-4">
          <div className="text-sm bg-muted px-3 py-1.5 rounded-full">
            <span className="font-medium">Voice:</span>{' '}
            <span className="text-muted-foreground">{getVoiceName(elevenlabsVoiceId)}</span>
          </div>
        </div>
      )}

      {/* Service Sequence */}
      {service_sequence.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap border-t pt-4">
          {service_sequence.map((service, index) => (
            <div
              key={`${service}-${index}`}
              className="flex items-center gap-1.5 text-sm bg-muted rounded-full px-3 py-1.5"
              title={getServiceLabel(service)}
            >
              {getServiceIcon(service)}
              <span>{getServiceLabel(service)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Additional Details Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="w-full mt-2 border-2 hover:border-primary/50 transition-colors"
      >
        <span className="mr-2">{showDetails ? 'Hide' : 'Show'} Initial Data</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          showDetails && "transform rotate-180"
        )} />
      </Button>

      {/* Collapsible Details */}
      {showDetails && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {/* Initial Prompt */}
          {prompt && (
            <div>
              <span className="text-sm font-medium">Initial Prompt:</span>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-lg">{prompt}</p>
            </div>
          )}

          {/* Focus / Theme */}
          {focus && (
            <div>
              <span className="text-sm font-medium">Focus / Theme:</span>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-lg">{focus}</p>
            </div>
          )}

          {/* Script Settings */}
          {scriptInfo && Object.values(scriptInfo).some(Boolean) && (
            <div>
              <span className="text-sm font-medium">Script Settings:</span>
              <div className="mt-1 text-sm text-muted-foreground bg-muted p-3 rounded-lg space-y-2">
                {scriptInfo.scriptTone && (
                  <p><span className="font-medium">Tone:</span> {scriptInfo.scriptTone}</p>
                )}
                {scriptInfo.vocabulary && (
                  <p><span className="font-medium">Vocabulary:</span> {scriptInfo.vocabulary}</p>
                )}
                {scriptInfo.pacingStructure && (
                  <p><span className="font-medium">Pacing:</span> {scriptInfo.pacingStructure}</p>
                )}
                {scriptInfo.characterPerspective && (
                  <p><span className="font-medium">Perspective:</span> {scriptInfo.characterPerspective}</p>
                )}
              </div>
            </div>
          )}

          {/* Voice Settings */}
          {elevenlabsVoiceId && (
            <div>
              <span className="text-sm font-medium">Voice Settings:</span>
              <div className="mt-1 text-sm text-muted-foreground bg-muted p-3 rounded-lg space-y-2">
                <p><span className="font-medium">Voice:</span> {getVoiceName(elevenlabsVoiceId)}</p>
              </div>
            </div>
          )}

          {/* Visual Settings */}
          {(aspectRatio || shotStyle) && (
            <div>
              <span className="text-sm font-medium">Visual Settings:</span>
              <div className="mt-1 text-sm text-muted-foreground bg-muted p-3 rounded-lg space-y-2">
                {aspectRatio && (
                  <p><span className="font-medium">Aspect Ratio:</span> {aspectRatio}</p>
                )}
                {shotStyle && (
                  <p><span className="font-medium">Visual Style:</span> {shotStyle}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 