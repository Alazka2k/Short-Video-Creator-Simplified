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
      <div className="fixed inset-0 bg-background">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className={cn(
              "absolute inset-0",
              "opacity-50",
              "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
              "animate-aurora",
              "after:absolute after:inset-0",
              "after:bg-gradient-to-br after:from-indigo-500 after:via-purple-500 after:to-pink-500",
              "after:animate-aurora after:opacity-50 after:blur-3xl",
              "mix-blend-normal",
              showOverlays && "mask-radial-farthest"
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