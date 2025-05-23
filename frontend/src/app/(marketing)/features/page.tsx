'use client'

//This page summarizes all features and the workflow of the content creation process on a /features page.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ContentGenerationDemo } from '@/components/marketing/features/demos/ContentGenerationDemo'
import { VisualCreationDemo } from '@/components/marketing/features/demos/VisualCreationDemo'
import { VoiceGenerationDemo } from '@/components/marketing/features/demos/VoiceGenerationDemo'
import { SceneAssemblyDemo } from '@/components/marketing/features/demos/SceneAssemblyDemo'
import { ModularWorkflowDemo } from '@/components/marketing/features/demos/ModularWorkflowDemo'
import { PlatformOptimizationDemo } from '@/components/marketing/features/demos/PlatformOptimizationDemo'
import { Brain, Sparkles, Mic, Video, ChevronRight, Settings, Share2, LucideIcon } from 'lucide-react'
import featureData from '@/data/features/feature.json'

// Define types
type DemoComponent = () => JSX.Element;
type IconName = 'Brain' | 'Sparkles' | 'Mic' | 'Video' | 'Settings' | 'Share2';
type DemoType = 'content-generation' | 'visual-creation' | 'voice-generation' | 'scene-assembly' | 'modular-workflow' | 'platform-optimization';

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  gradient?: string; // Make gradient optional since we'll define it in the code
  demoType: DemoType;
  benefits: string[];
}

interface ProcessedFeature extends Omit<FeatureItem, 'icon'> {
  icon: LucideIcon;
  component: DemoComponent;
  gradient: string; // Ensure gradient is required in processed features
}

// Map component imports to demo types
const demoComponents: Record<DemoType, DemoComponent> = {
  'content-generation': ContentGenerationDemo,
  'visual-creation': VisualCreationDemo,
  'voice-generation': VoiceGenerationDemo,
  'scene-assembly': SceneAssemblyDemo,
  'modular-workflow': ModularWorkflowDemo,
  'platform-optimization': PlatformOptimizationDemo
}

// Map icon strings to components
const iconComponents: Record<IconName, LucideIcon> = {
  'Brain': Brain,
  'Sparkles': Sparkles,
  'Mic': Mic,
  'Video': Video,
  'Settings': Settings,
  'Share2': Share2
}

// Define gradient mappings for each feature type
const featureGradients: Record<string, string> = {
  'content-generation': 'from-purple-500 to-indigo-500',
  'visual-creation': 'from-orange-500 to-amber-500',
  'voice-generation': 'from-pink-500 to-rose-500',
  'scene-assembly': 'from-blue-500 to-cyan-500',
  'modular-workflow': 'from-green-500 to-emerald-500',
  'platform-optimization': 'from-red-500 to-rose-500'
}

// Type assertion for the JSON data
const typedFeatureData = featureData.features as unknown as FeatureItem[];

// Process the features data from JSON and add the actual component references
const features: ProcessedFeature[] = typedFeatureData.map(feature => ({
  ...feature,
  icon: iconComponents[feature.icon],
  component: demoComponents[feature.demoType],
  gradient: featureGradients[feature.id] || feature.gradient || 'from-primary to-accent' // Use defined gradient or fallback
}));

export default function FeaturesPage() {
  const [activeFeature, setActiveFeature] = useState(0)
  const ActiveDemoComponent = features[activeFeature].component

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10">
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>
      
      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl -z-20 pointer-events-none"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl -z-20 pointer-events-none"
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Main Content */}
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
                key={feature.id}
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
                    <h3 className="font-semibold truncate flex items-center gap-2 text-foreground">
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
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-2 text-foreground">{features[activeFeature].title}</h2>
                <p className="text-muted-foreground">{features[activeFeature].description}</p>
              </div>

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
                    <span className="text-sm text-foreground">{benefit}</span>
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