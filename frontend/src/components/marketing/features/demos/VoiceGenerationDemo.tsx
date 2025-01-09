'use client'

import { motion } from 'framer-motion'
import voiceData from '@/data/features/voices.json'
import { cn } from '@/lib/utils'

export function VoiceGenerationDemo() {
  return (
    <div className="space-y-6 min-h-[400px]">
      <div className="p-4 rounded-lg bg-accent/5">
        <h4 className="font-medium mb-4">Available Voices</h4>
        <div className="space-y-4">
          {voiceData.voices.map((voice, i) => (
            <div key={voice.id} className="p-4 rounded-lg hover:bg-accent/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  >
                    🎤
                  </motion.div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium">{voice.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">- {voice.description}</span>
                    </div>
                    <button className="text-xs text-primary hover:underline">
                      Play Sample
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {voice.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 h-1 bg-primary/20 rounded-full mt-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 