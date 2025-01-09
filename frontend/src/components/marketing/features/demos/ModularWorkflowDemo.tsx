'use client'

import { cn } from '@/lib/utils'
import { Sparkles, Image, Mic, Music, Video } from 'lucide-react'
import { motion } from 'framer-motion'

const workflowModules = [
  { 
    id: 'content',
    label: 'Content Generation', 
    enabled: true,
    icon: Sparkles,
    description: 'AI-powered script generation'
  },
  { 
    id: 'image',
    label: 'Image Creation', 
    enabled: true,
    icon: Image,
    description: 'Visual asset generation'
  },
  { 
    id: 'voice',
    label: 'Voice Generation', 
    enabled: true,
    icon: Mic,
    description: 'Professional voiceovers'
  },
  { 
    id: 'music',
    label: 'Music Creation', 
    enabled: false,
    icon: Music,
    description: 'Background music'
  },
  { 
    id: 'video',
    label: 'Video Animation', 
    enabled: true,
    icon: Video,
    description: 'Dynamic video effects'
  }
]

export function ModularWorkflowDemo() {
  return (
    <div className="space-y-6 min-h-[400px]">
      <div className="p-6 rounded-lg bg-accent/5">
        <div className="space-y-6">
          {/* Workflow Process */}
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-[2.5rem] left-4 right-4 h-0.5 bg-accent/20">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </div>

            {/* Modules */}
            <div className="relative z-10 flex justify-between">
              {workflowModules.map((module, index) => (
                <motion.div
                  key={module.id}
                  className="space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <motion.button
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all relative",
                      module.enabled 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "bg-accent/10 text-muted-foreground"
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <module.icon className="w-6 h-6" />
                    {module.enabled && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-primary/30"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                  <div className={cn(
                    "text-center transition-colors",
                    module.enabled ? "text-foreground" : "text-muted-foreground"
                  )}>
                    <p className="text-sm font-medium">{module.label}</p>
                    <p className="text-xs mt-1 max-w-[120px] mx-auto">{module.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Module Details */}
          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-accent/10">
              <h3 className="text-sm font-medium mb-2">Active Modules</h3>
              <div className="flex flex-wrap gap-2">
                {workflowModules.filter(m => m.enabled).map(module => (
                  <div 
                    key={module.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                  >
                    <module.icon className="w-3 h-3" />
                    <span>{module.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-accent/10">
              <h3 className="text-sm font-medium mb-2">Estimated Time</h3>
              <div className="text-2xl font-bold text-primary">2-3 min</div>
              <div className="text-xs text-muted-foreground mt-1">Based on selected modules</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 