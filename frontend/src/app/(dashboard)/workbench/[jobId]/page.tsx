'use client'

import { useEffect, useState } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/apiClient'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

interface JobDetails {
  jobId: string
  status: string
  createdAt: string
  prompt: string
  content?: {
    llm?: {
      title?: string
      description?: string
      scenes?: Array<{
        description: string
        visual_prompt: string
      }>
    }
  }
}

export default function JobDetailsPage({ params }: { params: { jobId: string } }) {
  const router = useRouter()
  const [job, setJob] = useState<JobDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await apiClient.get<{ data: JobDetails }>(`/api/job/jobs/${params.jobId}`)
        setJob(response.data)
      } catch (error) {
        console.error('Error fetching job details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobDetails()
  }, [params.jobId])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )
    }

    if (!job) {
      return (
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/workbench')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workbench
          </Button>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-center text-muted-foreground">Job not found</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/workbench')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workbench
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{job.content?.llm?.title || 'Untitled Content'}</h1>
            <p className="text-muted-foreground">{job.content?.llm?.description || job.prompt}</p>
          </div>
        </div>

        {/* Placeholder for detailed content - we'll implement this in the next step */}
        <div className="rounded-lg border bg-card">
          <div className="p-6">
            <p className="text-muted-foreground">
              Status: {job.status}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="container max-w-7xl mx-auto py-12">
        <div className="relative">
          {/* Main content */}
          <div className="relative">
            {/* Main interface */}
            <div className="relative z-10 bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
              <div className="p-8">
                {renderContent()}
              </div>
            </div>
            {/* Border gradient effect */}
            <div className="absolute inset-0 -z-10 rounded-xl">
              <div className="absolute inset-[-3px] rounded-xl">
                <HoverBorderGradient
                  as="div"
                  containerClassName="w-full h-full"
                  className="bg-transparent"
                  duration={3}
                />
              </div>
              {/* Inner mask to hide gradient from center */}
              <div className="absolute inset-[1px] bg-background rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 