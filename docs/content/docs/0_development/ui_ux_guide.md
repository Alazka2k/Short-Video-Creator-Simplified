# UI and UX Guide - SHORT-VIDEO-CREATOR-SIMPLIFIED

## 1. Design Principles

### Core Principles
- Simplicity: Clear, intuitive interfaces
- Efficiency: Minimize clicks for common tasks
- Progressive Disclosure: Basic mode with advanced options available
- Consistency: Uniform design patterns throughout
- Feedback: Clear indication of system status and progress

### Brand and Theme Colors

#### Dark Mode Theme
```css
/* Brand Colors */
--brand-primary: #9333EA;    /* purple-600 - Primary actions & branding */
--brand-secondary: #7E22CE;  /* purple-700 - Secondary actions */

/* Background Colors */
--bg-main: #0A0A0A;         /* Nearly black - Main background */
--bg-card: #18181B;         /* zinc-900 - Card backgrounds */
--bg-element: #27272A;      /* zinc-800 - Interactive elements */
--bg-hover: #3F3F46;        /* zinc-700 - Hover states */

/* Text Colors */
--text-primary: #FFFFFF;     /* White - Primary text */
--text-secondary: #A1A1AA;   /* zinc-400 - Secondary text */
--text-muted: #71717A;       /* zinc-500 - Muted text */

/* Border Colors */
--border-primary: #27272A;   /* zinc-800 - Primary borders */
--border-secondary: #3F3F46; /* zinc-700 - Secondary borders */

/* Status Colors */
--success: #10B981;          /* green-500 */
--error: #EF4444;           /* red-500 */
--warning: #F59E0B;         /* amber-500 */
```

#### Light Mode Theme
```css
/* Brand Colors remain consistent */
--brand-primary: #9333EA;    /* purple-600 */
--brand-secondary: #7E22CE;  /* purple-700 */

/* Background Colors */
--bg-main: #FFFFFF;         /* White - Main background */
--bg-card: #F4F4F5;         /* zinc-100 - Card backgrounds */
--bg-element: #FAFAFA;      /* zinc-50 - Interactive elements */
--bg-hover: #F4F4F5;        /* zinc-100 - Hover states */

/* Text Colors */
--text-primary: #18181B;     /* zinc-900 - Primary text */
--text-secondary: #71717A;   /* zinc-500 - Secondary text */
--text-muted: #A1A1AA;      /* zinc-400 - Muted text */

/* Border Colors */
--border-primary: #E4E4E7;   /* zinc-200 - Primary borders */
--border-secondary: #F4F4F5; /* zinc-100 - Secondary borders */

/* Status Colors remain consistent */
--success: #10B981;         /* green-500 */
--error: #EF4444;           /* red-500 */
--warning: #F59E0B;         /* amber-500 */
```

### Typography
```css
/* Font Family */
--font-main: 'Inter', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## 2. Layout Structure

### Public Pages Layout
```css
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 768px) {
  .page-container {
    padding: 0 48px;
  }
}

.header {
  position: fixed;
  top: 0;
  width: 100%;
  background-color: var(--bg-main);
  border-bottom: 1px solid var(--border-primary);
  z-index: 50;
}
```

### Dashboard Layout
```css
.dashboard {
  display: grid;
  min-height: 100vh;
}

/* Desktop */
@media (min-width: 1024px) {
  .dashboard {
    grid-template-columns: 280px 1fr;
  }
  
  .sidebar {
    position: fixed;
    width: 280px;
    height: 100vh;
    border-right: 1px solid var(--border-primary);
  }
}

/* Mobile */
@media (max-width: 1023px) {
  .bottom-nav {
    position: fixed;
    bottom: 0;
    width: 100%;
    background-color: var(--bg-card);
    border-top: 1px solid var(--border-primary);
  }
}
```

### Grid System
```css
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, 1fr);
}

@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## 3. Component Library

### Buttons
```css
/* Primary Button */
.btn-primary {
  background-color: var(--brand-primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--brand-secondary);
}

/* Secondary Button */
.btn-secondary {
  background-color: var(--bg-element);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-primary);
  font-weight: var(--font-medium);
}

.btn-secondary:hover {
  background-color: var(--bg-hover);
}

/* Icon Button */
.btn-icon {
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: var(--bg-element);
  color: var(--text-secondary);
}

/* Disabled State */
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Input Fields
```css
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--bg-element);
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  color: var(--text-primary);
}

.input:focus {
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.1);
}

.input::placeholder {
  color: var(--text-muted);
}

/* With Icon */
.input-icon-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.input-with-icon {
  padding-left: 2.75rem;
}
```

### Cards
```css
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 1rem;
  padding: 1.5rem;
}

.card-hover {
  transition: transform 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
}
```

## 4. Creation Wizard Components

### Step Indicator
```css
.step-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-number {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background-color: var(--bg-element);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.step-active .step-number {
  background-color: var(--brand-primary);
  color: white;
}
```

### Scene Card
```css
.scene-card {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  background-color: var(--bg-card);
  border: 1px solid var(--border-primary);
}

.scene-content {
  aspect-ratio: 16/9;
}

.scene-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, 
    rgba(0,0,0,0.8) 0%,
    rgba(0,0,0,0) 100%
  );
  opacity: 0;
  transition: opacity 0.2s ease;
}

.scene-card:hover .scene-overlay {
  opacity: 1;
}

.scene-actions {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
}
```

## 5. Animation Guidelines

### Transitions
```css
/* Base Transitions */
.transition-base {
  transition: all 0.2s ease;
}

.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Page Transitions */
.page-enter {
  opacity: 0;
  transform: translateY(10px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s, transform 0.3s;
}

/* Loading States */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.loading-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

## 6. Responsive Behavior

```css
/* Breakpoint Utilities */
.hide-mobile {
  @media (max-width: 767px) {
    display: none;
  }
}

.hide-desktop {
  @media (min-width: 1024px) {
    display: none;
  }
}

/* Responsive Container */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

## 7. Theme Switching

```typescript
// Theme Types
type Theme = 'light' | 'dark';

// Theme Context
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Theme Toggle Component
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="btn-icon"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};

// Theme Application
const applyTheme = (theme: Theme) => {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  localStorage.setItem('theme', theme);
};
```

## 8. Implementation Notes

### Next.js Usage
- Use App Router for better performance
- Implement route groups for feature organization
- Utilize server components where possible
- Keep client components minimal

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
        },
      },
      backgroundColor: {
        main: 'var(--bg-main)',
        card: 'var(--bg-card)',
        element: 'var(--bg-element)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
      },
      borderColor: {
        primary: 'var(--border-primary)',
        secondary: 'var(--border-secondary)',
      },
    },
  },
};
```

### Performance Optimization
- Implement image optimization
- Use dynamic imports for large components
- Implement proper caching strategies
- Monitor and optimize bundle sizes