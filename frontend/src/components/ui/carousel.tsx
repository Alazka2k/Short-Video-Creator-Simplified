"use client";
import { IconArrowNarrowRight } from "@tabler/icons-react";
import { useState, useRef, useEffect } from "react";
import { CheckIcon } from "lucide-react";
import Image from "next/image";

interface SlideData {
  title: string;
  description?: string;
  src: string;
  templateId: string;
  aspectRatio?: string;
  isVideo?: boolean;
}

interface CarouselProps {
  slides: SlideData[];
  onSelectTemplate: (templateId: string) => void;
  selectedTemplateId: string | null;
  groupName?: string;
}

export function Carousel({ slides, onSelectTemplate, selectedTemplateId, groupName }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [videosLoaded, setVideosLoaded] = useState<Record<number, boolean>>({});

  // Preload videos
  useEffect(() => {
    // Check if we have videos in sessionStorage
    const cachedThumbnails = sessionStorage.getItem('carousel-thumbnails');
    if (cachedThumbnails) {
      try {
        const parsed = JSON.parse(cachedThumbnails);
        setThumbnails(parsed);
      } catch (e) {
        console.error('Error parsing cached thumbnails:', e);
      }
    }

    // Preload all videos, not just the selected one
    const preloadVideos = async () => {
      slides.forEach((slide, index) => {
        if (slide.isVideo) {
          // Create a new Image object to preload the video URL
          const preloadLink = document.createElement('link');
          preloadLink.rel = 'preload';
          preloadLink.as = 'video';
          preloadLink.href = slide.src;
          document.head.appendChild(preloadLink);
          
          // Set preload attribute on video elements
          if (videoRefs.current[index]) {
            const video = videoRefs.current[index];
            if (video) {
              video.preload = 'metadata';
              
              // Add loaded event listener
              video.addEventListener('loadeddata', () => {
                setVideosLoaded(prev => ({ ...prev, [index]: true }));
              });
            }
          }
        }
      });
    };
    
    preloadVideos();
  }, [slides]);

  // Set up video refs array
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, slides.length);
  }, [slides]);

  // Generate thumbnails for video slides
  useEffect(() => {
    const generateThumbnails = async () => {
      // Skip if we already have thumbnails from sessionStorage
      if (Object.keys(thumbnails).length === slides.filter(s => s.isVideo).length) {
        return;
      }

      slides.forEach((slide, index) => {
        if (slide.isVideo) {
          // Create a temporary video element for thumbnail generation
          const tempVideo = document.createElement('video');
          tempVideo.crossOrigin = 'anonymous';
          tempVideo.src = slide.src;
          tempVideo.muted = true;
          tempVideo.preload = 'metadata';
          
          // Set up event listener for when video metadata is loaded
          tempVideo.addEventListener('loadeddata', () => {
            // Seek to 0.5 second for thumbnail generation
            tempVideo.currentTime = 0.5;
          });
          
          // Capture frame when time updates after seeking
          tempVideo.addEventListener('timeupdate', () => {
            if (tempVideo.currentTime > 0) {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = tempVideo.videoWidth || 320;
                canvas.height = tempVideo.videoHeight || 180;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
                  const thumbnail = canvas.toDataURL('image/jpeg', 0.7); // Reduce quality for better storage
                  setThumbnails(prev => {
                    const newThumbnails = { ...prev, [index]: thumbnail };
                    // Cache thumbnails in sessionStorage
                    try {
                      sessionStorage.setItem('carousel-thumbnails', JSON.stringify(newThumbnails));
                    } catch (e) {
                      console.error('Error caching thumbnails:', e);
                    }
                    return newThumbnails;
                  });
                  
                  // Clean up after thumbnail is generated
                  tempVideo.pause();
                  tempVideo.removeAttribute('src');
                  tempVideo.load();
                }
              } catch (error) {
                console.error('Error generating thumbnail:', error);
              }
            }
          });
          
          // Handle errors
          tempVideo.addEventListener('error', (e) => {
            console.error('Error loading video for thumbnail:', e);
          });
          
          // Start loading the video
          tempVideo.load();
        }
      });
    };
    
    generateThumbnails();
  }, [slides, thumbnails]);

  // Control video playback based on hover and selection
  useEffect(() => {
    videoRefs.current.forEach((videoRef, index) => {
      if (!videoRef) return;
      
      const isHovered = hoveredIndex === index;
      const isSelected = slides[index].templateId === selectedTemplateId;
      const isActive = index === currentIndex;
      
      if ((isHovered || isSelected) && isActive) {
        if (videosLoaded[index]) {
          videoRef.play().catch(e => console.log("Video play error:", e));
        }
      } else {
        videoRef.pause();
        // Only reset to beginning if not hovered
        if (!isHovered) {
          videoRef.currentTime = 0;
        }
      }
    });
  }, [currentIndex, selectedTemplateId, slides, hoveredIndex, videosLoaded]);

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleSelect = (templateId: string) => {
    // If already selected, deselect it
    if (templateId === selectedTemplateId) {
      onSelectTemplate('');
    } else {
      onSelectTemplate(templateId);
    }
  };

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No templates available
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="overflow-hidden rounded-lg">
        <div className="relative max-w-2xl mx-auto">
          <div className="overflow-hidden rounded-lg relative h-[220px]">
            <div 
              className="flex absolute top-0 left-0 right-0 bottom-0 transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {slides.map((slide, index) => {
                const isSelected = slide.templateId === selectedTemplateId;
                const isActive = index === currentIndex;
                
                // Calculate aspect ratio styles
                const getAspectRatioStyle = (ratio?: string) => {
                  if (!ratio) return {};
                  
                  // Default to 16:9 if no valid ratio
                  const [width, height] = (ratio || '16:9').split(':').map(Number);
                  
                  if (ratio === '16:9') {
                    return { width: '320px', height: '180px' };
                  } else if (ratio === '1:1') {
                    return { width: '180px', height: '180px' };
                  } else if (ratio === '9:16') {
                    return { width: '101px', height: '180px' };
                  }
                  
                  // Fallback to calculated aspect ratio
                  return { 
                    width: `${(width / height) * 180}px`, 
                    height: '180px' 
                  };
                };
                
                const aspectRatioStyle = getAspectRatioStyle(slide.aspectRatio);
                
                return (
                  <div 
                    key={slide.templateId} 
                    className="min-w-full px-2 flex items-center justify-center relative"
                  >
                    {/* Show previous slide partially */}
                    {index > 0 && (
                      <div 
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-20 h-[180px] opacity-50 cursor-pointer"
                        onClick={handlePrevious}
                      >
                        {slides[index - 1].isVideo && thumbnails[index - 1] ? (
                          <div className="w-full h-full">
                            <img
                              src={thumbnails[index - 1]}
                              alt="Previous"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-lg"></div>
                          </div>
                        ) : (
                          <>
                            <img
                              src={slides[index - 1].src}
                              alt="Previous"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-lg"></div>
                          </>
                        )}
                      </div>
                    )}
                    
                    <div 
                      className={`template-card flex justify-center ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(slide.templateId)}
                      onMouseEnter={() => handleMouseEnter(index)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div 
                        className="relative rounded-lg overflow-hidden"
                        style={aspectRatioStyle}
                      >
                        {slide.isVideo ? (
                          <>
                            <video 
                              ref={el => {
                                videoRefs.current[index] = el;
                                return undefined;
                              }}
                              src={slide.src} 
                              className="w-full h-full object-cover"
                              muted 
                              loop
                              playsInline
                              preload="metadata"
                              onLoadedData={() => setVideosLoaded(prev => ({ ...prev, [index]: true }))}
                              onError={(e) => console.error('Video loading error:', e)}
                            />
                            {(!videosLoaded[index] || !isActive) && thumbnails[index] && (
                              <div className="absolute inset-0 z-10">
                                <img 
                                  src={thumbnails[index]} 
                                  alt={slide.title} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <img
                            src={slide.src} 
                            alt={slide.title} 
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        <div className="template-card-overlay flex flex-col justify-end p-4 absolute inset-0">
                          <h4 className="text-lg font-semibold text-white">{slide.title}</h4>
                          {slide.description && (
                            <p className="text-sm text-white/80 mt-1">{slide.description}</p>
                          )}
                        </div>
                        
                        {isSelected && (
                          <div className="absolute top-3 right-3 bg-primary text-white rounded-full p-1 z-20 shadow-lg">
                            <CheckIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Show next slide partially */}
                    {index < slides.length - 1 && (
                      <div 
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-20 h-[180px] opacity-50 cursor-pointer"
                        onClick={handleNext}
                      >
                        {slides[index + 1].isVideo && thumbnails[index + 1] ? (
                          <div className="w-full h-full">
                            <img
                              src={thumbnails[index + 1]}
                              alt="Next"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-lg"></div>
                          </div>
                        ) : (
                          <>
                            <img
                              src={slides[index + 1].src}
                              alt="Next"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-lg"></div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} of {slides.length}
            </p>
          </div>
          
          <div className="template-navigation">
            <button 
              onClick={handlePrevious}
              className="template-navigation-button"
              aria-label="Previous template"
            >
              <IconArrowNarrowRight className="w-4 h-4 transform rotate-180" />
            </button>
            <button 
              onClick={handleNext}
              className="template-navigation-button"
              aria-label="Next template"
            >
              <IconArrowNarrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 