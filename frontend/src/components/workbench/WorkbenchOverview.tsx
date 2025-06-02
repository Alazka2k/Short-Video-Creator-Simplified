import { useWorkbench } from '@/lib/hooks/useWorkbench'
import { BentoGrid, BentoItem } from '@/components/ui/bento-grid'
import { Image as ImageIcon, Video as VideoIcon, Play as AnimationIcon, Mic as VoiceIcon } from 'lucide-react'
import { FilterBar } from '@/components/shared/filters/FilterBar'
import { Pagination } from '@/components/shared/pagination/Pagination'
import { DownloadButton } from '@/components/shared/buttons/DownloadButton'
import { ImagePreview } from '@/components/shared/media/ImagePreview'
import { WorkbenchEmpty } from './sections/WorkbenchEmpty'
import { Skeleton } from '@/components/ui/skeleton'

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
        previewUrl: job.previewUrl,
        gridSpan: job.gridSpan,
        aspectRatio: job.aspectRatio,
        onDownload: () => handleJobDownload(job),
        isDownloading: downloadingJobs[job.job_id],
        PreviewComponent: job.previewUrl ? (
          <ImagePreview
            url={job.previewUrl}
            aspectRatio={job.aspectRatio}
            alt={job.metadata?.llmResult?.title || 'Content preview'}
          />
        ) : null
      }
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-card border rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-card border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Check if we have any jobs at all
  if (!jobs || jobs.length === 0) {
    return <WorkbenchEmpty />
  }

  if (error) {
    console.error('Workbench error:', error)
    // Even if there's an error, show empty state instead of breaking
    return <WorkbenchEmpty />
  }

  return (
    <div className="space-y-6">
      <FilterBar
        onFilterChange={handleFilterChange}
      />
      
      <BentoGrid items={getBentoItems()} />
      
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
} 