'use client';

import { memo } from 'react';
import { cn } from "@/lib/utils";

interface BackgroundProps {
  children?: React.ReactNode;
  showOverlays?: boolean;
}

/**
 * Aurora Background Configuration
 * 
 * Colors:
 * Light Mode:
 * - start: var(--white) - Pure white for subtle start
 * - middle: var(--blue-200) - Light blue for gentle transition
 * - end: var(--white) - Pure white for subtle end
 * - accent1: var(--indigo-200) - Light indigo for first accent
 * - accent2: var(--blue-100) - Very light blue for second accent
 * 
 * Dark Mode:
 * - start: var(--slate-900) - Very dark slate for depth
 * - middle: var(--slate-800) - Dark slate for transition
 * - end: var(--slate-900) - Very dark slate for consistency
 * - accent1: var(--slate-800) - Dark slate for first accent
 * - accent2: var(--slate-900) - Very dark slate for second accent
 * 
 * Animation:
 * - duration: 60s - Controls speed (higher = slower)
 * - timing: linear - Options: linear (constant), ease-in-out (smooth start/stop)
 * - iterationCount: infinite - Options: infinite, or number for limited cycles
 * 
 * Gradient:
 * - angle: 100deg - Controls flow direction (0-360 degrees)
 * - stops: Percentage positions for color transitions
 *   · start: 0% - Beginning of gradient
 *   · middleStart: 7% - Start of middle transition
 *   · middle: 10% - Middle point
 *   · accent1: 12% - First accent position
 *   · accent2: 16% - Second accent position
 *   Closer numbers = sharper transitions
 * 
 * Size:
 * - width: 200% - Larger = slower movement
 * - height: 200% - Larger = more vertical space
 * Recommended: 200-400% for optimal effect
 * 
 * Effects:
 * - blur: 80px - Controls softness (20-150px)
 * - opacity: 50% - Controls visibility (30-100%)
 * - blend: soft-light - Options:
 *   · soft-light: Gentle blending
 *   · screen: Bright, additive
 *   · multiply: Darker blend
 *   · overlay: High contrast
 *   · color-dodge: Vivid blend
 * 
 * Positioning:
 * - zIndex: -10 - Controls stacking (-1 to -10 recommended)
 * - inset: -10px - Controls edge coverage (-5 to -20px)
 */

function BackgroundComponent({ children, showOverlays = true }: BackgroundProps) {
  return (
    <>
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-900">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className={cn(
              "absolute inset-0",
              // CSS Variables for configuration
              "[--start-color:var(--blue-200)]",
              "[--middle-color:var(--indigo-300)]",
              "[--end-color:var(--blue-300)]",
              "[--accent1-color:var(--indigo-400)]",
              "[--accent2-color:var(--blue-400)]",
              "dark:[--start-color:var(--slate-900)]",
              "dark:[--middle-color:var(--slate-800)]",
              "dark:[--end-color:var(--slate-900)]",
              "dark:[--accent1-color:var(--slate-800)]",
              "dark:[--accent2-color:var(--slate-900)]",
              // Animation settings
              "[--animation-duration:60s]",
              "[--gradient-width:200%]",
              "[--gradient-height:200%]",
              "[--blur-amount:80px]",
              "[--main-opacity:0.5]",
              "[--layer-opacity:0.7]",
              // Base aurora gradient
              "[--aurora:repeating-linear-gradient(100deg,var(--start-color)_0%,var(--middle-color)_7%,var(--end-color)_10%,var(--accent1-color)_12%,var(--accent2-color)_16%)]",
              // Apply the animation and effects
              "bg-[length:var(--gradient-width)_var(--gradient-height)]",
              "bg-[image:var(--aurora)]",
              "animate-aurora",
              "filter blur-[var(--blur-amount)]",
              "opacity-[var(--main-opacity)]",
              "mix-blend-soft-light"
            )}
          />
        </div>
      </div>
      <div className="relative">
        {children}
      </div>
    </>
  );
}

export const Background = memo(BackgroundComponent); 