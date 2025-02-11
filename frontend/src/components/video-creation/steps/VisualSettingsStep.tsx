'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import shotStyleData from '@/data/video-creation/image/shot-style_select-option.json'
import aspectRatioData from '@/data/video-creation/image/aspect-ratio_select-option.json'
import { VisualStyleCarousel } from '../sections/VisualStyleCarousel'
import { FormatSelection } from '../sections/FormatSelection'
import Image from 'next/image'

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
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    // Initialize expanded categories based on selected shot style
    if (!visualSettings.shotStyle) return []
    
    // Find which category contains the selected style
    const selectedCategory = shotStyleData.categories.find(category =>
      category.options.some(option => option.id === visualSettings.shotStyle)
    )
    
    return selectedCategory ? [selectedCategory.id] : []
  })

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

  // Effect to expand category when an option is selected
  useEffect(() => {
    if (visualSettings.shotStyle) {
      const selectedCategory = shotStyleData.categories.find(category =>
        category.options.some(option => option.id === visualSettings.shotStyle)
      )
      
      if (selectedCategory && !expandedCategories.includes(selectedCategory.id)) {
        setExpandedCategories(prev => [...prev, selectedCategory.id])
      }
    }
  }, [visualSettings.shotStyle])

  // Handle option selection
  const handleOptionSelect = (categoryId: string, optionId: string) => {
    if (!isGenerating) {
      setVisualSettings({
        ...visualSettings,
        shotStyle: visualSettings.shotStyle === optionId ? '' : optionId
      })
      // Close the category after selection
      setExpandedCategories(prev => prev.filter(id => id !== categoryId))
    }
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pt-4">
      {/* Progress Steps */}
      <div className="flex justify-center gap-4 mb-8 px-4">
        {steps.map((s, index) => (
          <motion.button
            key={s.id}
            className="flex flex-col items-center w-[120px]"
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
            <div className="text-xs font-medium text-center">
              {s.title}
            </div>
          </motion.button>
              ))}
            </div>

      {/* Current Step Content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold">{step.title}</h2>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>

          {step.id === 'style' && (
            <div className="grid gap-4">
              <AnimatePresence initial={false}>
                {shotStyleData.categories.map((category) => (
                  <Card
                    key={category.id} 
                    className={cn(
                      "transition-colors",
                      !expandedCategories.includes(category.id) && isCategorySelected(category)
                        ? "ring-1 ring-primary bg-primary/5"
                        : "hover:bg-accent/5"
                    )}
                  >
                    <div className="p-4 border-b border-border/50">
                      <button
                        className={cn(
                          "w-full flex justify-between items-center",
                          !expandedCategories.includes(category.id) && isCategorySelected(category)
                            ? "text-primary font-medium"
                            : "text-foreground font-medium"
                        )}
                        onClick={() => toggleCategory(category.id)}
                        disabled={isGenerating}
                      >
                        <span>{category.name}</span>
                        {expandedCategories.includes(category.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    
                    <AnimatePresence initial={false}>
                      {expandedCategories.includes(category.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-4 space-y-6 bg-accent/5"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {category.options.map((option) => (
                              <motion.button
                                key={option.id}
                                className={cn(
                                  "p-4 rounded-lg text-left transition-colors relative overflow-hidden bg-background border border-border/50",
                                  visualSettings.shotStyle === option.id
                                    ? "ring-2 ring-primary bg-primary/5"
                                    : "hover:border-primary/50"
                                )}
                                onClick={() => handleOptionSelect(category.id, option.id)}
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
                            <div className="w-full overflow-hidden">
                              <VisualStyleCarousel 
                                previewImages={selectedStyle.previewImages} 
                                selectedStyle={selectedStyle.id}
                              />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}
              </AnimatePresence>
            </div>
          )}

          {step.id === 'format' && (
            <FormatSelection
              selectedFormat={visualSettings.aspectRatio}
              setSelectedFormat={(format) => setVisualSettings({
                ...visualSettings,
                aspectRatio: format
              })}
              isGenerating={isGenerating}
            />
          )}

          <div className="flex justify-between mt-8">
            {currentStep === 1 && (
            <Button
              variant="outline"
              size="lg"
                onClick={() => setCurrentStep(0)}
                disabled={isGenerating}
              className="min-w-[120px]"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
                Style
            </Button>
            )}
            {currentStep === 0 && (
            <Button
              size="lg"
                onClick={() => setCurrentStep(1)}
                disabled={isGenerating}
                className="min-w-[120px] bg-primary ml-auto"
              >
                Format
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            )}
            </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
} 