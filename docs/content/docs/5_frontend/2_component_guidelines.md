# Component Guidelines

## Component Structure
1. **Atomic Design Principles**
   - Atoms: Basic UI components (buttons, inputs)
   - Molecules: Simple component combinations
   - Organisms: Complex components
   - Templates: Page layouts
   - Pages: Full pages

2. **Component Organization**
   ```typescript
   // Component template
   'use client' // Only if needed
   
   import { useState } from 'react'
   import type { ComponentProps } from './types'
   
   export function ComponentName({ prop1, prop2 }: ComponentProps) {
     // State/hooks at the top
     const [state, setState] = useState()
     
     // Helper functions
     const handleAction = () => {}
     
     // JSX
     return (
       <div>
         {/* Component content */}
       </div>
     )
   }
   ```

3. **Props Interface**
   - Clear prop interfaces
   - Required vs optional props
   - Proper TypeScript types

## Best Practices
- Use TypeScript strictly
- Implement proper error boundaries
- Follow accessibility guidelines
- Write unit tests for components
- Document complex components 