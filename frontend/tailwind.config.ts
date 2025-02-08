import type { Config } from "tailwindcss";
// @ts-ignore - Ignore TypeScript error for flattenColorPalette import
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "aurora": {
          "0%": {
            backgroundPosition: "0% 50%",
            transform: "rotate(0deg)",
          },
          "50%": {
            backgroundPosition: "100% 50%",
            transform: "rotate(180deg)",
          },
          "100%": {
            backgroundPosition: "0% 50%",
            transform: "rotate(360deg)",
          },
        },
        "aurora-horizontal": {
          "0%": {
            backgroundPosition: "0% 0",
          },
          "50%": {
            backgroundPosition: "-150% 0",
          },
          "100%": {
            backgroundPosition: "-300% 0",
          },
        },
        "aurora-flow": {
          "0%": {
            backgroundPosition: "0% 50%",
            transform: "translateX(0%) translateY(-10%)"
          },
          "25%": {
            backgroundPosition: "-50% 55%",
            transform: "translateX(-15%) translateY(0%)"
          },
          "50%": {
            backgroundPosition: "-100% 50%",
            transform: "translateX(-25%) translateY(-15%)"
          },
          "75%": {
            backgroundPosition: "-150% 45%",
            transform: "translateX(-15%) translateY(0%)"
          },
          "100%": {
            backgroundPosition: "-200% 50%",
            transform: "translateX(0%) translateY(-10%)"
          }
        },
        "beam": {
          "0%": {
            backgroundPosition: "100% 50%",
          },
          "100%": {
            backgroundPosition: "-300% 50%",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "aurora": "aurora 15s linear infinite",
        "aurora-horizontal": "aurora-horizontal 60s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "aurora-horizontal-delayed": "aurora-horizontal 60s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "aurora-horizontal-reverse": "aurora-horizontal 60s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse",
        "aurora-flow": "aurora-flow 90s ease infinite",
        "aurora-flow-delayed": "aurora-flow 90s ease infinite -30s",
        "aurora-flow-reverse": "aurora-flow 90s ease infinite -60s",
        "beam": "beam 40s linear infinite",
        "beam-delayed": "beam 40s linear infinite -13.33s",
        "beam-slow": "beam 40s linear infinite -26.67s",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), addVariablesForColors],
} satisfies Config;

export default config; 