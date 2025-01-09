'use client'

import { cn } from '@/lib/utils'
import visualConfig from '@/data/features/visual-creation.json'
import { useState } from 'react'

export function VisualCreationDemo() {
  const [selectedArtist, setSelectedArtist] = useState(visualConfig.artistStyles[0].id)
  const [currentSample, setCurrentSample] = useState(0)
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(visualConfig.aspectRatios[0].id)

  return (
    <div className="space-y-6 min-h-[400px]">
      <div className="grid grid-cols-2 gap-4">
        {/* Artist Style */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-accent/5">
            <h4 className="font-medium mb-2">Artist Style</h4>
            <select 
              className="w-full bg-transparent border-none text-sm text-muted-foreground focus:outline-none"
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
            >
              {visualConfig.artistStyles.map(artist => (
                <option key={artist.id} value={artist.id}>{artist.name}</option>
              ))}
            </select>
          </div>
          {/* Artist Sample Preview */}
          <div className="aspect-video rounded-lg overflow-hidden bg-accent/5 relative">
            {visualConfig.artistStyles.map(artist => (
              artist.id === selectedArtist && (
                <div key={artist.id} className="absolute inset-0">
                  <img 
                    src={artist.samples[currentSample]} 
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-center gap-2">
                    {artist.samples.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSample(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          currentSample === index ? "bg-primary" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Shot Style */}
        <div className="p-4 rounded-lg bg-accent/5">
          <h4 className="font-medium mb-2">Shot Style</h4>
          <select className="w-full bg-transparent border-none text-sm text-muted-foreground focus:outline-none">
            {visualConfig.shotStyles.map(style => (
              <option key={style.id} value={style.id}>{style.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="p-4 rounded-lg bg-accent/5">
        <h4 className="font-medium mb-4">Aspect Ratio</h4>
        <div className="flex gap-4">
          {visualConfig.aspectRatios.map(ratio => (
            <button
              key={ratio.id}
              onClick={() => setSelectedAspectRatio(ratio.id)}
              className={cn(
                "group flex-1 p-2 rounded-lg transition-colors",
                selectedAspectRatio === ratio.id ? "bg-primary/20" : "bg-accent/10 hover:bg-accent/20"
              )}
            >
              <div className="flex justify-center mb-2">
                <div 
                  className={cn(
                    "bg-accent/20 rounded overflow-hidden transition-transform group-hover:scale-105",
                    selectedAspectRatio === ratio.id && "ring-2 ring-primary"
                  )}
                  style={{ 
                    width: ratio.width * 12, 
                    height: ratio.height * 12,
                    maxWidth: '120px',
                    maxHeight: '120px'
                  }}
                >
                  <img 
                    src={ratio.preview} 
                    alt={ratio.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="text-center">
                <span className="text-xs font-medium">{ratio.name}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {ratio.width}:{ratio.height}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 