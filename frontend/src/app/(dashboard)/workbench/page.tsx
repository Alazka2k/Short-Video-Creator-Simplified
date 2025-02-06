'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api/apiClient'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

interface Job {
  jobId: string
  status: string
  createdAt: string
  prompt: string
}

interface JobsResponse {
  data: Job[]
}

export default function WorkbenchPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await apiClient.get<JobsResponse>('/api/job/jobs')
        setJobs(response.data || [])
      } catch (error) {
        console.error('Error fetching jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="main-gradient" />
      <div className="gradient-overlay" />

      <div className="container max-w-7xl mx-auto py-12">
        <div className="relative">
          {/* Main content */}
          <div className="grid gap-8">
            {/* Header section */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold tracking-tight gradient-primary-text">
                Content Workbench
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage and monitor your content creation jobs
              </p>
            </div>

            {/* Content area */}
            <div className="relative">
              {/* Main interface */}
              <div className="relative z-10 bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
                <div className="p-8">
                  {loading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-card">
                      <div className="p-6">
                        <p className="text-center text-muted-foreground">
                          {jobs.length === 0 
                            ? "No content jobs found. Create your first content by clicking 'Create Video'."
                            : `${jobs.length} content jobs found`}
                        </p>
                      </div>
                    </div>
                  )}
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
    </div>
  )
} 