import { BentoGrid } from '@/components/ui/bento-grid'
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

interface PreviewContent {
  url: string;
  type: 'video' | 'animation' | 'image';
  storageKey?: string;
}

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
        storage_key?: string
      }
      video?: {
        public_url?: string
        storage_key?: string
      }
      animation?: {
        public_url?: string
        storage_key?: string
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

  const getPreviewContent = (job: Job): PreviewContent | null => {
    if (!job.metadata?.scenes?.[0]) return null;
    const scene = job.metadata.scenes[0];
    
    // Prioritize video > animation > image
    if (scene.video?.public_url) {
      return {
        url: scene.video.public_url,
        type: 'video',
        storageKey: scene.video.storage_key
      };
    }
    
    if (scene.animation?.public_url) {
      return {
        url: scene.animation.public_url,
        type: 'animation',
        storageKey: scene.animation.storage_key
      };
    }
    
    if (scene.image?.publicUrl) {
      return {
        url: scene.image.publicUrl,
        type: 'image',
        storageKey: scene.image.storage_key
      };
    }
    
    return null;
  }

  const getItems = () => {
    return jobs.map(job => {
      const preview = getPreviewContent(job);
      const serviceIcon = getServiceIcon(job.service_sequence[0] || 'llm');
      
      return {
        title: job.metadata?.llmResult?.title || 'Untitled',
        description: job.metadata?.llmResult?.description || job.prompt,
        icon: serviceIcon,
        services: job.service_sequence.map(service => ({
          icon: getServiceIcon(service),
          label: getServiceLabel(service)
        })),
        meta: formatDistanceToNow(new Date(job.created_at), { addSuffix: true }),
        cta: 'View Details →',
        colSpan: (job.metadata?.scenes?.length ?? 0) > 1 ? 2 : 1,
        hasPersistentHover: false,
        previewUrl: preview?.url,
        previewType: preview?.type,
        jobId: job.job_id
      };
    });
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

  return <BentoGrid items={getItems()} />
} 