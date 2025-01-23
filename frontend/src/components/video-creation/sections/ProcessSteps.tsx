'use client'

import React from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  title: string
  icon: React.ElementType
}

interface ProcessStepsProps {
  steps: Step[]
  currentStep: number
  onChange: (value: string) => void
  isGenerating: boolean
}

export function ProcessSteps({
  steps,
  currentStep,
  onChange,
  isGenerating
}: ProcessStepsProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-3xl relative">
        <div className="absolute h-0.5 bg-muted top-[45px] left-0 right-0 -z-10">
          <div 
            className="absolute h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ 
              width: `${(currentStep / (steps.length - 1)) * 100}%`
            }}
          />
        </div>
        <Tabs value={steps[currentStep].id} onValueChange={onChange}>
          <TabsList className="w-full flex bg-transparent justify-between p-0 gap-4">
            {steps.map((step, index) => (
              <TabsTrigger 
                key={step.id}
                value={step.id}
                disabled={isGenerating}
                className={cn(
                  "flex-1 relative py-4 border-none",
                  "transition-all duration-200",
                  index < currentStep ? "text-blue-500" :
                  index === currentStep ? "text-blue-600" :
                  "text-muted-foreground"
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all duration-300",
                    "border-2",
                    index < currentStep ? "bg-blue-500 border-blue-500 text-white" :
                    index === currentStep ? "border-blue-500 bg-blue-50 text-blue-600" :
                    "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{step.title}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
} 