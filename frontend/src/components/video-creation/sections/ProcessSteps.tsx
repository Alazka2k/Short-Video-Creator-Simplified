'use client'

import React from 'react'
import { motion } from 'framer-motion'
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
      <div className="w-full max-w-3xl relative space-y-4">
        {/* Navbar Switches */}
        <div className="flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isPast = index < currentStep

            return (
              <button
                key={step.id}
                onClick={() => !isGenerating && onChange(step.id)}
                disabled={isGenerating}
                className={cn(
                  "relative cursor-pointer text-sm font-medium px-6 py-2 rounded-full transition-colors flex items-center gap-2 flex-1",
                  "text-muted-foreground hover:text-foreground",
                  isActive && "bg-muted text-foreground"
                )}
              >
                <div className="flex items-center gap-2 justify-center w-full">
                  <Icon className="w-4 h-4" />
                  <span>{step.title}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="process-step-lamp"
                    className="absolute inset-0 w-full bg-muted rounded-full -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-foreground rounded-t-full">
                      <div className="absolute w-12 h-6 bg-foreground/20 rounded-full blur-md -top-2 -left-2" />
                      <div className="absolute w-8 h-6 bg-foreground/20 rounded-full blur-md -top-1" />
                      <div className="absolute w-4 h-4 bg-foreground/20 rounded-full blur-sm top-0 left-2" />
                    </div>
                  </motion.div>
                )}
              </button>
            )
          })}
        </div>

        {/* Progress Bar */}
        <div className="h-0.5 bg-muted rounded-full overflow-hidden mx-2">
          <div 
            className="h-full bg-muted-foreground transition-all duration-500 ease-out"
            style={{ 
              width: `${(currentStep / (steps.length - 1)) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  )
} 