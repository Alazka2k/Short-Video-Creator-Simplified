/**
 * Features Section Component
 * 
 * A modern, animated grid layout showcasing the key features of the video creation platform.
 * This component includes:
 * - Animated feature cards with icons and descriptions
 * - Responsive grid layout (1 column on mobile, 2 columns on desktop)
 * - Hover effects and transitions
 * - Framer Motion animations for smooth entry
 * 
 * Features displayed:
 * - Scene-Based Creation
 * - AI-Powered Generation
 * - Multi-Platform Ready
 * - Fine-Tuning Control
 * 
 * @component
 * @example
 * ```tsx
 * <FeaturesSection />
 * ```
 */

"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Wand2, Video, Sparkles, Brain, Share2, Clock, Settings, Mic } from 'lucide-react'
import { FeatureCard } from './FeatureCard'
import { FeatureDemo } from './FeatureDemo'

interface Feature {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  benefits: string[]
  demoType: 'content-generation' | 'visual-creation' | 'voice-generation' | 
            'music-creation' | 'scene-assembly' | 'platform-optimization' | 
            'modular-workflow' | 'fine-tuning'
}

const features: Feature[] = [
  {
    title: "AI-Powered Content Generation",
    description: "Transform your ideas into engaging content with our advanced AI technology. Create viral-worthy videos for any platform with flexible generation options for each component.",
    icon: Brain,
    gradient: "from-purple-500 to-indigo-500",
    demoType: "content-generation",
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
    benefits: [
      "Flexible scene ordering",
      "Smart transitions",
      "Audio synchronization",
      "Duration control"
    ]
  },
  {
    title: "Platform Optimization",
    description: "Create content perfectly formatted for any platform. Automatically optimize for YouTube Shorts, TikTok, Instagram Reels, and more.",
    icon: Share2,
    gradient: "from-green-500 to-emerald-500",
    demoType: "platform-optimization",
    benefits: [
      "Multi-platform support",
      "Automatic format optimization",
      "Platform-specific features",
      "Export presets"
    ]
  },
  {
    title: "Workflow Customization",
    description: "Choose exactly what you need. Skip or include any service - from image generation to voice-over to music creation.",
    icon: Settings,
    gradient: "from-violet-500 to-purple-500",
    demoType: "modular-workflow",
    benefits: [
      "Service selection flexibility",
      "Component-level control",
      "Custom workflows",
      "Process automation"
    ]
  }
]

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState<number>(0)

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10">
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>
      
      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
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
        className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl"
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

      <div className="container px-4 py-24 mx-auto relative">
        {/* Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-32"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium">Explore Our Features</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Create Content That Stands Out
          </h1>
          <p className="text-xl text-muted-foreground">
            Our AI-powered platform offers complete flexibility in video creation. Generate viral-worthy content with customizable components - use what you need, skip what you don't.
          </p>
        </motion.div>

        {/* Interactive Feature Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-32">
          {/* Feature Navigation */}
          <div className="lg:col-span-4 space-y-2">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                isActive={activeFeature === index}
                onClick={() => setActiveFeature(index)}
              />
            ))}
          </div>

          {/* Feature Details */}
          <div className="lg:col-span-8">
            <motion.div
              key={activeFeature}
              className="bg-card rounded-2xl p-8 border relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Gradient decoration */}
              <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${features[activeFeature].gradient}`} />
              
              <div className="relative">
                <h2 className="text-3xl font-bold mb-4">{features[activeFeature].title}</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  {features[activeFeature].description}
                </p>

                {/* Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {features[activeFeature].benefits.map((benefit, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${features[activeFeature].gradient} shrink-0`}>
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <span>{benefit}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Interactive Demo */}
                <FeatureDemo type={features[activeFeature].demoType} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* CTA Section */}
        <motion.div 
          className="text-center relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl -z-10" />
          <div className="inline-flex items-center gap-2 text-muted-foreground mb-4">
            <Clock className="w-4 h-4" />
            <span>Start creating videos in minutes, not hours</span>
          </div>
          <h2 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Ready to Transform Your Content Creation?
          </h2>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a 
              href="/signup" 
              className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent px-8 font-medium text-white transition-all hover:shadow-lg hover:brightness-110"
            >
              Get Started for Free
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
} 