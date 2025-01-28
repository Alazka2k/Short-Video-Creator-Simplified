'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import shotStyleData from '@/data/video-creation/image/shot-style_select-option.json'
import { VisualStyleCarousel } from '../sections/VisualStyleCarousel'

interface VisualSettingsStepProps {
  visualSettings: {
    shotStyle: string
    aspectRatio: string
  }
  setVisualSettings: (value: {
    shotStyle: string
    aspectRatio: string
  }) => void
  selectedVisualization: 'image' | 'video' | 'animation'
  isGenerating: boolean
}

const steps = [
  {
    id: 'style',
    title: 'Visual Style',
    description: 'Choose how your content will look',
    data: shotStyleData,
    paramKey: 'shotStyle' as const
  },
  {
    id: 'format',
    title: 'Format',
    description: 'Set the dimensions of your content',
    paramKey: 'aspectRatio' as const
  }
]

export function VisualSettingsStep({
  visualSettings,
  setVisualSettings,
  selectedVisualization,
  isGenerating
}: VisualSettingsStepProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Helper to check if a category has a selected option
  const isCategorySelected = (category: any) => {
    return category.options.some((option: any) => option.id === visualSettings[step.paramKey])
  }

  // Find the currently selected style
  const selectedStyle = shotStyleData.categories
    .flatMap(cat => cat.options)
    .find(opt => opt.id === visualSettings.shotStyle)

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 px-4 pt-4">
        {steps.map((s, index) => (
          <motion.button
            key={s.id}
            className="flex flex-col items-center w-[120px] sm:w-[150px]"
            onClick={() => !isGenerating && setCurrentStep(index)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
              disabled={isGenerating}
            >
            <motion.div 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mb-2
                ${index === currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : index < currentStep
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              animate={{
                scale: index === currentStep ? 1.1 : 1,
                backgroundColor: index === currentStep 
                  ? 'hsl(var(--primary))' 
                  : index < currentStep
                    ? 'hsla(var(--primary) / 0.2)'
                    : 'hsl(var(--muted))'
              }}
            >
              {index + 1}
            </motion.div>
            <div className="text-xs font-medium text-center px-1 truncate w-full">
              {s.title}
            </div>
          </motion.button>
              ))}
            </div>

      {/* Current Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="px-4"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold">{step.title}</h2>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>

          {step.id === 'style' && (
            <div className="grid gap-4">
              {shotStyleData.categories.map((category) => (
                  <Card
                  key={category.id} 
                  className={`p-4 transition-colors ${
                    isCategorySelected(category) ? 'ring-1 ring-primary bg-primary/5' : ''
                  }`}
                >
                  <button
                    className="w-full flex justify-between items-center font-medium mb-4"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <span className={isCategorySelected(category) ? 'text-primary' : ''}>
                      {category.name}
                    </span>
                    {expandedCategories.includes(category.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  {expandedCategories.includes(category.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.options.map((option) => (
                        <motion.button
                          key={option.id}
                          className={`p-4 rounded-lg text-left transition-colors relative overflow-hidden
                            ${visualSettings.shotStyle === option.id
                              ? 'bg-primary/20 ring-2 ring-primary'
                              : 'hover:bg-accent/5'
                            }`}
                          onClick={() => setVisualSettings({
                            ...visualSettings,
                            shotStyle: visualSettings.shotStyle === option.id ? '' : option.id
                          })}
                          disabled={isGenerating}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="font-medium mb-1">{option.name}</div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {option.description}
                          </p>
                      <div className="flex flex-wrap gap-1">
                            {option.tags.map((tag) => (
                              <span
                            key={tag}
                                className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs"
                          >
                            {tag}
                              </span>
                        ))}
                      </div>
                        </motion.button>
                      ))}
                      </div>

                      {/* Show carousel for the selected style within this category */}
                      {selectedStyle && category.options.some(opt => opt.id === selectedStyle.id) && (
                        <VisualStyleCarousel previewImages={selectedStyle.previewImages} />
                      )}
                    </motion.div>
                  )}
                  </Card>
                ))}
              </div>
            )}

          {step.id === 'format' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['9:16', '1:1', '16:9'].map((ratio) => (
                <motion.button
                  key={ratio}
                  className={cn(
                    "p-0 rounded-lg overflow-hidden transition-all",
                    visualSettings.aspectRatio === ratio
                      ? "ring-2 ring-primary"
                      : "hover:ring-1 hover:ring-primary/20"
                  )}
                  onClick={() => !isGenerating && setVisualSettings({
                    ...visualSettings,
                    aspectRatio: ratio
                  })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isGenerating}
                >
                  <AspectRatio
                    ratio={Number(ratio.split(':')[0]) / Number(ratio.split(':')[1])}
                    className="bg-muted"
                  >
                    <div className="h-full w-full flex items-center justify-center p-4">
                      <div className="text-center">
                        <div className="font-medium">{ratio}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {ratio === '9:16' ? 'Portrait' : ratio === '1:1' ? 'Square' : 'Landscape'}
                        </div>
                      </div>
                    </div>
                  </AspectRatio>
                </motion.button>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 0 || isGenerating}
              className="min-w-[120px]"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              size="lg"
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={isGenerating || isLastStep}
              className="min-w-[120px] bg-primary"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
} 