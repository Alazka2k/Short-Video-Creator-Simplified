'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play, ChevronDown } from 'lucide-react'

/**
 * Hero Call-to-Action Component
 * 
 * Primary call-to-action section within the hero area that drives user engagement.
 * Designed to convert visitors into users through compelling action buttons.
 * 
 * Features:
 * - Primary action button for getting started
 * - Secondary action for learning more
 * - Animated entrance effects
 * - Responsive button layout
 * - Hover state animations
 * - Integration with authentication flow
 * 
 * Usage:
 * - Primary button triggers sign-up/login flow
 * - Secondary button scrolls to features section
 * - Tracks click events for analytics (when implemented)
 * 
 * @component
 * @example
 * ```tsx
 * <HeroCTA />
 * ```
 */

export function HeroCTA() {
  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works')
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-wrap gap-4"
      >
        <Button 
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all"
        >
          Start Creating
          <Play className="w-4 h-4 ml-2" />
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className="border-primary/20 hover:bg-primary/10"
          onClick={scrollToHowItWorks}
        >
          Learn More
        </Button>
      </motion.div>
    </div>
  )
} 