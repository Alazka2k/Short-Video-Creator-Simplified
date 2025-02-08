'use client'

import { motion } from 'framer-motion'
import { HeroCTA } from '@/components/marketing/hero/HeroCTA'
import { HeroVideo } from '@/components/marketing/hero/HeroVideo'

/**
 * Hero Section Component
 * 
 * The main landing page hero section that introduces the video creation platform.
 * Combines compelling copy, call-to-action, and visual demonstration.
 * 
 * Features:
 * - Animated entrance effects using Framer Motion
 * - Responsive layout for all screen sizes
 * - Gradient text and background effects
 * - Integration with HeroCTA and HeroVideo components
 * - Background grid pattern with decorative elements
 * 
 * Layout Structure:
 * - Header with animated badge
 * - Main headline with gradient effect
 * - Descriptive subheading
 * - Call-to-action buttons
 * - Video demonstration
 * 
 * @component
 * @example
 * ```tsx
 * <HeroSection />
 * ```
 */

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="container relative px-4 md:px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left column - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-start gap-6 relative"
          >
            
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium">AI-Powered Creation</span>
            </motion.div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Create Engaging{' '}
                <span className="relative">
                  <span className="relative z-10 text-primary">Social Videos</span>
                  <div className="absolute -bottom-2 left-0 right-0 h-3 bg-primary/20 -rotate-1" />
                </span>{' '}
                with AI
              </h1>
              <p className="text-xl text-muted-foreground max-w-[600px] leading-relaxed">
                Transform your ideas into professional short-form videos. Perfect for social media content creators, educators, and businesses.
              </p>
            </div>

            <HeroCTA />

            {/* Feature tags */}
            <div className="flex flex-wrap gap-3 mt-4">
              {['Quick Creation', 'Professional Results', 'Multiple Styles', 'Social Media Ready'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-secondary/50 text-secondary-foreground text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right column - Video preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            {/* Decorative elements */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-secondary/20 rounded-full blur-3xl" />
            </div>

            <HeroVideo />
          </motion.div>
        </div>
      </div>
    </section>
  )
} 