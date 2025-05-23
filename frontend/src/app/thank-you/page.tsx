//After Go live content needs to be changed

"use client"

import { Sparkles } from "lucide-react"
import { motion } from "framer-motion"

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background px-4">
      {/* Modern gradient background (copied from marketing layout, no header/footer) */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Primary gradient blob */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        {/* Accent blobs */}
        <div className="absolute -top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-lg w-full text-center bg-card/80 rounded-2xl shadow-xl p-10 border border-border/40"
      >
        <div className="flex justify-center mb-4">
          <Sparkles className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Thank You for Confirming!</h1>
        <p className="text-lg text-muted-foreground mb-6">
          You're officially on the Narravid waitlist. 🎉<br />
          We'll keep you updated with early access, product news, and exclusive tips.
        </p>
        <div className="mt-8 text-sm text-muted-foreground">
          <span>Want to learn more? </span>
          <a href="/" className="text-accent hover:underline">Return to homepage</a>
        </div>
      </motion.div>
    </div>
  )
}
