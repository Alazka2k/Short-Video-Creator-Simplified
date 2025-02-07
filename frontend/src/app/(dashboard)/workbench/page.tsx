'use client'

import { WorkbenchOverview } from '@/components/workbench/WorkbenchOverview'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

export default function WorkbenchPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="container max-w-7xl mx-auto py-12">
        <div className="relative">
          {/* Header section */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Content Workbench
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage and monitor your content creation projects
            </p>
          </div>

          {/* Workbench interface */}
          <div className="relative">
            <div className="relative z-10 bg-card/50 backdrop-blur-sm border-primary/10 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl">
              <div className="p-8">
                <WorkbenchOverview />
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
              <div className="absolute inset-[1px] bg-background rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 