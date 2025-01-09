"use client"

import { motion } from 'framer-motion'
import { Sparkles, Video, Music, Image, Mic, Settings, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import voiceData from '@/data/features/voices.json'
import sceneData from '@/data/features/scenes.json'
import contentGenConfig from '@/data/features/content-generation.json'
import visualConfig from '@/data/features/visual-creation.json'
import { useState, useRef, useEffect } from 'react'

interface DemoProps {
  type: 'content-generation' | 'visual-creation' | 'voice-generation' | 
        'music-creation' | 'scene-assembly' | 'platform-optimization' | 
        'modular-workflow' | 'fine-tuning'
}

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

export function FeatureDemo({ type }: DemoProps) {
  // Move hooks to component level
  const [enabledServices, setEnabledServices] = useState(
    contentGenConfig.services.reduce((acc, service) => ({
      ...acc,
      [service.id]: service.defaultEnabled
    }), {} as Record<string, boolean>)
  )
  const [selectedVisualization, setSelectedVisualization] = useState<'plain' | 'video' | 'animation' | null>(null)
  const [progress, setProgress] = useState(0)
  const [selectedArtist, setSelectedArtist] = useState(visualConfig.artistStyles[0].id)
  const [currentSample, setCurrentSample] = useState(0)
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(visualConfig.aspectRatios[0].id)

  // Progress animation effect
  useEffect(() => {
    if (type === 'content-generation') {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 0
          return prev + 1
        })
      }, 100)
      return () => clearInterval(timer)
    }
  }, [type])

  const toggleService = (serviceId: string) => {
    const service = contentGenConfig.services.find(s => s.id === serviceId)
    if (!service || service.required) return

    if (service.id === 'image' && enabledServices[service.id]) {
      // If disabling image, also disable video
      setEnabledServices(prev => ({
        ...prev,
        [service.id]: false,
        video: false
      }))
      setSelectedVisualization(null)
    } else {
      setEnabledServices(prev => ({
        ...prev,
        [service.id]: !prev[service.id]
      }))
    }
  }

  const getDemoContent = () => {
    switch (type) {
      case 'content-generation':
        return (
          <div className="space-y-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-accent/5">
                <h4 className="font-medium mb-2">Video Idea</h4>
                <input 
                  type="text" 
                  value="Top 5 history moments"
                  readOnly
                  className="w-full bg-transparent border-none text-sm text-muted-foreground focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-accent/5">
                  <h4 className="font-medium mb-2">Scene Amount</h4>
                  <select className="w-full bg-transparent border-none text-sm text-muted-foreground focus:outline-none">
                    {contentGenConfig.sceneAmounts.map(amount => (
                      <option key={amount.value} value={amount.value}>{amount.label}</option>
                    ))}
                  </select>
                </div>
                <div className="p-4 rounded-lg bg-accent/5">
                  <h4 className="font-medium mb-2">Focus</h4>
                  <input 
                    type="text" 
                    value="Focus on both positive and negative impacts"
                    readOnly
                    className="w-full bg-transparent border-none text-sm text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Service Toggle */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {contentGenConfig.services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                      enabledServices[service.id] ? "bg-primary/20" : "bg-accent/5"
                    )}
                  >
                    {service.icon === 'Mic' && <Mic className={cn(
                      "w-4 h-4",
                      enabledServices[service.id] ? "text-primary" : "text-muted-foreground"
                    )} />}
                    {service.icon === 'Music' && <Music className={cn(
                      "w-4 h-4",
                      enabledServices[service.id] ? "text-primary" : "text-muted-foreground"
                    )} />}
                    {service.icon === 'Image' && <Image className={cn(
                      "w-4 h-4",
                      enabledServices[service.id] ? "text-primary" : "text-muted-foreground"
                    )} />}
                    <span className="text-sm">{service.label}</span>
                    <Check className={cn(
                      "w-4 h-4 ml-1",
                      enabledServices[service.id] ? "opacity-100" : "opacity-0"
                    )} />
                  </button>
                ))}
              </div>

              {/* Visualization Options */}
              {enabledServices.image && (
                <div className="p-4 rounded-lg bg-accent/5">
                  <h4 className="font-medium mb-3">Visualization Type</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedVisualization('plain')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                        selectedVisualization === 'plain' ? "bg-primary/20" : "bg-accent/10"
                      )}
                    >
                      <Image className="w-4 h-4" />
                      <span className="text-sm">Plain</span>
                    </button>
                    <button
                      onClick={() => setSelectedVisualization('video')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                        selectedVisualization === 'video' ? "bg-primary/20" : "bg-accent/10"
                      )}
                    >
                      <Video className="w-4 h-4" />
                      <span className="text-sm">Video</span>
                    </button>
                    <button
                      onClick={() => setSelectedVisualization('animation')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                        selectedVisualization === 'animation' ? "bg-primary/20" : "bg-accent/10"
                      )}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm">Animation</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Generating content...</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="h-2 bg-accent/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        )
      
      case 'visual-creation':
        return (
          <div className="space-y-6">
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
              <div className="flex gap-6">
                {visualConfig.aspectRatios.map(ratio => (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedAspectRatio(ratio.id)}
                    className={cn(
                      "group flex-1 p-3 rounded-lg transition-colors",
                      selectedAspectRatio === ratio.id ? "bg-primary/20" : "bg-accent/10 hover:bg-accent/20"
                    )}
                  >
                    <div className="flex justify-center mb-3">
                      <div 
                        className={cn(
                          "bg-accent/20 rounded overflow-hidden transition-transform group-hover:scale-105",
                          selectedAspectRatio === ratio.id && "ring-2 ring-primary"
                        )}
                        style={{ 
                          width: ratio.width * 16, 
                          height: ratio.height * 16,
                          maxWidth: '160px',
                          maxHeight: '160px'
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
                      <span className="text-sm font-medium">{ratio.name}</span>
                      <span className="block text-xs text-muted-foreground mt-1">
                        {ratio.width}:{ratio.height}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'scene-assembly':
        const { scenes, backgroundMusic } = sceneData as SceneData
        return (
          <div className="space-y-6">
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

      case 'platform-optimization':
        return (
          <div className="p-6 rounded-lg bg-accent/5 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <button className="px-4 py-2 rounded-lg bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors">
                Download Video
              </button>
              <div className="text-sm text-muted-foreground">
                Direct social media sharing coming soon
              </div>
            </div>
          </div>
        )

      case 'modular-workflow':
        const workflowModules = [
          { 
            id: 'content',
            label: 'Content Generation', 
            enabled: true,
            icon: Sparkles,
            description: 'AI-powered script generation'
          },
          { 
            id: 'image',
            label: 'Image Creation', 
            enabled: true,
            icon: Image,
            description: 'Visual asset generation'
          },
          { 
            id: 'voice',
            label: 'Voice Generation', 
            enabled: true,
            icon: Mic,
            description: 'Professional voiceovers'
          },
          { 
            id: 'music',
            label: 'Music Creation', 
            enabled: false,
            icon: Music,
            description: 'Background music'
          },
          { 
            id: 'video',
            label: 'Video Animation', 
            enabled: true,
            icon: Video,
            description: 'Dynamic video effects'
          }
        ]

        return (
          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-accent/5">
              <div className="space-y-6">
                {/* Workflow Process */}
                <div className="relative">
                  <div className="absolute top-[2.5rem] left-4 right-4 h-0.5 bg-accent/20" />
                  <div className="relative z-10 flex justify-between">
                    {workflowModules.map((module, index) => (
                      <div key={module.id} className="space-y-2">
                        <button
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                            module.enabled 
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                              : "bg-accent/10 text-muted-foreground"
                          )}
                        >
                          <module.icon className="w-5 h-5" />
                        </button>
                        <div className={cn(
                          "text-center transition-colors",
                          module.enabled ? "text-foreground" : "text-muted-foreground"
                        )}>
                          <p className="text-sm font-medium">{module.label}</p>
                          <p className="text-xs mt-1">{module.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Royalty Free Message */}
                <div className="mt-8 p-4 rounded-lg bg-accent/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">100% Royalty-Free Content</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        All generated content - including images, music, and voices - is uniquely created for your project and completely royalty-free
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Customize your workflow by enabling or disabling modules based on your needs
                </p>
              </div>
            </div>
          </div>
        )

      case 'voice-generation':
        return (
          <div className="space-y-6">
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

      default:
        return (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Interactive Demo Coming Soon</p>
          </div>
        )
    }
  }

  return (
    <motion.div
      className="mt-8 rounded-xl bg-card p-6 border"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      {getDemoContent()}
    </motion.div>
  )
} 