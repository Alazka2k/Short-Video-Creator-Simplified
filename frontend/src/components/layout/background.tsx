'use client';

import { memo, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { useBackgroundConfig } from '@/lib/hooks/useBackgroundConfig';

interface BackgroundProps {
  children?: React.ReactNode;
  showOverlays?: boolean;
}

function BackgroundComponent({ children, showOverlays = true }: BackgroundProps) {
  const { config } = useBackgroundConfig();

  useEffect(() => {
    // Debug log to check if config is loaded correctly
    console.log('Background config:', config);
  }, [config]);

  return (
    <div className="fixed inset-0" style={{ zIndex: -1 }}>
      {/* Base background with aurora effect */}
      <div className="absolute inset-0 overflow-hidden bg-background">
        <div
          className={cn(
            "absolute inset-0 pointer-events-none",
            "animate-aurora" // Add back the animation class
          )}
          style={{
            '--aurora-duration': `${config.aurora.animation.duration}s`,
            '--aurora-timing': config.aurora.animation.timing,
            '--gradient-size': `${config.aurora.gradient.size.width}% ${config.aurora.gradient.size.height}%`,
            backgroundImage: `linear-gradient(${config.aurora.gradient.angle}deg, 
              hsl(var(--primary)) ${config.aurora.gradient.stops.start}%, 
              hsl(var(--accent)) ${config.aurora.gradient.stops.middleStart}%, 
              hsl(var(--background)) ${config.aurora.gradient.stops.end}%)`,
            backgroundSize: '400% 400%',
            filter: `blur(${config.aurora.effects.blur.amount}px)`,
            opacity: config.aurora.effects.opacity.main / 100,
            mixBlendMode: config.aurora.effects.blend.mode as any,
            willChange: 'transform, background-position'
          } as React.CSSProperties}
        />
      </div>

      {/* Grid overlay */}
      {showOverlays && config.overlays.grid.enabled && (
        <div 
          className="absolute inset-0 bg-repeat mix-blend-soft-light pointer-events-none"
          style={{ 
            backgroundImage: 'url("/background/dashboard/grid.svg")',
            opacity: config.overlays.grid.opacity / 100,
            filter: 'invert(1)',
          }}
        />
      )}

      {children}
    </div>
  );
}

export const Background = memo(BackgroundComponent); 