'use client'

import { Music, Mic, Image as ImageIcon, Video as VideoIcon, Play as AnimationIcon, Mic as VoiceIcon, Music as MusicIcon, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState, useRef } from 'react'
import sceneAssemblyConfig from '@/data/features/scene-assembly.json'

// Types for examples and scenes
type Example = { id: string; label: string; description: string; demoContent: string[]; scriptTitle: string; scriptDescription: string; music?: string; scenes: Scene[] };
type Scene = { title: string; description: string; image: string; voice?: string; video?: string };

export function SceneAssemblyDemo() {
  // Parse config
  const videoExamples = sceneAssemblyConfig.videoExamples || []
  const imageExamples = sceneAssemblyConfig.imageExamples || []
  const animatedExamples = sceneAssemblyConfig.animatedExamples || []

  // Top-level content type state
  type ContentType = 'video' | 'image' | 'animated';
  const [contentType, setContentType] = useState<ContentType>('video');

  // Subcategory (style) state for each content type
  const [selectedVideoExampleId, setSelectedVideoExampleId] = useState(videoExamples[0]?.id || '')
  const [selectedImageExampleId, setSelectedImageExampleId] = useState(imageExamples[0]?.id || '')
  const [selectedAnimatedExampleId, setSelectedAnimatedExampleId] = useState(animatedExamples[0]?.id || '')
  const [musicPlaying, setMusicPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Get selected example for each type
  const selectedVideoExample = videoExamples.find(e => e.id === selectedVideoExampleId) || videoExamples[0]
  const selectedImageExample = imageExamples.find(e => e.id === selectedImageExampleId) || imageExamples[0]
  const selectedAnimatedExample = animatedExamples.find(e => e.id === selectedAnimatedExampleId) || animatedExamples[0]

  // Music player controls
  const handleMusicPlayPause = () => {
    if (!audioRef.current) return
    if (musicPlaying) {
      audioRef.current.pause()
      setMusicPlaying(false)
    } else {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((err) => {
        setMusicPlaying(false)
        alert('Music file could not be played: ' + err.message)
      })
      setMusicPlaying(true)
    }
  }

  // Determine which examples and scenes to show
  let examples: Example[] = [];
  let selectedExample: Example | null = null;
  if (contentType === 'video') {
    examples = videoExamples as Example[];
    selectedExample = selectedVideoExample as Example;
  } else if (contentType === 'image') {
    examples = imageExamples as Example[];
    selectedExample = selectedImageExample as Example;
  } else if (contentType === 'animated') {
    examples = animatedExamples as Example[];
    selectedExample = selectedAnimatedExample as Example;
  }
  const scenes: Scene[] = selectedExample?.scenes || [];

  // Top-level content type toggle
  const contentTypeOptions = [
    { key: 'video', label: 'Video Content' },
    { key: 'animated', label: '3D Animated Content' },
    { key: 'image', label: 'Image Content' },
  ];

  return (
    <div className="space-y-8 min-h-[400px]">
      {/* Top-level Content Type Toggle */}
      <div className="flex gap-2 mb-2">
        {contentTypeOptions.map(opt => (
          <Button
            key={opt.key}
            variant={contentType === opt.key ? 'default' : 'outline'}
            onClick={() => setContentType(opt.key as ContentType)}
            className="rounded-full px-6"
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Subcategory (style) switcher as card/tile selector with preview */}
      {examples.length > 1 && (
        <div className="flex gap-4 mb-4">
          {examples.map(example => {
            const previewScene = example.scenes[0];
            const hasVideo = (contentType === 'video' || contentType === 'animated') && !!previewScene.video;
            const isSelected =
              (contentType === 'video' && selectedVideoExampleId === example.id) ||
              (contentType === 'image' && selectedImageExampleId === example.id) ||
              (contentType === 'animated' && selectedAnimatedExampleId === example.id);
            return (
              <button
                key={example.id}
                onClick={() => {
                  if (contentType === 'video') setSelectedVideoExampleId(example.id)
                  if (contentType === 'image') setSelectedImageExampleId(example.id)
                  if (contentType === 'animated') setSelectedAnimatedExampleId(example.id)
                }}
                className={cn(
                  'flex flex-col items-center p-2 rounded-xl border transition-all shadow-sm',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-border bg-muted hover:bg-accent',
                  'focus:outline-none focus:ring-2 focus:ring-primary/40 w-32'
                )}
                type="button"
              >
                {hasVideo ? (
                  <video
                    src={previewScene.video}
                    className="w-full h-16 object-cover rounded mb-2"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={previewScene.image}
                  />
                ) : (
                  <img
                    src={previewScene.image}
                    className="w-full h-16 object-cover rounded mb-2"
                    alt={example.label}
                  />
                )}
                <span className="font-medium text-sm text-center">{example.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Script Title & Description */}
      <div className="rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 p-[1px]">
        <div className="space-y-2 bg-card rounded-xl p-6">
          <div className="flex items-center gap-4 justify-between">
            <div>
              <h2 className="text-xl font-semibold">{selectedExample?.scriptTitle}</h2>
              <p className="text-sm text-muted-foreground">{selectedExample?.scriptDescription}</p>
            </div>
            {/* Service icons (now config-driven) */}
            <div className="flex gap-2 flex-wrap">
              {selectedExample?.demoContent?.includes('image') && (
                <div className="flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5"><ImageIcon className="w-4 h-4 text-emerald-500" /><span>Image</span></div>
              )}
              {selectedExample?.demoContent?.includes('video') && (
                <div className="flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5"><VideoIcon className="w-4 h-4 text-sky-500" /><span>Video</span></div>
              )}
              {selectedExample?.demoContent?.includes('voice') && (
                <div className="flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5"><VoiceIcon className="w-4 h-4 text-purple-500" /><span>Voice</span></div>
              )}
              {selectedExample?.demoContent?.includes('music') && (
                <div className="flex items-center gap-1.5 text-xs bg-muted rounded-full px-3 py-1.5"><MusicIcon className="w-4 h-4 text-pink-500" /><span>Music</span></div>
              )}
            </div>
            {/* Download All demo button */}
            <div className="mt-4">
              <button className="px-2 py-1 rounded border border-border bg-muted text-muted-foreground text-xs font-medium transition-colors hover:bg-muted/70 hover:border-accent">
                Download All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Example Description */}
      <div className="mb-2 text-sm text-muted-foreground font-medium">
        {selectedExample?.description}
      </div>

      {/* Scene Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenes.map((scene: Scene, idx: number) => {
          // Type guards for TS
          const isVideoScene = (contentType === 'video' || contentType === 'animated') && Object.prototype.hasOwnProperty.call(scene, 'video');
          return (
            <div key={idx} className="rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 p-[1px]">
              <div className="rounded-xl bg-card flex flex-col h-full">
                <div className="relative w-full aspect-video rounded-t-xl overflow-hidden">
                  {isVideoScene && (scene as any).video ? (
                    <video
                      src={(scene as any).video}
                      controls
                      className="w-full h-full object-cover rounded-t-xl bg-black"
                      poster={scene.image}
                    />
                  ) : (
                    <img src={scene.image} alt={scene.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 flex flex-col p-4 gap-2">
                  <div className="font-medium text-base truncate">{scene.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{scene.description}</div>
                  <div className="flex items-center gap-2 mt-2">
                    {scene.voice && (
                      <>
                        <VoiceIcon className="w-4 h-4 text-purple-500" />
                        <span className="text-xs text-muted-foreground">Voiceover included</span>
                      </>
                    )}
                    {/* Optionally, add a play button for scene.voice if present */}
                    {scene.voice && (
                      <audio controls src={scene.voice} className="ml-2 h-8" />
                    )}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button variant="outline" size="sm" className="flex-1 border-violet-500/20 hover:border-violet-500/40">
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 border-violet-500/20 hover:border-violet-500/40" disabled>
                      Recreate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Music Player Bar (for video and animated content, now below scene cards) */}
      {(contentType === 'video' || contentType === 'animated') && selectedExample?.music && (
        <div className="flex items-center gap-4 bg-card border-t p-4 shadow-lg rounded-xl mt-4">
          <button
            onClick={handleMusicPlayPause}
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            aria-label={musicPlaying ? 'Pause music' : 'Play music'}
          >
            {musicPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 5.25v13.5m10.5-13.5v13.5" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25v13.5l13.5-6.75-13.5-6.75z" /></svg>
            )}
          </button>
          <div className="flex-1">
            <div className="font-medium text-base">Music Track</div>
            <div className="text-xs text-muted-foreground">Royalty-free background music</div>
          </div>
          <audio
            ref={audioRef}
            src={selectedExample.music}
            preload="auto"
            onPlay={() => setMusicPlaying(true)}
            onPause={() => setMusicPlaying(false)}
            onError={() => {
              setMusicPlaying(false);
              alert('Music file could not be loaded or played.');
            }}
            controls // for debugging, can be removed later
          />
        </div>
      )}
    </div>
  )
}