# Styling Guide

## Tailwind CSS Usage

### 1. Custom Theme
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': '#4F46E5',
        'brand-secondary': '#818CF8',
        'text-primary': '#111827',
        'text-secondary': '#4B5563',
        'bg-main': '#FFFFFF',
        'bg-secondary': '#F9FAFB',
        'border-primary': '#E5E7EB',
      }
    }
  }
}
```

### 2. Component Styling
- Use semantic class names
- Follow mobile-first approach
- Maintain consistent spacing
- Use CSS variables for dynamic values

### 3. Dark Mode
- Implement proper dark mode support
- Test both themes thoroughly
- Use theme-specific colors

## CSS Guidelines
1. Avoid inline styles
2. Use CSS modules when needed
3. Follow BEM naming for custom CSS
4. Maintain responsive design 