'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, SparklesIcon, VideoCameraIcon, CursorArrowRaysIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

const features = [
  {
    title: "AI Video Creation",
    description: "Transform any content into engaging short-form videos with our AI technology",
    icon: SparklesIcon,
    highlight: "Automated content transformation"
  },
  {
    title: "Smart Scene Selection",
    description: "AI automatically selects the most engaging parts of your content",
    icon: CursorArrowRaysIcon,
    highlight: "Maximum impact, minimum effort"
  },
  {
    title: "Professional Templates",
    description: "Choose from a variety of customizable templates for any platform",
    icon: VideoCameraIcon,
    highlight: "Perfect for every platform"
  },
  {
    title: "Multi-Platform Publishing",
    description: "Share your videos across all major social media platforms instantly",
    icon: RocketLaunchIcon,
    highlight: "Reach your audience everywhere"
  }
];

export function FeatureSlideshow() {
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const Feature = features[currentFeature].icon;

  return (
    <div className="relative h-full">
      <div className="relative h-full flex flex-col items-center justify-center p-12">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              index === currentFeature 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-4"
            }`}
          >
            <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-8">
              <div className="rounded-full bg-foreground/10 p-4 ring-1 ring-foreground/20 backdrop-blur-sm">
                <Feature className="h-12 w-12 text-foreground" />
              </div>
              
              <div className="text-center space-y-4 max-w-md">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  {feature.title}
                </h2>
                <p className="text-lg text-foreground/80">
                  {feature.description}
                </p>
              </div>

              <div className="mt-8 px-4 py-3 rounded-full bg-foreground/10 ring-1 ring-foreground/20 backdrop-blur-sm">
                <p className="text-sm text-foreground/90">
                  {feature.highlight}
                </p>
              </div>

              <Button 
                variant="outline" 
                className="mt-6 group border-foreground/20 hover:bg-foreground/10"
              >
                Learn more 
                <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
        {features.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentFeature ? "bg-foreground" : "bg-foreground/20"
            }`}
            onClick={() => setCurrentFeature(index)}
          />
        ))}
      </div>
    </div>
  );
} 