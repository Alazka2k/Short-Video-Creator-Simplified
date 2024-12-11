# State Management

## Overview
The application uses a combination of local state, Zustand for global state, and React Query for server state management.

## State Categories

### 1. Local State
- Component-specific state using useState/useReducer
- Form state management
- UI state (modals, dropdowns)

### 2. Global State (Zustand)
```typescript
// Example auth store
interface AuthStore {
  token: string | null
  user: User | null
  login: (credentials: Credentials) => Promise<void>
  logout: () => void
}

const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  login: async (credentials) => {
    // Implementation
  },
  logout: () => set({ token: null, user: null })
}))
```

### 3. Server State
- React Query for API data caching
- Optimistic updates
- Error handling
- Loading states

## State Management Guidelines
1. Choose the right tool for the job
2. Keep state as local as possible
3. Document complex state interactions
4. Implement proper error handling
5. Consider performance implications 