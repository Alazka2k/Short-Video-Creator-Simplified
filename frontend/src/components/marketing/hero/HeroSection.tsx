'use client'

import { motion } from 'framer-motion'
import { HeroCTA } from '@/components/marketing/hero/HeroCTA'
import { HeroVideo } from '@/components/marketing/hero/HeroVideo'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-accent/5">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-accent/5" />

      <div className="container relative px-4 md:px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left column - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-start gap-4"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Create Engaging{' '}
              <span className="text-primary">Social Videos</span>{' '}
              with AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-[600px]">
              Transform your ideas into professional short-form videos. Perfect for social media content creators, educators, and businesses.
            </p>
            <HeroCTA />
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