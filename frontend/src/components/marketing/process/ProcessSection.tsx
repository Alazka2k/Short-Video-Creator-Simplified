'use client'

import { motion } from 'framer-motion'
import { Lightbulb, Wand2, Sliders, Share } from 'lucide-react'
import { cn } from '@/lib/utils'

const PROCESS_STEPS = [
  {
    icon: Lightbulb,
    title: 'Share Your Idea',
    description: 'Start with your content idea or topic. Our AI understands your vision and helps refine it.',
  },
  {
    icon: Wand2,
    title: 'AI Magic Happens',
    description: 'Our AI generates your script, creates visuals, and produces professional voiceovers.',
  },
  {
    icon: Sliders,
    title: 'Review & Customize',
    description: 'Preview your video and make adjustments. Fine-tune every aspect until it is perfect.',
  },
  {
    icon: Share,
    title: 'Share & Grow',
    description: 'Download your video and share it across social media platforms to grow your audience.',
  },
]

export function ProcessSection() {
  return (
    <section className="py-24 bg-accent/5">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create engaging videos in four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {PROCESS_STEPS.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Connector Line */}
              {index < PROCESS_STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] right-0 h-0.5 bg-border/60" />
              )}

              <div className="relative bg-card rounded-xl p-6 shadow-sm">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="pt-4">
                  <div className="mb-4 p-3 rounded-xl bg-primary/10 w-fit">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 