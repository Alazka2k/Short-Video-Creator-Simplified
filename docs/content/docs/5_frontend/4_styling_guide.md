# Styling Guide

## Tailwind CSS Usage

### 1. Theme Configuration
We use a custom color scheme that emphasizes purple gradients for our brand identity. Our primary brand color is a vibrant purple (#B24BF3) with accent purple (#9747FF) for highlights.

```javascript
// tailwind.config.ts
{
  theme: {
    extend: {
      colors: {
        // These reference CSS variables defined in globals.css
        // Each color has both a base and foreground (text) variant
        border: "hsl(var(--border))",         // Border color for elements
        input: "hsl(var(--input))",           // Input field borders
        ring: "hsl(var(--ring))",             // Focus ring outline
        background: "hsl(var(--background))", // Page background
        foreground: "hsl(var(--foreground))", // Default text color
        primary: {
          DEFAULT: "hsl(var(--primary))",           // Main purple (#B24BF3)
          foreground: "hsl(var(--primary-foreground))", // Text on primary (white)
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",         // Light purple/dark gray
          foreground: "hsl(var(--secondary-foreground))", // Text on secondary
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",            // Secondary purple (#9747FF)
          foreground: "hsl(var(--accent-foreground))", // Text on accent (white)
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",       // Error/delete red
          foreground: "hsl(var(--destructive-foreground))", // Text on destructive
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",             // Subdued background
          foreground: "hsl(var(--muted-foreground))", // Subdued text
        },
        card: {
          DEFAULT: "hsl(var(--card))",              // Card background
          foreground: "hsl(var(--card-foreground))", // Text on cards
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",           // Popover background
          foreground: "hsl(var(--popover-foreground))", // Text on popovers
        },
      },
      borderRadius: {
        // Consistent rounding based on a single --radius variable
        lg: "var(--radius)",           // 8px (0.5rem) by default
        md: "calc(var(--radius) - 2px)", // 6px by default
        sm: "calc(var(--radius) - 4px)", // 4px by default
      },
    },
  }
}
```

### 2. Color Scheme

The color scheme is defined in the `globals.css` file 
// frontend\src\styles\globals.css 

Our actual color values for light mode are:

```css
:root {
  /* Base colors - each defined in HSL format */
  --background: 0 0% 98%;          /* Off-white (#FAFAFA) */
  --foreground: 240 10% 3.9%;      /* Near black (#0A0A0C) */
  --card: 0 0% 100%;               /* Pure white (#FFFFFF) */
  --card-foreground: 240 10% 3.9%; /* Near black (#0A0A0C) */
  --popover: 0 0% 100%;            /* Pure white (#FFFFFF) */
  --popover-foreground: 240 10% 3.9%; /* Near black (#0A0A0C) */
  --primary: 271 91% 65%;          /* Vibrant purple (#B24BF3) */
  --primary-foreground: 0 0% 100%; /* White (#FFFFFF) */
  --secondary: 280 46% 96%;        /* Very light purple (#F6F1FE) */
  --secondary-foreground: 240 5.9% 10%; /* Dark gray (#19191B) */
  --muted: 240 4.8% 95.9%;         /* Light gray (#F4F4F5) */
  --muted-foreground: 240 3.8% 46.1%; /* Medium gray (#757580) */
  --accent: 262 83% 58%;           /* Secondary purple (#9747FF) */
  --accent-foreground: 0 0% 100%;  /* White (#FFFFFF) */
  --destructive: 0 84.2% 60.2%;    /* Red (#F04444) */
  --destructive-foreground: 0 0% 98%; /* Off-white (#FAFAFA) */
  --border: 240 5.9% 90%;          /* Light gray border (#E4E4E7) */
  --input: 240 5.9% 90%;           /* Light gray border (#E4E4E7) */
  --ring: 271 91% 65%;             /* Same as primary (#B24BF3) */
  --radius: 0.5rem;                /* 8px border radius */
}
```

### 3. Gradients
We use several gradient patterns throughout the application for a distinctive visual style:

```css
/* Main brand gradient - creates a diagonal transition from top-left to bottom-right */
/* from purple (#B24BF3) through violet (#9747FF) to light purple (#F6F1FE) */
.gradient-primary {
  @apply bg-gradient-to-br from-primary via-accent to-secondary;
}

/* Text gradient - applies the gradient as a mask over text */
/* This makes the text display with the gradient colors instead of a solid color */
.gradient-primary-text {
  @apply bg-gradient-to-br from-primary via-accent to-secondary bg-clip-text text-transparent;
}

/* Animated gradient - background that shifts position over time */
/* Creates a subtle movement effect with the gradient colors */
.gradient-animate {
  background-size: 400% 400%;   /* Makes gradient 4× larger than container */
  animation: gradient 8s ease infinite;  /* 8-second animation cycle */
}

/* Keyframes define how the gradient position changes over time */
@keyframes gradient {
  0% { background-position: 0% 50%; }    /* Start position */
  50% { background-position: 100% 50%; } /* Middle position (moved right) */
  100% { background-position: 0% 50%; }  /* End position (back to start) */
}
```

### 4. Component Styling Principles
- **Utility-first approach**: Use Tailwind CSS classes directly in markup rather than separate CSS files
- **Composition over inheritance**: Build complex components by combining simpler ones rather than creating complex inheritance hierarchies
- **Mobile-first responsive design**: Start with mobile layouts and add breakpoints for larger screens
- **Consistent spacing**: Use Tailwind's spacing scale (4px increments) for all margins and padding
- **Color system**: Use our HSL color variables rather than hardcoded colors for consistency
- **Shared components**: Create reusable UI components for common patterns (buttons, cards, inputs)

### 5. Animations and Transitions
We use several custom animations to enhance the user experience:

```css
/* Fade-in animation for elements appearing on page load */
.animate-in {
  animation: animate-in 0.5s ease-out;  /* Half-second fade-in */
}

/* Animation for elements entering from the top of the screen */
.slide-in-from-top {
  animation: slide-in-from-top 0.5s ease-out;  /* Slides down into position */
}

/* Animation for elements entering from the bottom of the screen */
.slide-in-from-bottom {
  animation: slide-in-from-bottom 0.5s ease-out;  /* Slides up into position */
}

/* Subtle floating motion for decorative elements */
/* Creates a 20-second slow undulating movement */
.animate-drift {
  animation: drift 20s ease-in-out infinite alternate;  /* Back-and-forth motion */
}

/* Extra slow floating motion for background elements */
/* Creates a 30-second very slow undulating movement */
.animate-drift-slow {
  animation: drift-slow 30s ease-in-out infinite alternate;  /* Back-and-forth motion */
}
```

### 6. Dark Mode Implementation
We use a CSS variable approach for dark mode that redefines all color values:

```css
/* Dark mode overrides - applied when the .dark class is present on <html> */
.dark {
  /* Base colors - redefined for dark mode */
  --background: 240 10% 3.9%;        /* Near black (#0A0A0C) */
  --foreground: 0 0% 98%;            /* Off-white (#FAFAFA) */
  --card: 240 10% 3.9%;              /* Near black (#0A0A0C) */
  --card-foreground: 0 0% 98%;       /* Off-white (#FAFAFA) */
  --popover: 240 10% 3.9%;           /* Near black (#0A0A0C) */
  --popover-foreground: 0 0% 98%;    /* Off-white (#FAFAFA) */
  --primary: 271 91% 65%;            /* Unchanged purple (#B24BF3) */
  --primary-foreground: 0 0% 98%;    /* Off-white (#FAFAFA) */
  --secondary: 240 3.7% 15.9%;       /* Dark gray (#262627) */
  --secondary-foreground: 0 0% 98%;  /* Off-white (#FAFAFA) */
  --muted: 240 3.7% 15.9%;           /* Dark gray (#262627) */
  --muted-foreground: 240 5% 64.9%;  /* Light gray (#A1A1B3) */
  --accent: 262 83% 58%;             /* Unchanged purple (#9747FF) */
  --accent-foreground: 0 0% 98%;     /* Off-white (#FAFAFA) */
  --destructive: 0 62.8% 30.6%;      /* Darker red (#8D1B1B) */
  --destructive-foreground: 0 0% 98%; /* Off-white (#FAFAFA) */
  --border: 240 3.7% 15.9%;          /* Dark gray (#262627) */
  --input: 240 3.7% 15.9%;           /* Dark gray (#262627) */
  --ring: 271 91% 65%;               /* Same purple (#B24BF3) */
}
```

We use the `next-themes` package to toggle between light and dark modes. The package automatically:
- Detects user's system preference
- Provides hooks for changing theme
- Persists theme preference to localStorage
- Prevents flash of wrong theme on page load

### 7. CSS Best Practices
- **Avoid inline styles**: Use Tailwind classes instead of style attributes
- **Use the `cn()` utility**: Combine classes conditionally with our helper function
  ```jsx
  // Example:
  <button className={cn(
    "base-button-styles", 
    isActive ? "active-styles" : "inactive-styles"
  )}>
    Click me
  </button>
  ```
- **Reusable component abstractions**: Create wrapper components for common UI patterns
- **Keep specificity low**: Avoid deep nesting and ID selectors that create specificity issues
- **Minimize custom CSS**: Use Tailwind's extensive utility classes before writing custom CSS
- **Consistent spacing**: Follow the 4px/8px grid system throughout the application
- **Responsive design**: Use Tailwind's responsive modifiers like `sm:`, `md:`, `lg:` consistently

## CSS Guidelines
1. **Avoid inline styles**: Prefer Tailwind classes for all styling
2. **Use CSS modules when needed**: For complex components that require scoped styles
3. **Follow BEM naming for custom CSS**: When writing custom CSS, use Block-Element-Modifier naming
   ```css
   /* Example: */
   .card {} /* Block */
   .card__title {} /* Element */
   .card--featured {} /* Modifier */
   ```
4. **Maintain responsive design**: Always consider all viewport sizes when styling 