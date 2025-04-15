"use client"

/**
 * Prelaunch Landing Page
 * 
 * A visually dynamic landing page that showcases the brand essence of "Futuristic Creativity Meets Effortless Simplicity"
 * while capturing leads through an engaging, motion-rich experience.
 * 
 * Page Sections:
 * - HERO SECTION: Bold value proposition with newsletter signup and animated elements
 * - PROBLEM SECTION: Emotional problem statement with visual reinforcement
 * - SOLUTION SECTION: Branded solution highlights with motion effects
 * - SOCIAL PROOF SECTION: Waiting list size and FAQ with visual elements
 * - CALL TO ACTION SECTION: Motion-enhanced newsletter signup
 * 
 * @page
 * @example
 * URL: /
 */

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Sparkles, Clock, Wand2, LayoutGrid, ArrowRight } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function Home() {
  const [showSignupModal, setShowSignupModal] = useState(false)
  
  const openSignupModal = () => setShowSignupModal(true)
  const closeSignupModal = () => setShowSignupModal(false)
  
  return (
    <div className="flex flex-col relative">
      {/* Animated particles background */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        
        {/* Floating gradient orbs */}
        <motion.div
          className="absolute -top-20 right-1/3 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl"
          animate={{
            y: [0, 40, 0],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl"
          animate={{
            y: [0, -40, 0],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* HERO SECTION */}
      <section className="py-24 md:py-32 overflow-hidden">
        <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-12">
          <motion.div 
            className="relative flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Pulsing dot */}
            <motion.div
              className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex items-center justify-center"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-3 h-3 bg-accent/70 rounded-full relative">
                <div className="absolute inset-0 bg-accent/70 rounded-full animate-ping opacity-75"></div>
              </div>
            </motion.div>
            
            <div className="inline-flex items-center rounded-full border bg-background/95 px-4 py-1.5 text-sm font-medium mb-6">
              <span className="text-accent">Coming Soon</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter max-w-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-accent to-secondary">
              Turn Prompts Into Visual Stories
            </h1>

            <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-2xl">
              Narravid is your storytelling engine – transform an idea into video scenes with voice, visuals, music, and animation.
            </p>
          </motion.div>
          
          {/* Demo reel preview */}
          <motion.div 
            className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border border-border/40 shadow-xl bg-card/30 backdrop-blur-sm"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative w-full aspect-video">
              {/* Replace with your actual demo reel or preview image */}
              <Image 
                src="/prelaunch/demo-reel-preview.jpg" 
                alt="Narravid Demo Reel"
                width={1200}
                height={675}
                className="w-full h-full object-cover"
                priority
              />
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-accent/90 backdrop-blur-sm cursor-not-allowed">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                  <div className="absolute inset-0 rounded-full border border-white/20 animate-ping"></div>
                </div>
              </div>
            </div>

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none"></div>
          </motion.div>
          
          {/* CTA Button instead of inline form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="w-full max-w-md mx-auto flex flex-col items-center"
            whileHover={{ scale: 1.02 }}
          >
            <Button 
              size="lg" 
              onClick={openSignupModal}
              className="group bg-background hover:bg-background/90 text-foreground border border-accent/30 transition-all duration-300 hover:shadow-md hover:border-accent hover:shadow-accent/10 text-lg px-8 py-6 h-auto"
            >
              <span>Get Early Access</span>
              <ArrowRight className="ml-2 h-5 w-5 text-accent transition-transform group-hover:translate-x-1" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Join over 143 creators on our waitlist
            </p>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-20 bg-accent/5 relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Creating video content takes too long.</h2>
            <p className="text-xl text-muted-foreground">
              Tools are complicated. Costs are high. Creativity is limited.
            </p>
          </motion.div>

          {/* Visual representation of the problem */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex flex-col items-center p-6 bg-card/40 rounded-xl border border-border/40 backdrop-blur-sm"
            >
              <div className="p-3 bg-accent/10 rounded-full mb-4">
                <Clock className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Time-Consuming</h3>
              <p className="text-muted-foreground">
                Hours spent on scripting, voiceovers, visuals, and editing.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex flex-col items-center p-6 bg-card/40 rounded-xl border border-border/40 backdrop-blur-sm"
            >
              <div className="p-3 bg-accent/10 rounded-full mb-4">
                <LayoutGrid className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Inflexible Tools</h3>
              <p className="text-muted-foreground">
                Limited creative control and fixed templates that restrict style.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex flex-col items-center p-6 bg-card/40 rounded-xl border border-border/40 backdrop-blur-sm"
            >
              <div className="p-3 bg-accent/10 rounded-full mb-4">
                <Wand2 className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Limited Results</h3>
              <p className="text-muted-foreground">
                Disappointing quality that doesn't match your creative vision.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section className="py-24 relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Solution</h2>
            <p className="text-xl text-muted-foreground">
              Narravid combines storytelling power with flexible AI to create engaging content in minutes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                title: "Minutes, not hours",
                description: "From concept to finished video in a fraction of the usual time.",
                icon: "⚡"
              },
              {
                title: "Modular control or full automation",
                description: "Choose between customizing every component or generating entire scenes at once.",
                icon: "🧩"
              },
              {
                title: "Stylized output in your own aesthetic",
                description: "Multiple visual styles to match your brand and creative vision.",
                icon: "✨"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex flex-col items-center text-center p-8 rounded-2xl border border-border/40 bg-gradient-to-b from-card/50 to-card/30 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF SECTION */}
      <section className="py-20 bg-accent/5 relative overflow-hidden">
        <div className="container px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center rounded-full border bg-background/70 px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur-sm">
              <span className="text-accent">Join the Waitlist</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Over <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-accent">143</span> Creators Are Already Waiting
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
                className="p-6 rounded-xl border border-border/40 backdrop-blur-sm bg-card/40 text-left"
              >
                <h3 className="text-xl font-semibold mb-3">When Will It Launch?</h3>
                <p className="text-muted-foreground">
                  Our official launch is planned for Q2 2025. Early access users will get priority access starting in Q1 2025.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
                className="p-6 rounded-xl border border-border/40 backdrop-blur-sm bg-card/40 text-left"
              >
                <h3 className="text-xl font-semibold mb-3">What Happens With My Email?</h3>
                <p className="text-muted-foreground">
                  You'll receive a confirmation and later exclusive access to early launch with special pricing and premium features.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CALL TO ACTION SECTION */}
      <section className="py-24">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold">Be Among the First</h2>
            <p className="text-xl text-muted-foreground">
              Secure your spot on the waitlist and benefit from exclusive advantages for early adopters.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="mt-8"
            >
              <Button 
                size="lg" 
                onClick={openSignupModal}
                className="group bg-background hover:bg-background/90 text-foreground border border-accent/30 transition-all duration-300 hover:shadow-md hover:border-accent hover:shadow-accent/10 text-lg px-8 py-6 h-auto"
              >
                <span>Get Early Access</span>
                <ArrowRight className="ml-2 h-5 w-5 text-accent transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Signup Modal */}
      <Dialog open={showSignupModal} onOpenChange={closeSignupModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span>Secure Your Early Access</span>
            </DialogTitle>
            <DialogDescription>
              Join over 143 creators on our waitlist and be among the first to experience Narravid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* REPLACE THIS FORM with Beehiiv embed code */}
            <div className="flex flex-col space-y-4">
              <input 
                type="email" 
                placeholder="Your Email Address" 
                className="w-full p-3 bg-background/70 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                autoFocus
              />
              <Button 
                type="submit"
                size="lg" 
                className="w-full bg-background text-foreground border border-accent/30 hover:bg-background/90 hover:border-accent transition-all duration-300 hover:shadow-md hover:shadow-accent/10"
              >
                Join the Waitlist
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              By inserting your email you confirm you agree to Narravid contacting you about our product and services. You can opt out at any time by clicking unsubscribe in our emails. Find out more about how we use data in our <a href="/privacy-policy" className="text-accent hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
