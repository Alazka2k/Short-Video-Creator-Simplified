'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

export function HeroCTA() {
  return (
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
  )
} 