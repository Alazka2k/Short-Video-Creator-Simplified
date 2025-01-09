"use client"

import { motion } from "framer-motion"
import { 
  Wand2,
  Sparkles,
  Film,
  Share2,
  Clock,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"

const keyFeatures = [
  {
    title: "AI-Powered End-to-End",
    description: "From script to final video, our AI handles every aspect of content creation",
    icon: Wand2
  },
  {
    title: "100% Royalty-Free",
    description: "All generated content is uniquely created for your project with full usage rights",
    icon: Shield
  },
  {
    title: "Unlimited Iterations",
    description: "Refine and regenerate content until it's perfect, at no additional cost",
    icon: Clock
  }
]

const features = [
  {
    name: "AI-Powered Creation",
    description: "Transform your ideas into engaging content with our advanced AI technology.",
    icon: Wand2
  },
  {
    name: "Professional Visuals",
    description: "Generate stunning visuals that capture attention and convey your message effectively.",
    icon: Sparkles
  },
  {
    name: "Quick Assembly",
    description: "Automatically combine your scenes into a polished video with smart transitions.",
    icon: Film
  },
  {
    name: "Easy Sharing",
    description: "Download your videos and share them directly to popular social media platforms.",
    icon: Share2
  },
  {
    name: "Fast Turnaround",
    description: "Generate content quickly without compromising on quality.",
    icon: Clock
  },
  {
    name: "100% Royalty-Free",
    description: "All generated content - including images, music, and voices - is uniquely yours.",
    icon: Shield
  }
]

export function LandingFeatures() {
  return (
    <section className="py-24 bg-accent/5">
      <div className="container px-4 md:px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium">Platform Features</span>
          </motion.div>

          <motion.h2 
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Everything You Need to Create
            <br />
            Amazing Videos
          </motion.h2>
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Our platform combines powerful AI features with an intuitive interface
            to help you create professional videos in minutes
          </motion.p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative p-8 rounded-xl bg-card hover:bg-accent/5 transition-colors border border-border/50">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-primary/10 text-primary">
                  <feature.icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
                <p className="text-muted-foreground">{feature.description}</p>

                {/* Hover decoration */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent/20 rounded-xl transition-colors duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 