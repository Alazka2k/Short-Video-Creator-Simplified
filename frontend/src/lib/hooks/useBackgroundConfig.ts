import { useState, useEffect } from 'react';
import backgroundConfig from '@/data/config/backround.json';

export interface BackgroundConfig {
  aurora: {
    colors: {
      light: {
        start: string;
        middle: string;
        end: string;
      };
      dark: {
        start: string;
        middle: string;
        end: string;
      };
    };
    animation: {
      duration: number;
      timing: string;
      iterationCount: string;
    };
    gradient: {
      angle: number;
      stops: {
        start: number;
        middleStart: number;
        middleEnd: number;
        end: number;
      };
      size: {
        width: number;
        height: number;
      };
    };
    effects: {
      blur: {
        amount: number;
        unit: string;
      };
      opacity: {
        main: number;
      };
      blend: {
        mode: string;
      };
    };
  };
  overlays: {
    grid: {
      enabled: boolean;
      opacity: number;
      blendMode: string;
    };
    noise: {
      enabled: boolean;
      opacity: number;
      blendMode: string;
    };
  };
  positioning: {
    zIndex: number;
    inset: number;
  };
}

export function useBackgroundConfig() {
  const [config, setConfig] = useState<BackgroundConfig>(backgroundConfig);

  // Function to update config
  const updateConfig = (newConfig: Partial<BackgroundConfig>) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }));
  };

  // Generate CSS variables and classes based on current config
  const generateStyles = () => {
    const { aurora, overlays, positioning } = config;
    
    const auroraClasses = [
      // Base positioning
      'fixed inset-0',
      `-z-${Math.abs(positioning.zIndex)}`,
      
      // Aurora gradient
      `[--aurora:linear-gradient(${aurora.gradient.angle}deg,${aurora.colors.light.start}_${aurora.gradient.stops.start}%,${aurora.colors.light.middle}_${aurora.gradient.stops.middleStart}%,${aurora.colors.light.end}_${aurora.gradient.stops.end}%)]`,
      
      // Dark mode gradient
      `dark:[--aurora:linear-gradient(${aurora.gradient.angle}deg,${aurora.colors.dark.start}_${aurora.gradient.stops.start}%,${aurora.colors.dark.middle}_${aurora.gradient.stops.middleStart}%,${aurora.colors.dark.end}_${aurora.gradient.stops.end}%)]`,
      
      // Animation
      `animate-aurora`,
      
      // Effects
      `filter blur-[${aurora.effects.blur.amount}${aurora.effects.blur.unit}]`,
      `opacity-${aurora.effects.opacity.main}`,
      `mix-blend-${aurora.effects.blend.mode}`
    ].join(' ');

    const overlayClasses = overlays.grid.enabled || overlays.noise.enabled
      ? {
          grid: overlays.grid.enabled ? `opacity-${overlays.grid.opacity} mix-blend-${overlays.grid.blendMode}` : '',
          noise: overlays.noise.enabled ? `opacity-${overlays.noise.opacity} mix-blend-${overlays.noise.blendMode}` : ''
        }
      : null;

    return {
      auroraClasses,
      overlayClasses,
      style: {
        '--aurora-duration': `${aurora.animation.duration}s`,
        '--aurora-timing': aurora.animation.timing,
        '--gradient-size': `${aurora.gradient.size.width}% ${aurora.gradient.size.height}%`
      } as React.CSSProperties
    };
  };

  return {
    config,
    updateConfig,
    generateStyles
  };
} 