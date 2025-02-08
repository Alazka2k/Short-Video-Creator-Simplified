'use client';

import { memo } from 'react';
import { cn } from "@/lib/utils";

interface BackgroundProps {
  children?: React.ReactNode;
  showOverlays?: boolean;
  isStatic?: boolean;
}

/**
 * Aurora Background Component
 * 
 * IMPORTANT CONFIGURATION DEPENDENCIES:
 * When modifying the background animation or styling, you need to update two files:
 * 
 * 1. tailwind.config.ts:
 *    - Add/modify keyframes in the keyframes section:
 *      ```ts
 *      keyframes: {
 *        "aurora-flow": {
 *          "0%": { backgroundPosition: "0% 50%", transform: "translateX(0%) translateY(-10%)" },
 *          // ... other keyframe steps
 *        }
 *      }
 *      ```
 *    - Add/modify animations in the animation section:
 *      ```ts
 *      animation: {
 *        "aurora-flow": "aurora-flow 90s ease infinite",
 *        "aurora-flow-delayed": "aurora-flow 90s ease infinite -30s",
 *        "aurora-flow-reverse": "aurora-flow 90s ease infinite -60s"
 *      }
 *      ```
 * 
 * 2. globals.css:
 *    - Add utility classes for animations:
 *      ```css
 *      .animate-aurora-flow {
 *        animation: aurora-flow 90s ease infinite;
 *        will-change: background-position, transform;
 *      }
 *      ```
 *    - Add mask utilities if needed:
 *      ```css
 *      .mask-radial-farthest {
 *        mask-image: radial-gradient(...);
 *      }
 *      ```
 */

function BackgroundComponent({ children, showOverlays = true, isStatic = false }: BackgroundProps & { isStatic?: boolean }) {
  const gradients = {
    primary: 'linear-gradient(60deg, transparent 0%, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.04) 35%, rgba(200,200,255,0.04) 50%, rgba(255,255,255,0.04) 65%, rgba(255,255,255,0.02) 75%, transparent 100%)',
    secondary: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.02) 25%, rgba(220,220,255,0.03) 35%, rgba(200,200,255,0.03) 50%, rgba(220,220,255,0.03) 65%, rgba(255,255,255,0.02) 75%, transparent 100%)',
    tertiary: 'linear-gradient(30deg, transparent 0%, rgba(255,255,255,0.01) 25%, rgba(235,235,255,0.02) 35%, rgba(220,220,255,0.02) 50%, rgba(235,235,255,0.02) 65%, rgba(255,255,255,0.01) 75%, transparent 100%)'
  };

  return (
    <>
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950">
        <div
          style={{
            '--beam-gradient': gradients.primary,
            backgroundImage: 'var(--beam-gradient)',
            backgroundSize: '400% 100%',
            ...(isStatic && { backgroundPosition: '50% 50%' })
          } as React.CSSProperties}
          className={cn(
            "absolute inset-0 opacity-30 mix-blend-multiply dark:mix-blend-screen dark:opacity-20",
            isStatic ? "blur-sm" : "animate-beam"
          )}
        />
        {!isStatic && (
          <>
            <div
              style={{
                '--beam-gradient': gradients.secondary,
                backgroundImage: 'var(--beam-gradient)',
                backgroundSize: '400% 100%',
              } as React.CSSProperties}
              className="absolute inset-0 opacity-20 mix-blend-multiply dark:mix-blend-screen dark:opacity-15 blur-2xl animate-beam-delayed"
            />
            <div
              style={{
                '--beam-gradient': gradients.tertiary,
                backgroundImage: 'var(--beam-gradient)',
                backgroundSize: '400% 100%',
              } as React.CSSProperties}
              className="absolute inset-0 opacity-20 mix-blend-multiply dark:mix-blend-screen dark:opacity-10 blur-3xl animate-beam-slow"
            />
          </>
        )}
        {showOverlays && (
          <div 
            className="absolute inset-0 mask-radial-farthest" 
            style={{ '--mask-image': 'radial-gradient(circle at center, black 30%, transparent 80%)' } as React.CSSProperties} 
          />
        )}
      </div>
      <div className="relative">
        {children}
      </div>
    </>
  );
}

export const Background = memo(BackgroundComponent);