'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { LoginForm } from "@/components/auth/login-form"
import { SignupForm } from "@/components/auth/signup-form"
import { useAuth } from "@/lib/hooks/useAuth"

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
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const handleCreateClick = () => {
    if (isAuthenticated) {
      router.push('/create')
    } else {
      // Redirect to login with return URL
      router.push(`/login?returnTo=${encodeURIComponent('/create')}`)
    }
  }

  const handleLearnMoreClick = () => {
    router.push('/features')
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
          onClick={handleCreateClick}
          className="bg-gradient-animate hover:shadow-glow transition-all duration-300
                   bg-primary hover:bg-primary/90 text-primary-foreground 
                   shadow-lg shadow-primary/25 hover:shadow-primary/35"
        >
          Start Creating
          <Play className="w-4 h-4 ml-2" />
        </Button>
        
        <Button 
          size="lg" 
          variant="outline" 
          onClick={handleLearnMoreClick}
          className="border-primary/20 hover:bg-primary/10 transition-all duration-300"
        >
          Learn More
        </Button>
      </motion.div>
    </div>
  )
} 