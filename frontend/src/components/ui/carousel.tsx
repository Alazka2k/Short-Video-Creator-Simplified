"use client";
import { IconArrowNarrowRight } from "@tabler/icons-react";
import { useState, useRef, useEffect } from "react";
import { CheckIcon } from "lucide-react";
import Image from "next/image";

/**
 * Interface representing a slide in the carousel
 * @property {string} title - The title of the slide
 * @property {string} [description] - Optional description of the slide
 * @property {string} src - Source URL for the slide image or video
 * @property {string} templateId - Unique identifier for the template
 * @property {string} [aspectRatio] - Optional aspect ratio (e.g., "16:9", "1:1", "9:16")
 * @property {boolean} [isVideo] - Whether the slide is a video
 */
interface SlideData {
  title: string;
  description?: string;
  src: string;
  templateId: string;
  aspectRatio?: string;
  isVideo?: boolean;
}

/**
 * Props for the Carousel component
 * @property {SlideData[]} slides - Array of slide data to display
 * @property {function} onSelectTemplate - Callback when a template is selected
 * @property {string | null} selectedTemplateId - ID of the currently selected template
 * @property {string} [groupName] - Optional group name for the carousel
 */
interface CarouselProps {
  slides: SlideData[];
  onSelectTemplate: (templateId: string) => void;
  selectedTemplateId: string | null;
  groupName?: string;
}

/**
 * Carousel component for displaying and selecting templates
 * Features:
 * - Supports both image and video templates
 * - Automatic thumbnail generation for videos
 * - Caching of video preload status and thumbnails
 * - Responsive design with different aspect ratios
 * - Navigation controls and selection state
 */
export function Carousel({ slides, onSelectTemplate, selectedTemplateId, groupName }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [videosLoaded, setVideosLoaded] = useState<Record<number, boolean>>({});
  const [videosPreloaded, setVideosPreloaded] = useState<Record<string, boolean>>({});

  /**
   * Initialize video preload status from session storage
   */
  useEffect(() => {
    // Check if we have video preload status in sessionStorage
    const cachedVideoStatus = sessionStorage.getItem('carousel-videos-preloaded');
    if (cachedVideoStatus) {
      try {
        const parsed = JSON.parse(cachedVideoStatus);
        setVideosPreloaded(parsed);
      } catch (e) {
        console.error('Error parsing cached video status:', e);
      }
    }
  }, []);

  /**
   * Preload all videos and retrieve cached thumbnails
   */
  useEffect(() => {
    // Check if we have thumbnails in sessionStorage
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
          try {
            // Skip if already preloaded
            if (videosPreloaded[slide.src]) {
              return;
            }

            // Create a new blob URL for the video to ensure it's cached
            fetch(slide.src)
              .then(response => response.blob())
              .then(blob => {
                // Store the video in sessionStorage as preloaded
                setVideosPreloaded(prev => {
                  const newStatus = { ...prev, [slide.src]: true };
                  try {
                    sessionStorage.setItem('carousel-videos-preloaded', JSON.stringify(newStatus));
                  } catch (e) {
                    console.error('Error caching video status:', e);
                  }
                  return newStatus;
                });

                // Set up video element
                if (videoRefs.current[index]) {
                  const video = videoRefs.current[index];
                  if (video) {
                    video.preload = 'auto'; // Use auto instead of metadata for better performance
                    
                    // Add loaded event listener
                    video.addEventListener('loadeddata', () => {
                      setVideosLoaded(prev => ({ ...prev, [index]: true }));
                    });
                    
                    // Add error event listener
                    video.addEventListener('error', (e) => {
                      console.error('Video element error:', e);
                    });
                  }
                }
              })
              .catch(error => {
                console.error('Error fetching video:', error);
              });
          } catch (error) {
            console.error('Error preloading video:', error);
          }
        }
      });
    };
    
    preloadVideos();
  }, [slides, videosPreloaded]);

  /**
   * Initialize video refs array to match slides length
   */
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, slides.length);
  }, [slides]);

  /**
   * Generate thumbnails for video slides
   * Creates a temporary video element, seeks to a frame, and captures it as a thumbnail
   */
  useEffect(() => {
    const generateThumbnails = async () => {
      // Skip if we already have thumbnails from sessionStorage
      if (Object.keys(thumbnails).length === slides.filter(s => s.isVideo).length) {
        return;
      }

      slides.forEach((slide, index) => {
        if (slide.isVideo) {
          try {
            // Create a temporary video element for thumbnail generation
            const tempVideo = document.createElement('video');
            tempVideo.crossOrigin = 'anonymous';
            tempVideo.src = slide.src;
            tempVideo.muted = true;
            tempVideo.preload = 'metadata';
            
            // Set up event listener for when video metadata is loaded
            tempVideo.addEventListener('loadeddata', () => {
              try {
                // Seek to 0.5 second for thumbnail generation
                tempVideo.currentTime = 0.5;
              } catch (e) {
                console.error('Error seeking video:', e);
              }
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
              // Use a fallback thumbnail for videos that fail to load
              setThumbnails(prev => ({
                ...prev,
                [index]: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPlZpZGVvIFByZXZpZXc8L3RleHQ+PC9zdmc+'
              }));
            });
            
            // Start loading the video
            tempVideo.load();
          } catch (error) {
            console.error('Error in thumbnail generation:', error);
          }
        }
      });
    };
    
    generateThumbnails();
  }, [slides, thumbnails]);

  /**
   * Control video playback based on hover and selection state
   * Plays videos when hovered or selected, pauses otherwise
   */
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

  /**
   * Navigate to the previous slide
   * @param {React.MouseEvent} e - Click event
   */
  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  /**
   * Navigate to the next slide
   * @param {React.MouseEvent} e - Click event
   */
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  /**
   * Handle template selection
   * Toggles selection if already selected
   * @param {string} templateId - ID of the template to select
   */
  const handleSelect = (templateId: string) => {
    // If already selected, deselect it
    if (templateId === selectedTemplateId) {
      onSelectTemplate('');
    } else {
      onSelectTemplate(templateId);
    }
  };

  /**
   * Handle mouse enter event on a slide
   * @param {number} index - Index of the hovered slide
   */
  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
  };

  /**
   * Handle mouse leave event on a slide
   */
  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  /**
   * Render empty state when no slides are available
   */
  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No templates available
      </div>
    );
  }

  /**
   * Main carousel render
   */
  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="overflow-hidden rounded-lg">
        <div className="relative max-w-2xl mx-auto">
          <div className={`overflow-hidden rounded-lg relative ${
            slides[currentIndex].aspectRatio === '9:16' ? 'h-[380px]' : 'h-[280px]'
          } ${
            slides[currentIndex].aspectRatio === '9:16' ? 'py-4' : 'py-1'
          }`}>
            <div 
              className="flex absolute top-0 left-0 right-0 bottom-0 transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {slides.map((slide, index) => {
                const isSelected = slide.templateId === selectedTemplateId;
                const isActive = index === currentIndex;
                
                /**
                 * Calculate styles based on aspect ratio for the main slide
                 * @param {string} [ratio] - Aspect ratio string (e.g., "16:9")
                 * @returns {Object} CSS style object
                 */
                const getAspectRatioStyle = (ratio?: string) => {
                  if (!ratio) return {};
                  
                  // Adjust sizes for different aspect ratios
                  if (ratio === '16:9') {
                    return { width: '320px', height: '180px'};
                  } else if (ratio === '1:1') {
                    return { width: '220px', height: '220px'};
                  } else if (ratio === '9:16') {
                    return { width: '180px', height: '320px'}; // No top margin for 9:16
                  }
                  
                  // Fallback to calculated aspect ratio
                  const [width, height] = (ratio || '16:9').split(':').map(Number);
                  return { 
                    width: `${(width / height) * 180}px`, 
                    height: '180px'
                  };
                };

                /**
                 * Calculate preview sizes for navigation thumbnails
                 * @param {string} [ratio] - Aspect ratio string
                 * @returns {Object} CSS style object for preview thumbnails
                 */
                const getPreviewStyle = (ratio?: string) => {
                  if (!ratio) return {};
                  
                  if (ratio === '16:9') {
                    return { width: '80px', height: '180px' };
                  } else if (ratio === '1:1') {
                    return { width: '60px', height: '220px' };
                  } else if (ratio === '9:16') {
                    return { width: '45px', height: '320px' };
                  }
                  
                  return { width: '80px', height: '45px' };
                };
                
                const aspectRatioStyle = getAspectRatioStyle(slide.aspectRatio);
                const previewStyle = getPreviewStyle(slide.aspectRatio);
                
                return (
                  <div 
                    key={slide.templateId} 
                    className="min-w-full px-2 flex items-center justify-center relative"
                  >
                    {/* Previous slide preview with adjusted size */}
                    {index > 0 && (
                      <div 
                        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50 cursor-pointer"
                        onClick={handlePrevious}
                        style={previewStyle}
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
                      data-aspect-ratio={slide.aspectRatio || '16:9'}
                    >
                      <div 
                        className="relative rounded-lg overflow-hidden shadow-sm"
                        style={aspectRatioStyle}
                      >
                        {slide.isVideo ? (
                          <>
                            <video 
                              ref={(el) => {
                                videoRefs.current[index] = el;
                              }}
                              src={slide.src} 
                              className="w-full h-full object-cover rounded-lg"
                              muted 
                              loop
                              playsInline
                              preload="auto"
                              onLoadedData={() => setVideosLoaded(prev => ({ ...prev, [index]: true }))}
                              onError={(e) => console.error('Video loading error:', e)}
                            />
                            {(!videosLoaded[index] || !isActive) && thumbnails[index] && (
                              <div className="absolute inset-0 z-10">
                                <img 
                                  src={thumbnails[index]} 
                                  alt={slide.title} 
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <img
                            src={slide.src} 
                            alt={slide.title} 
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                        
                        <div className="template-card-overlay">
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="max-w-[90%] mx-auto text-center">
                              <h4 className={`text-lg font-semibold text-white mb-2 ${
                                slide.aspectRatio === '9:16' ? 'text-base' : 'text-base'
                              }`}>
                                {slide.title}
                              </h4>
                              {slide.description && (
                                <p className="text-xs text-white/90 line-clamp-3 mb-2">
                                  {slide.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="absolute top-3 right-3 bg-primary text-white rounded-full p-1 z-20 shadow-lg">
                            <CheckIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Next slide preview with adjusted size */}
                    {index < slides.length - 1 && (
                      <div 
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 cursor-pointer"
                        onClick={handleNext}
                        style={previewStyle}
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
          
          {/* Navigation buttons - adjust margin based on aspect ratio */}
          <div className={`template-navigation flex justify-center ${
            slides[currentIndex].aspectRatio === '9:16' ? 'mt-1' : 'mt-0'  // Reduced margin for 1:1 and 16:9
          } space-x-4`}>
            <button 
              onClick={handlePrevious}
              className="template-navigation-button bg-background hover:bg-muted border border-border rounded-full p-2 transition-colors"
              aria-label="Previous template"
            >
              <IconArrowNarrowRight className="w-5 h-5 transform rotate-180" />
            </button>
            <button 
              onClick={handleNext}
              className="template-navigation-button bg-background hover:bg-muted border border-border rounded-full p-2 transition-colors"
              aria-label="Next template"
            >
              <IconArrowNarrowRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Pagination indicator */}
          <div className="mt-2 text-center">
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} of {slides.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 