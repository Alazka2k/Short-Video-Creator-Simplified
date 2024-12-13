'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    title: 'AI-Powered Video Creation',
    description: 'Transform your content into engaging videos in minutes using advanced AI technology.',
    image: '/features/ai-creation.png'
  },
  {
    title: 'Professional Templates',
    description: 'Choose from a variety of customizable templates designed for different use cases.',
    image: '/features/templates.png'
  },
  {
    title: 'Advanced Analytics',
    description: 'Track performance and optimize your video content with detailed insights.',
    image: '/features/analytics.png'
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

  return (
    <div className="relative w-full h-full flex items-center justify-center p-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20" />
      
      <div className="relative z-10 max-w-2xl text-white space-y-8">
        <div className="space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {features[currentFeature].title}
          </h2>
          <p className="text-lg text-white/80">
            {features[currentFeature].description}
          </p>
        </div>

        <div className="flex justify-center">
          <Link href="/features">
            <Button variant="outline" className="text-white border-white hover:bg-white/10">
              Learn more
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="flex justify-center gap-2">
          {features.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentFeature ? 'bg-white' : 'bg-white/30'
              }`}
              onClick={() => setCurrentFeature(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 