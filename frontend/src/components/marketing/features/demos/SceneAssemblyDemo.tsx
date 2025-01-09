'use client'

import { Music, Mic } from 'lucide-react'
import sceneData from '@/data/features/scenes.json'
import { cn } from '@/lib/utils'

interface Scene {
  id: string
  title: string
  type: 'video' | 'image'
  mediaFile: string
  voiceFile: string
}

interface SceneData {
  scenes: Scene[]
  backgroundMusic: string
}

export function SceneAssemblyDemo() {
  const { scenes, backgroundMusic } = sceneData as SceneData

  return (
    <div className="space-y-6 min-h-[400px]">
      {/* Scenes Grid */}
      <div className="grid grid-cols-3 gap-4">
        {scenes.map((scene) => (
          <div key={scene.id} className="space-y-3">
            {/* Media Preview */}
            <div className="aspect-video rounded-lg bg-accent/5 relative overflow-hidden">
              {scene.type === 'video' ? (
                <>
                  <video 
                    src={scene.mediaFile} 
                    className="absolute inset-0 w-full h-full object-cover"
                    poster={`${scene.mediaFile}.jpg`}
                  />
                  <button className="absolute inset-0 flex items-center justify-center group">
                    <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1" />
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <img 
                    src={scene.mediaFile} 
                    alt={scene.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex gap-2">
                      <button className="flex-1 text-white text-xs bg-primary/90 px-3 py-1.5 rounded-full hover:bg-primary transition-colors">
                        Animate
                      </button>
                      <button className="flex-1 text-white text-xs bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors">
                        Recreate
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Scene Title and Voice Control */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{scene.title}</h3>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/5">
                <button className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <Mic className="w-4 h-4" />
                </button>
                <div className="flex-1 h-1 bg-primary/20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Background Music Control */}
      <div className="p-4 rounded-lg bg-accent/5 space-y-4">
        <div className="flex items-center gap-4">
          <button className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
            <Music className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Background Music</span>
              <span className="text-xs text-muted-foreground">2:15</span>
            </div>
            <div className="h-1 bg-primary/20 rounded-full" />
          </div>
        </div>
        <button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
          Generate Final Video
        </button>
      </div>
    </div>
  )
} 