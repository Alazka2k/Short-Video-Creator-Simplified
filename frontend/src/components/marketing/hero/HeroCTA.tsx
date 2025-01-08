'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play, ChevronDown } from 'lucide-react'

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
        <Button size="lg" className="gap-2">
          Start Creating
          <Play className="w-4 h-4" />
        </Button>
        <Button size="lg" variant="outline">
          Watch Demo
        </Button>
      </motion.div>

      {/* Learn More Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex justify-center"
      >
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={scrollToHowItWorks}
          className="text-muted-foreground hover:text-primary transition-colors gap-2"
        >
          Learn More
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </Button>
      </motion.div>
    </div>
  )
} 