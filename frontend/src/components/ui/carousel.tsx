"use client";
import { IconArrowNarrowRight } from "@tabler/icons-react";
import { useState, useRef, useEffect } from "react";
import { CheckIcon } from "lucide-react";

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
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Set up video refs array
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, slides.length);
  }, [slides]);

  // Control video playback
  useEffect(() => {
    videoRefs.current.forEach((videoRef, index) => {
      if (!videoRef) return;
      
      if (index === currentIndex && slides[index].templateId === selectedTemplateId) {
        videoRef.play().catch(e => console.log("Video play error:", e));
      } else {
        videoRef.pause();
        videoRef.currentTime = 0;
      }
    });
  }, [currentIndex, selectedTemplateId, slides]);

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

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No templates available
      </div>
    );
  }

  return (
    <div className="mb-8">
      {groupName && (
        <h3 className="text-lg font-medium mb-4 capitalize">{groupName}</h3>
      )}
      
      <div className="relative max-w-2xl mx-auto">
        <div className="overflow-hidden rounded-lg relative h-[220px]">
          <div 
            className="flex absolute top-0 left-0 right-0 bottom-0 transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {slides.map((slide, index) => {
              const isSelected = slide.templateId === selectedTemplateId;
              const isActive = index === currentIndex;
              
              return (
                <div 
                  key={slide.templateId} 
                  className="min-w-full px-12 flex items-center justify-center relative"
                >
                  {/* Show previous slide partially */}
                  {index > 0 && (
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-24 h-[180px] opacity-50 cursor-pointer"
                      onClick={handlePrevious}
                    >
                      <img
                        src={slides[index - 1].src}
                        alt="Previous"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-lg"></div>
                    </div>
                  )}
                  
                  {/* Show next slide partially */}
                  {index < slides.length - 1 && (
                    <div 
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-[180px] opacity-50 cursor-pointer"
                      onClick={handleNext}
                    >
                      <img
                        src={slides[index + 1].src}
                        alt="Next"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-lg"></div>
                    </div>
                  )}
                  
                  <div 
                    className={`template-card h-[200px] w-full max-w-md ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(slide.templateId)}
                  >
                    {slide.isVideo ? (
                      <video
                        ref={el => {
                          videoRefs.current[index] = el;
                          return undefined;
                        }}
                        src={slide.src}
                        className="w-full h-full object-cover rounded-lg"
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={slide.src}
                        alt={slide.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                    
                    <div className="template-card-overlay flex flex-col justify-end p-4 rounded-lg">
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
  );
} 