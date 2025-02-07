'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ContentGenerationDemo } from '@/components/marketing/features/demos/ContentGenerationDemo'
import { VisualCreationDemo } from '@/components/marketing/features/demos/VisualCreationDemo'
import { VoiceGenerationDemo } from '@/components/marketing/features/demos/VoiceGenerationDemo'
import { SceneAssemblyDemo } from '@/components/marketing/features/demos/SceneAssemblyDemo'
import { ModularWorkflowDemo } from '@/components/marketing/features/demos/ModularWorkflowDemo'
import { PlatformOptimizationDemo } from '@/components/marketing/features/demos/PlatformOptimizationDemo'
import { Brain, Sparkles, Mic, Video, ChevronRight, Settings, Share2 } from 'lucide-react'

const features = [
  {
    title: "AI-Powered Content Generation",
    description: "Transform your ideas into engaging content with our advanced AI technology. Create viral-worthy videos for any platform with flexible generation options for each component.",
    icon: Brain,
    gradient: "from-purple-500 to-indigo-500",
    demoType: "content-generation",
    component: ContentGenerationDemo,
    benefits: [
      "Complete video generation pipeline",
      "Flexible service selection (use any combination)",
      "Viral-optimized content creation",
      "Quick iterations and refinements"
    ]
  },
  {
    title: "Visual Creation",
    description: "Generate stunning visuals in multiple styles and formats. Choose from various artistic styles, shot types, and animation options for each scene.",
    icon: Sparkles,
    gradient: "from-orange-500 to-amber-500",
    demoType: "visual-creation",
    component: VisualCreationDemo,
    benefits: [
      "Multiple artist style options",
      "Various shot styles (photorealistic, cinematic)",
      "Flexible aspect ratios",
      "Custom style parameters"
    ]
  },
  {
    title: "Voice Generation",
    description: "Access state-of-the-art AI voices for professional narration. Choose from a variety of voices and styles to match your content's tone perfectly.",
    icon: Mic,
    gradient: "from-pink-500 to-rose-500",
    demoType: "voice-generation",
    component: VoiceGenerationDemo,
    benefits: [
      "Professional AI voices",
      "Multiple voice options",
      "Natural speech patterns",
      "Voice sample preview"
    ]
  },
  {
    title: "Scene Assembly",
    description: "Create dynamic videos with our flexible scene system. Generate and combine video segments seamlessly with smart transitions.",
    icon: Video,
    gradient: "from-blue-500 to-cyan-500",
    demoType: "scene-assembly",
    component: SceneAssemblyDemo,
    benefits: [
      "Flexible scene arrangement",
      "Smart transitions",
      "Background music integration",
      "Voice-over synchronization"
    ]
  },
  {
    title: "Modular Workflow",
    description: "Customize your video creation process. Enable or disable components as needed for your specific use case.",
    icon: Settings,
    gradient: "from-green-500 to-emerald-500",
    demoType: "modular-workflow",
    component: ModularWorkflowDemo,
    benefits: [
      "Flexible component selection",
      "Customizable workflow",
      "Process visualization",
      "Efficient pipeline"
    ]
  },
  {
    title: "Platform Optimization",
    description: "Export your videos in the perfect format for any platform. Optimize for social media, streaming, or download.",
    icon: Share2,
    gradient: "from-red-500 to-rose-500",
    demoType: "platform-optimization",
    component: PlatformOptimizationDemo,
    benefits: [
      "Multi-platform support",
      "Format optimization",
      "Quality settings",
      "Direct sharing options"
    ]
  }
]

export default function FeaturesPage() {
  const [activeFeature, setActiveFeature] = useState(0)
  const ActiveDemoComponent = features[activeFeature].component

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="flex-1 flex">
        {/* Feature Navigation */}
        <div className="w-[400px] border-r bg-background/50 p-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Create Content That Stands Out
            </h1>
            <p className="text-lg text-muted-foreground">
              Our AI-powered platform offers complete flexibility in video creation. Generate viral-worthy content with customizable components - use what you need, skip what you don't.
            </p>
          </div>

          <div className="space-y-2">
            {features.map((feature, index) => (
              <button
                key={feature.title}
                onClick={() => setActiveFeature(index)}
                className={cn(
                  "w-full text-left p-4 rounded-xl transition-all duration-300",
                  "hover:bg-accent/5 relative group",
                  activeFeature === index ? "bg-accent/10" : "bg-transparent"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-300",
                    `bg-gradient-to-br ${feature.gradient}`,
                    activeFeature === index ? "scale-110" : "scale-100"
                  )}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate flex items-center gap-2">
                      {feature.title}
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform",
                        activeFeature === index ? "rotate-90" : ""
                      )} />
                    </h3>
                    <p className={cn(
                      "text-sm text-muted-foreground line-clamp-2 mt-1 transition-all",
                      activeFeature === index ? "opacity-100" : "opacity-0 h-0"
                    )}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Content */}
        <div className="flex-1 p-8">
          <motion.div
            key={activeFeature}
            className="h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6">{features[activeFeature].title}</h2>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {features[activeFeature].benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      `bg-gradient-to-br ${features[activeFeature].gradient}`
                    )}>
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              {/* Feature Demo */}
              <div className="bg-card rounded-2xl border p-8">
                <ActiveDemoComponent />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 