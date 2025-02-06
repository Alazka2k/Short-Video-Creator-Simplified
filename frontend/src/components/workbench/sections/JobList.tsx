import { BentoGrid, BentoItem } from '@/components/ui/bento-grid'
import { 
  Image as ImageIcon, 
  Music as MusicIcon,
  Video as VideoIcon,
  Mic as VoiceIcon,
  Play as AnimationIcon,
  Bot as LLMIcon,
  Loader2 as LoadingIcon
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Job {
  job_id: string
  created_at: string
  updated_at: string
  status: string
  service_sequence: string[]
  metadata: {
    llmResult?: {
      title?: string
      description?: string
    }
    scenes?: Array<{
      image?: {
        publicUrl?: string
      }
      video?: {
        public_url?: string
      }
      animation?: {
        public_url?: string
      }
      voice?: {
        publicUrl?: string
      }
    }>
  }
  prompt: string
}

interface JobListProps {
  jobs: Job[]
  loading: boolean
  error: string | null
}

export function JobList({ jobs, loading, error }: JobListProps) {
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

  const getPreviewUrl = (job: Job) => {
    if (!job.metadata?.scenes?.[0]) return null
    const scene = job.metadata.scenes[0]
    
    // Try to get video/animation first
    if (scene.video?.public_url) {
      return scene.video.public_url
    }
    if (scene.animation?.public_url) {
      return scene.animation.public_url
    }
    // Fall back to image if no video/animation
    if (scene.image?.publicUrl) {
      return scene.image.publicUrl
    }
    return null
  }

  const jobsToBentoItems = (jobs: Job[]): BentoItem[] => {
    return jobs.map(job => ({
      title: job.metadata?.llmResult?.title || 'Untitled',
      description: job.metadata?.llmResult?.description || job.prompt,
      icon: null, // Remove the robot icon
      services: job.service_sequence.map(service => ({
        icon: getServiceIcon(service),
        label: getServiceLabel(service)
      })),
      meta: formatDistanceToNow(new Date(job.created_at), { addSuffix: true }),
      cta: 'View Details →',
      colSpan: (job.metadata?.scenes?.length ?? 0) > 1 ? 2 : 1,
      hasPersistentHover: false,
      previewUrl: getPreviewUrl(job),
      jobId: job.job_id
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingIcon className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading jobs</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!jobs.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No jobs found</p>
          <p className="text-sm text-gray-500">
            Create your first content to see it here
          </p>
        </div>
      </div>
    )
  }

  return <BentoGrid items={jobsToBentoItems(jobs)} />
} 