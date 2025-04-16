'use client'

import { motion, useScroll, useTransform } from "framer-motion"
import processData from "@/data/marketing/process.json"
import { Share2Icon, Wand2Icon, PencilIcon, RocketIcon } from "lucide-react"
import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"

const STEP_ICONS = {
  "share-idea": Share2Icon,
  "ai-magic": Wand2Icon,
  "review-customize": PencilIcon,
  "share-grow": RocketIcon,
} as const;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 60%", "end 40%"],
  });
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Handle mounting state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="py-24 bg-accent/5">
      <div className="container">
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
            <span className="text-sm font-medium">How It Works</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold"
          >
            Create Professional Videos in Minutes
          </motion.h2>
        </div>

        <div ref={containerRef} className="relative max-w-5xl mx-auto">
          {/* Timeline Line */}
          <div className="absolute left-8 md:left-1/2 top-0 w-px h-full bg-border -translate-x-px" />
          
          {/* Progress Line */}
          <motion.div 
            className="absolute left-8 md:left-1/2 top-0 w-px bg-primary -translate-x-px origin-top"
            style={{ height: "100%", scaleY: progress }}
          />

          <div className="space-y-16 md:space-y-24">
            {processData.steps.map((step, index) => {
              const Icon = STEP_ICONS[step.id as keyof typeof STEP_ICONS];
              
              // Only show images after component is mounted to prevent hydration issues
              // Default to light theme images during SSR
              let imagePath = step.imagePath.light;
              
              // After mounting, use the resolvedTheme to determine the image path
              if (mounted) {
                imagePath = resolvedTheme === 'dark' 
                  ? step.imagePath.dark 
                  : step.imagePath.light;
              }
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: index * 0.2 }}
                  className={`relative grid md:grid-cols-2 md:gap-16 items-center ${
                    index % 2 === 1 ? "md:rtl" : ""
                  }`}
                >
                  {/* Timeline Dot */}
                  <div 
                    className={`absolute left-8 md:left-1/2 top-0 w-4 h-4 rounded-full bg-background border-2 border-primary -translate-x-[7px] ${
                      index % 2 === 1 ? "md:-translate-x-[7px]" : "md:-translate-x-[7px]"
                    }`}
                  />

                  <div className={`${index % 2 === 1 ? "md:text-right md:pr-8" : "md:pl-8"}`}>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card mb-6">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>

                  <div className={index % 2 === 1 ? "md:pl-8" : "md:pr-8"}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="relative aspect-video rounded-xl overflow-hidden bg-card"
                    >
                      {mounted && (
                        <Image
                          src={imagePath}
                          alt={step.title}
                          fill
                          className="object-cover"
                          priority={index < 2} // Prioritize loading of the first two images
                        />
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
} 