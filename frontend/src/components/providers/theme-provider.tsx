"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

/**
 * Theme Provider Component
 * 
 * Manages the application's theme state (light/dark mode) using next-themes.
 * This provider:
 * - Persists theme preference
 * - Provides theme switching functionality
 * - Handles system theme preference
 * - Ensures consistent theme application across the app
 * 
 * The provider should be wrapped around the application's root component
 * to ensure theme context is available throughout the app.
 * 
 * @component
 * @example
 * ```tsx
 * // In root layout
 * <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
 *   <App />
 * </ThemeProvider>
 * 
 * // Using theme in components
 * const { theme, setTheme } = useTheme()
 * ```
 * 
 * @prop {string} attribute - The attribute to apply to the html element
 * @prop {string} defaultTheme - The default theme to use
 * @prop {boolean} enableSystem - Whether to enable system theme preference
 */

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
} 