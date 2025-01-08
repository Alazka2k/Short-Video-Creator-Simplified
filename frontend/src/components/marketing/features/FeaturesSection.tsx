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

import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { 
  Wand2,
  TrendingUp,
  Clock,
  Layout,
  ChevronRight,
  Sparkles,
  Layers,
  Share2,
  Sliders,
} from "lucide-react"

const features = [
  {
    name: 'Scene-Based Creation',
    description: 'Create content scene by scene with AI-generated visuals and professional voiceovers.',
    icon: Layers,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    name: 'AI-Powered Generation',
    description: 'Transform your ideas into engaging content with advanced AI for visuals, voice, and music.',
    icon: Wand2,
    gradient: "from-blue-500 to-violet-500",
  },
  {
    name: 'Multi-Platform Ready',
    description: 'Export optimized content for TikTok, Instagram, YouTube and other social platforms.',
    icon: Share2,
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    name: 'Fine-Tuning Control',
    description: 'Customize every aspect of your content from visuals to voiceovers and music.',
    icon: Sliders,
    gradient: "from-purple-500 to-pink-500",
  },
]

export function FeaturesSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="container relative px-4 md:px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Key Features</span>
          </motion.div>

          <motion.h2 
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-foreground to-primary"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Powerful Features
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Everything you need to create engaging social media content at scale
          </motion.p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative p-8 rounded-2xl bg-card hover:bg-accent/5 transition-all duration-300 border border-border/50 hover:shadow-lg hover:-translate-y-1">
                {/* Icon */}
                <div className={cn(
                  "w-16 h-16 rounded-2xl mb-6 flex items-center justify-center transform-gpu transition-transform group-hover:scale-110",
                  "bg-gradient-to-br shadow-lg",
                  feature.gradient
                )}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-semibold mb-4">{feature.name}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{feature.description}</p>

                {/* Hover decoration */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-2xl transition-colors duration-300" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Features link */}
        <motion.div 
          className="flex justify-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link 
            href="/features" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            View All Features
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
} 