'use client';

/**
 * Marketing Landing Page
 * 
 * The main entry point and homepage for the video creation platform.
 * Showcases the platform's key features and value proposition to potential users.
 * 
 * Page Sections:
 * - Hero section with main value proposition
 * - Features showcase
 * - How it works / Process steps
 * - Social proof (planned)
 * - Pricing preview (planned)
 * - Final CTA (planned)
 * 
 * Features:
 * - Responsive design for all devices
 * - Animated section transitions
 * - Interactive demonstrations
 * - Performance optimized
 * - SEO friendly structure
 * 
 * Key Components:
 * - HeroSection: Main value proposition
 * - FeaturesSection: Key platform features
 * - ProcessSection: How the platform works
 * 
 * @page
 * @example
 * URL: /
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HeroSection } from '@/components/marketing/hero/HeroSection'
import { ProcessSection } from '@/components/marketing/hero/ProcessSection'
import { LandingFeatures } from '@/components/marketing/hero/LandingFeatures'
import { TestimonialsSection } from '@/components/marketing/hero/TestimonialsSection'

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Enhanced Hero Section */}
      <HeroSection />

      {/* How It Works Section */}
      <ProcessSection />

      {/* Features Section */}
      <LandingFeatures />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="py-24 bg-accent/5">
        <div className="container px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-primary to-primary-foreground">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative px-6 py-24 sm:px-12 lg:px-16">
              <div className="relative mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Start Creating Amazing Videos Today
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg text-white/90">
                  Join thousands of creators who are already using our platform 
                  to produce engaging content at scale.
                </p>
                <div className="mt-10">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="h-12 px-8"
                    >
                      Get Started for Free
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
