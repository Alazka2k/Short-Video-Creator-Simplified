'use client'

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { 
  MessageSquare,
  Wand2,
  Pencil,
  Share2,
} from "lucide-react"

const steps = [
  {
    icon: MessageSquare,
    title: "Share Your Idea",
    description: "Tell us what you want to create - from educational content to engaging stories.",
  },
  {
    icon: Wand2,
    title: "AI Magic Happens",
    description: "Our AI generates professional visuals, voice, and music for your content.",
  },
  {
    icon: Pencil,
    title: "Review & Customize",
    description: "Preview and fine-tune each scene until it's perfect for your audience.",
  },
  {
    icon: Share2,
    title: "Share & Grow",
    description: "Publish your content across platforms and watch your audience grow.",
  },
]

/**
 * Process Section Component
 * 
 * Displays the step-by-step process of creating videos using the platform.
 * Uses a visual timeline approach to explain the workflow to users.
 * 
 * Features:
 * - Animated step reveals on scroll
 * - Numbered steps with icons
 * - Responsive layout adaptation
 * - Visual connection between steps
 * - Gradient accents and hover effects
 * 
 * Process Steps:
 * 1. Input your idea/prompt
 * 2. AI generates content
 * 3. Review and customize
 * 4. Export and share
 * 
 * Visual Elements:
 * - Step numbers with gradient backgrounds
 * - Descriptive icons for each step
 * - Connecting lines between steps
 * - Hover state enhancements
 * 
 * @component
 * @example
 * ```tsx
 * <ProcessSection />
 * ```
 */

export function ProcessSection() {
  return (
    <section className="min-h-screen flex items-center relative py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl opacity-50" />
      </div>

      <div className="container px-4 md:px-6 relative">
        {/* Section header */}
        <div className="text-center mb-24">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium">The Process</span>
          </motion.div>

          <motion.h2 
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Create professional videos in four simple steps
          </motion.p>
        </div>

        {/* Steps grid with connecting lines */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Connecting lines */}
          <div className="absolute hidden lg:block left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 transform -translate-y-1/2" />
          
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="relative p-8 rounded-2xl bg-card hover:bg-accent/5 transition-colors border border-border/50 shadow-lg">
                {/* Step number */}
                <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-white font-semibold text-sm">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={cn(
                  "w-16 h-16 rounded-xl mb-6 flex items-center justify-center",
                  "bg-gradient-to-br shadow-lg transform-gpu transition-transform group-hover:scale-110",
                  index === 0 ? "from-violet-500 to-purple-500" :
                  index === 1 ? "from-blue-500 to-violet-500" :
                  index === 2 ? "from-indigo-500 to-blue-500" :
                  "from-purple-500 to-pink-500"
                )}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-muted-foreground text-lg">{step.description}</p>

                {/* Hover decoration */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-2xl transition-colors duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 