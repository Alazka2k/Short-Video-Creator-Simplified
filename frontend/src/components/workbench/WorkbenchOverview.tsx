import { useWorkbench } from '@/lib/hooks/useWorkbench'
import { BentoGrid, BentoItem } from '@/components/ui/bento-grid'
import { Image as ImageIcon, Video as VideoIcon, Play as AnimationIcon, Mic as VoiceIcon } from 'lucide-react'
import { FilterBar } from '@/components/shared/filters/FilterBar'
import { Pagination } from '@/components/shared/pagination/Pagination'
import { DownloadButton } from '@/components/shared/buttons/DownloadButton'

interface Scene {
  image?: { publicUrl: string }
  video?: { publicUrl: string }
  animation?: { publicUrl: string }
  voice?: { publicUrl: string }
}

export function WorkbenchOverview() {
  const {
    jobs,
    loading,
    error,
    filters,
    pagination,
    handleFilterChange,
    handlePageChange,
    handleJobDownload,
    downloadingJobs
  } = useWorkbench()

  const getBentoItems = (): BentoItem[] => {
    return jobs.map(job => {
      // Get the first scene's preview content
      const firstScene = job.metadata?.scenes?.[0]
      let previewUrl = null

      // Prefer image for preview, regardless of whether video/animation exists
      if (firstScene?.image?.publicUrl) {
        previewUrl = firstScene.image.publicUrl
      }

      // Get active services for this job
      const services = []
      if (job.metadata?.scenes?.some((scene: Scene) => scene.image)) {
        services.push({ icon: <ImageIcon className="h-3 w-3" />, label: 'Image' })
      }
      if (job.metadata?.scenes?.some((scene: Scene) => scene.video)) {
        services.push({ icon: <VideoIcon className="h-3 w-3" />, label: 'Video' })
      }
      if (job.metadata?.scenes?.some((scene: Scene) => scene.animation)) {
        services.push({ icon: <AnimationIcon className="h-3 w-3" />, label: 'Animation' })
      }
      if (job.metadata?.scenes?.some((scene: Scene) => scene.voice)) {
        services.push({ icon: <VoiceIcon className="h-3 w-3" />, label: 'Voice' })
      }

      return {
        jobId: job.job_id,
        title: job.metadata?.llmResult?.title || 'Untitled Content',
        description: job.metadata?.llmResult?.description || job.prompt || 'No description available',
        icon: null,
        services,
        meta: new Date(job.created_at).toLocaleDateString(),
        previewUrl,
        gridSpan: job.gridSpan,
        aspectRatio: job.aspectRatio,
        onDownload: () => handleJobDownload(job),
        isDownloading: downloadingJobs[job.job_id]
      }
    })
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <FilterBar
        onFilterChange={handleFilterChange}
      />
      
      <BentoGrid items={getBentoItems()} />
      
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
} 