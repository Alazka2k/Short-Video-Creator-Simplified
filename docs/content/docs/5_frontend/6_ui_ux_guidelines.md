# UI/UX Guidelines

## Design System

### 1. Colors
- **Primary**: `hsl(271 91% 65%)` - Vibrant purple used for primary actions and branding (#B24BF3)
- **Accent**: `hsl(262 83% 58%)` - Similar purple tone used for accents and highlights (#9747FF)
- **Secondary**: 
  - Light mode: `hsl(280 46% 96%)` - Very light purple (#F6F1FE)
  - Dark mode: `hsl(240 3.7% 15.9%)` - Dark gray (#262627)
- **Background**: 
  - Light mode: `hsl(0 0% 98%)` - Off-white (#FAFAFA)
  - Dark mode: `hsl(240 10% 3.9%)` - Near black (#0A0A0C)
- **Foreground**: 
  - Light mode: `hsl(240 10% 3.9%)` - Near black (#0A0A0C)
  - Dark mode: `hsl(0 0% 98%)` - Off-white (#FAFAFA)
- **Card**: 
  - Light mode: `hsl(0 0% 100%)` - Pure white (#FFFFFF)
  - Dark mode: `hsl(240 10% 3.9%)` - Near black (#0A0A0C) //Change it
- **Muted**: 
  - Light mode: `hsl(240 4.8% 95.9%)` - Light gray (#F4F4F5)
  - Dark mode: `hsl(240 3.7% 15.9%)` - Dark gray (#262627) //Change it
- **Border**: 
  - Light mode: `hsl(240 5.9% 90%)` - Light gray border (#E4E4E7)
  - Dark mode: `hsl(240 3.7% 15.9%)` - Dark gray border (#262627) //Change it

**Gradient Usage**:
- Main gradient: `from-primary via-accent to-secondary` - Creates a smooth color transition from purple (#B24BF3) through violet (#9747FF) to light purple/dark gray
- Text gradients: `bg-clip-text text-transparent` - Makes text show the background gradient instead of a solid color
- Animated gradients: Gradients that shift position over time for dynamic visual effects

### 2. Typography
- **Font Family**: Inter - Modern, clean sans-serif font
- **Hierarchy**:
  - Headings:
    - H1: `text-5xl/text-7xl font-bold tracking-tighter` (48-72px) - Very large, bold text with tighter letter spacing
    - H2: `text-3xl/text-4xl font-bold` (30-36px) - Large, bold text for section headings
    - H3: `text-2xl font-semibold` (24px) - Medium heading with semibold weight
    - H4: `text-xl font-semibold` (20px) - Smaller heading with semibold weight
  - Body: `text-base` (16px) - Standard text size for paragraphs
  - Small: `text-sm` (14px) - Smaller text for less important content
  - Tiny: `text-xs` (12px) - Very small text for captions or metadata
- **Weights**: 
  - Regular: `font-normal` (400) - Default text weight
  - Medium: `font-medium` (500) - Slightly heavier than normal
  - Semibold: `font-semibold` (600) - Heavier than medium, used for emphasis
  - Bold: `font-bold` (700) - Heaviest weight, used for strong emphasis
- **Special Text Treatments**:
  - Gradient text: `gradient-primary-text` - Text that shows the purple gradient instead of a solid color
  - Muted text: `text-muted-foreground` - Lower contrast text for secondary information

### 3. Spacing
- Base unit: 4px (following Tailwind's default spacing scale)
- Common spacing tokens:
  - `px`: 1px - Smallest possible spacing unit
  - `0.5`: 2px - Very tiny spacing (half of base unit)
  - `1`: 4px - Base spacing unit
  - `2`: 8px - 2× base unit, used for small gaps
  - `3`: 12px - 3× base unit
  - `4`: 16px - 4× base unit, standard spacing
  - `6`: 24px - 6× base unit, medium spacing
  - `8`: 32px - 8× base unit, large spacing
  - `12`: 48px - 12× base unit, very large spacing
  - `16`: 64px - 16× base unit, extra large spacing
  - `24`: 96px - 24× base unit, massive spacing
- Container padding: `px-4 md:px-6` - 16px padding on small screens, 24px on medium screens and up
- Section spacing: `py-12 md:py-24` - 48px vertical padding on small screens, 96px on medium screens and up
- Stack spacing: `space-y-4` to `space-y-12` - Adds 16px to 48px margins between stacked elements

### 4. Components

#### Buttons
- **Primary**: `bg-primary text-primary-foreground hover:bg-primary/90` 
  - Purple background (#B24BF3) with white text
  - On hover, background becomes 90% opaque (slightly lighter)
- **Secondary**: `bg-secondary text-secondary-foreground hover:bg-secondary/80` 
  - Light purple background in light mode, dark gray in dark mode
  - On hover, background becomes 80% opaque (slightly lighter)
- **Outline**: `border border-input bg-background hover:bg-accent/10 hover:text-accent-foreground` 
  - Transparent button with border
  - On hover, gets very light accent background and accent text color
- **Ghost**: `hover:bg-accent hover:text-accent-foreground` 
  - Completely transparent button
  - On hover, gets accent background and corresponding text color
- **Destructive**: `bg-destructive text-destructive-foreground hover:bg-destructive/90` 
  - Red background with white text
  - On hover, background becomes 90% opaque (slightly lighter)
- **Sizes**:
  - Default: `h-10 px-4 py-2` - 40px height, 16px horizontal padding, 8px vertical padding
  - Small: `h-9 px-3` - 36px height, 12px horizontal padding
  - Large: `h-11 px-8` - 44px height, 32px horizontal padding
- **States**:
  - Loading: Show spinner with `text-primary-foreground/70` - Semi-transparent text color with loading spinner
  - Disabled: Apply `opacity-50 cursor-not-allowed` - Half-transparent and shows not-allowed cursor on hover

#### Cards
- Default card styling: `bg-card text-card-foreground rounded-lg border shadow-sm` 
  - White background (light mode) or dark gray (dark mode)
  - Corresponding text color
  - Large rounded corners (8px)
  - Thin border
  - Small shadow
- Interactive cards: Add `hover:shadow-md transition-all duration-300` 
  - Medium shadow on hover
  - Smooth 300ms transition for all property changes
  - Often combined with subtle transform effects (slight scaling)
- Card padding: `p-6` to `p-8` - 24px to 32px padding on all sides
- Card sections: Use `border-t` or `border-b` with `pt-4` or `pb-4` 
  - Top or bottom borders to separate content
  - 16px padding on corresponding side

#### Forms
- **Inputs**: `bg-background border border-input rounded-md focus:border-primary focus:ring-primary` 
  - Background color based on theme
  - Border with input color
  - Medium rounded corners (6px)
  - Purple border and ring (outline) when focused
- **Labels**: `text-sm font-medium text-foreground` 
  - Small text (14px)
  - Medium font weight (500)
  - Regular text color based on theme
- **Validation States**:
  - Error: Red border and supporting text
  - Success: Green border and supporting text
  - Disabled: `opacity-50 cursor-not-allowed` - Half-transparent and shows not-allowed cursor
- **Consistent Spacing**: 
  - `space-y-2` between label and input - 8px vertical spacing
  - `space-y-4` between form groups - 16px vertical spacing

#### Navigation
- **Main Nav**: `sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg` 
  - Sticks to the top of the viewport
  - Very high z-index (50) to appear above other content
  - Bottom border
  - Semi-transparent background
  - Strong background blur effect
- **Active State**: `text-primary font-medium` - Purple text with medium font weight
- **Hover State**: `text-primary/80 transition-colors` 
  - 80% opaque purple text (lighter)
  - Smooth color transition
- **Mobile Nav**: Hamburger menu expanding to full-screen overlay or sliding side panel
- **Footer Nav**: Grouped by category with clear section headings

### 5. Animations
- **Transitions**: `transition-all duration-300` 
  - Smooth transition for all properties
  - 300 millisecond duration (medium speed)
- **Hover Effects**: Subtle scale, shadow, or color changes
- **Page Transitions**: Fade in with `animate-in` - Gentle fade-in animation when page loads
- **Content Entrance**: 
  - `slide-in-from-bottom` - Content slides upward into position
  - `slide-in-from-top` - Content slides downward into position
- **Loading States**: 
  - Spinners - Rotating circular indicators
  - Skeleton loaders - Gray placeholder blocks that mimic content
  - Pulse animations - Elements that fade in and out to indicate loading
- **Ambient Animations**: 
  - `animate-drift` - Slow floating movement (20s duration)
  - `animate-drift-slow` - Very slow floating movement (30s duration)

### 6. Accessibility
- **Color Contrast**: Maintain WCAG 2.1 AA compliance 
  - 4.5:1 minimum contrast ratio for normal text
  - 3:1 minimum contrast ratio for large text
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
- **Focus States**: Visible focus rings with `ring-2 ring-primary ring-offset-2` 
  - 2px thick purple ring
  - 2px offset from the element
- **Screen Readers**: Proper ARIA attributes and semantic HTML
- **Reduced Motion**: Respect user preferences with `@media (prefers-reduced-motion: reduce)` 
  - Automatically disables or minimizes animations for users who prefer reduced motion

### 7. Responsive Design
- **Approach**: Mobile-first with progressive enhancement
- **Breakpoints**:
  - `sm`: 640px - Small devices
  - `md`: 768px - Medium devices 
  - `lg`: 1024px - Large devices
  - `xl`: 1280px - Extra large devices
  - `2xl`: 1536px - 2X extra large devices
- **Layout Containers**: 
  - Default max width: `max-w-7xl mx-auto` 
    - Maximum width of 1280px
    - Automatically centered horizontally
  - Content containers: `container px-4 md:px-6` 
    - Responsive width container
    - 16px horizontal padding on mobile
    - 24px horizontal padding on tablets and up
- **Column Grids**: 
  - Mobile: Single column or 2-column
  - Tablet: 2-4 columns
  - Desktop: 3-6 columns

### 8. Design Principles
- **Clarity**: Clear hierarchy, white space, and purposeful elements
- **Consistency**: Reuse patterns and components across the application
- **Feedback**: Visual feedback for all user actions
- **Efficiency**: Minimize steps to complete tasks
- **Flexibility**: Adaptive design for different devices and user needs
- **Elegance**: Balanced visuals with focus on content and functionality 