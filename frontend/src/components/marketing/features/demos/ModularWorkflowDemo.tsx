'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, Image, Mic, Music, Video, Clock, ArrowRight, Settings, CheckCircle, Download, Timer } from 'lucide-react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import Select from '@/components/ui/select'
import videoDurationData from '@/data/video-creation/basic/video-duration-prompt.json'

// Define visualization options
const visualizationOptions = [
  { id: 'image', label: 'Image', icon: Image, description: 'Static images for each scene' },
  { id: 'animation', label: 'Animation', icon: Sparkles, description: 'Animated effects & transitions' },
  { id: 'video', label: 'Video', icon: Video, description: 'Dynamic video sequences' }
]

// Map duration options from the same format as ContentGenerationDemo
const durationOptions = videoDurationData.options.map(option => ({
  label: option.name,
  value: option.sceneAmount * 10,
  scenes: option.sceneAmount,
  description: option.description,
  lengthDescription: option.lengthDescription,
  icon: option.icon,
  timeMultiplier: option.sceneAmount / 3 // Approximate time multiplier based on scenes
}))

const durationSelectOptions = videoDurationData.options.map(option => ({
  id: option.name,
  label: option.name,
  value: String(option.sceneAmount * 10),
  description: option.description,
  custom: option.icon ? (
    <div className="flex h-12 w-12 items-center justify-center">
      <img src={option.icon} alt={option.name} className="w-8 h-8 object-contain" />
    </div>
  ) : (
    <div className="flex h-12 w-12 items-center justify-center">
      <span className="text-xl">⏱️</span>
    </div>
  )
}))

// Define content generation modules
const contentModules = [
  { 
    id: 'content',
    label: 'Content Generation', 
    enabled: true,
    icon: Sparkles,
    description: 'AI-powered script generation',
    color: 'bg-violet-500/90 dark:bg-violet-600/90 text-white'
  },
  { 
    id: 'visuals',
    label: 'Visual Creation', 
    enabled: true,
    icon: Image,
    description: 'Scene visualization',
    color: 'bg-emerald-500/90 dark:bg-emerald-600/90 text-white',
    hasOptions: true
  },
  { 
    id: 'voice',
    label: 'Voice Generation', 
    enabled: true,
    icon: Mic,
    description: 'Professional voiceovers',
    color: 'bg-purple-500/90 dark:bg-purple-600/90 text-white'
  },
  { 
    id: 'music',
    label: 'Music Creation', 
    enabled: true,
    icon: Music,
    description: 'Background music',
    color: 'bg-pink-500/90 dark:bg-pink-600/90 text-white'
  }
]

export function ModularWorkflowDemo() {
  const [selectedVisualization, setSelectedVisualization] = useState('video')
  const [selectedDuration, setSelectedDuration] = useState<typeof durationOptions[0]>(durationOptions[1])
  const enabledModules = contentModules.filter(m => m.enabled)
  
  // Handler for Select component
  const handleDurationChange = (value: string | null) => {
    if (!value) {
      setSelectedDuration(durationOptions[1]) // Default to medium if deselected
      return
    }
    const option = durationOptions.find(opt => String(opt.value) === value)
    if (!option) {
      setSelectedDuration(durationOptions[1])
      return
    }
    setSelectedDuration(option)
  }
  
  // Calculate estimated time based on enabled modules and video duration
  const calculateEstimatedTime = () => {
    const baseTime = enabledModules.length * 0.5;
    const durationFactor = selectedDuration.timeMultiplier;
    const assemblyTime = 1.5; // Time for video assembly
    
    return (baseTime * durationFactor + assemblyTime).toFixed(1);
  }

  return (
    <TooltipProvider>
    <div className="space-y-6 min-h-[400px]">
        {/* Main container with gradient border */}
        <div className="rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 dark:from-violet-800/30 dark:to-purple-800/30 p-[1px]">
          <div className="rounded-xl bg-card p-5 md:p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-medium">Content Creation Workflow</h3>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>
            
            {/* Video Duration Selection */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Timer className="w-5 h-5 text-primary mr-2" />
                <h4 className="font-medium text-sm">Video Duration</h4>
              </div>
              
              <div className="w-full">
                <Select
                  data={durationSelectOptions}
                  value={String(selectedDuration.value)}
                  onChange={handleDurationChange}
                  title="Choose Duration"
                  allowDeselect={false}
                  className="!rounded-lg border-input hover:border-primary/50 [&.border-purple-500\/50]:border-primary [&.bg-purple-500\/5]:bg-primary/5"
                />
              </div>
            </div>
            
            {/* Step 1: Content Generation */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium mr-2">1</div>
                <h4 className="font-medium text-sm">Content Generation</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {contentModules.map((module, index) => (
                  <motion.div
                    key={module.id}
                    className={cn(
                      "relative flex flex-col rounded-lg overflow-hidden transition-all",
                      module.enabled 
                        ? "opacity-100"
                        : "opacity-50 grayscale"
                    )}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Module header */}
                    <div className={cn(
                      "p-3 flex flex-col items-center text-center",
                      module.color
                    )}>
                      <module.icon className="w-6 h-6 mb-1" />
                      <h5 className="text-sm font-medium leading-tight">{module.label}</h5>
                    </div>
                    
                    {/* Module body */}
                    <div className="p-3 bg-background border-x border-b border-border rounded-b-lg flex flex-col items-center h-full">
                      <p className="text-xs text-center text-muted-foreground">{module.description}</p>
                      
                      {/* Status */}
                      <div className="mt-2 flex justify-center w-full">
                        <span className="inline-flex items-center text-xs text-primary">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Available
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Visualization options */}
              {contentModules.find(m => m.id === 'visuals')?.enabled && (
                <div className="p-4 rounded-lg border border-border bg-muted/10 mb-6">
                  <h4 className="text-sm font-medium mb-3">Visual Creation Options</h4>
                  <Tabs value={selectedVisualization} onValueChange={setSelectedVisualization} className="w-full">
                    <TabsList className="w-full justify-start mb-4">
                      {visualizationOptions.map(option => (
                        <TabsTrigger key={option.id} value={option.id} className="flex items-center gap-1.5">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {visualizationOptions.map(option => (
                        option.id === selectedVisualization && (
                          <motion.div 
                            key={option.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-500 dark:bg-emerald-500/30 dark:text-emerald-400">
                                <option.icon className="w-6 h-6" />
                              </div>
                              <div>
                                <h5 className="font-medium text-sm">{option.label} Content</h5>
                                <p className="text-xs text-muted-foreground">{option.description}</p>
                              </div>
                            </div>
                          </motion.div>
                        )
                      ))}
                    </div>
                  </Tabs>
                </div>
              )}
            </div>
            
            {/* Step 2: Video Assembly (clearly separated) */}
            <div className="mb-6 border-t pt-6 border-border">
              <div className="flex items-center mb-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-medium mr-2">2</div>
                <h4 className="font-medium text-sm">Video Assembly (Optional)</h4>
              </div>
              
              <motion.div
                className="relative flex flex-col rounded-lg overflow-hidden transition-all border border-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-sky-500/90 dark:bg-sky-600/90 text-white flex-shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">Scene to Video Export</h5>
                      <span className="text-xs bg-sky-500/10 text-sky-500 px-2 py-1 rounded">Final Step</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Combine your generated content into a complete video</p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-border bg-background">
                        <Download className="w-3 h-3" />
                        <span>Export Options</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-border bg-background">
                        <Video className="w-3 h-3" />
                        <span>Assembly Templates</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
          
        {/* Workflow summary - Content Selection & Duration */}
        <div className="rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 dark:from-violet-800/30 dark:to-purple-800/30 p-[1px]">
          <div className="rounded-xl bg-card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Left Side - Selected Content */}
              <div className="flex flex-col h-full">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-1.5" />
                    Selected Content: {enabledModules.length}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {enabledModules.map(module => (
                      <div 
                        key={module.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-border bg-background/80"
                      >
                        <module.icon className="w-3 h-3" />
                        <span>{module.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Right Side - Duration */}
              <div className="flex flex-col h-full">
                <div className="flex items-center mb-2">
                  <Timer className="w-4 h-4 text-primary mr-1.5" />
                  <h4 className="text-sm font-medium">Duration</h4>
                </div>
                <div className="flex items-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm border border-border bg-background/80">
                    <span>{selectedDuration.lengthDescription}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Estimated Time (Centered below both containers) */}
            <div className="flex flex-col items-center border-t border-border/40 pt-4 mt-2">
              <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                <Clock className="w-4 h-4 text-primary" />
                <span>Estimated Time</span>
              </div>
              <div className="text-3xl font-bold text-primary">{calculateEstimatedTime()} min</div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
} 