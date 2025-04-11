'use client'

import { motion } from 'framer-motion'
import { Quote, Youtube } from 'lucide-react'
import { FaTiktok } from 'react-icons/fa'
import { cn } from '@/lib/utils'
import testimonialData from '@/data/testimonials.json'
import Link from 'next/link'
import Image from 'next/image'

interface Channel {
  name: string
  platform: 'youtube' | 'tiktok'
  url: string
  subscribers?: string
  followers?: string
  iconUrl: string
}

interface Testimonial {
  id: number
  name: string
  role: string
  personalImage: string
  channel: Channel
  content: string
  rating: number
}

const PlatformIcon = ({ platform }: { platform: Channel['platform'] }) => {
  switch (platform) {
    case 'youtube':
      return <Youtube className="w-5 h-5 text-red-500" />
    case 'tiktok':
      return <FaTiktok className="w-5 h-5" />
    default:
      return null
  }
}

export function TestimonialsSection() {
  const { testimonials } = testimonialData as { testimonials: Testimonial[] }

  return (
    <section className="relative min-h-screen flex items-center py-24 overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 right-1/3 translate-x-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-3xl opacity-20" />
      
      <div className="container px-4 md:px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4"
          >
            <Quote className="w-4 h-4" />
            <span className="text-sm font-medium">Testimonials</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            Loved by Content Creators
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            See what educators and content creators are saying about our AI-powered video creation platform
          </motion.p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className={cn(
                "relative p-8 rounded-2xl",
                "bg-card hover:shadow-xl transition-all duration-300"
              )}
            >
              {/* Rating Visualization */}
              <div className="mb-6 relative h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(testimonial.rating / 5) * 100}%` }}
                />
              </div>

              {/* Content */}
              <blockquote className="mb-8 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                <p className="text-lg leading-relaxed relative">{testimonial.content}</p>
              </blockquote>

              {/* Author */}
              <footer className="flex flex-col gap-4 relative">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted">
                    <Image
                      src={testimonial.personalImage}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
                <Link 
                  href={testimonial.channel.url}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="group/channel flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={testimonial.channel.iconUrl}
                      alt={testimonial.channel.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <PlatformIcon platform={testimonial.channel.platform} />
                    <span className="text-sm font-medium truncate group-hover/channel:text-primary transition-colors">
                      {testimonial.channel.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({testimonial.channel.subscribers || testimonial.channel.followers})
                    </span>
                  </div>
                </Link>
              </footer>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 