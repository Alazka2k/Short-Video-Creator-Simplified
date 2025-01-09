"use client"

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  isActive: boolean
  onClick: () => void
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  gradient,
  isActive,
  onClick
}: FeatureCardProps) {
  return (
    <motion.button
      className={cn(
        "w-full text-left p-4 rounded-xl transition-all duration-300",
        "hover:bg-accent/5 relative group",
        isActive ? "bg-accent/10" : "bg-transparent"
      )}
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2 rounded-lg transition-all duration-300",
          `bg-gradient-to-br ${gradient}`,
          isActive ? "scale-110" : "scale-100"
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {description}
          </p>
        </div>
        <ChevronRight className={cn(
          "w-4 h-4 transition-transform",
          isActive ? "rotate-90" : "rotate-0"
        )} />
      </div>
    </motion.button>
  )
} 