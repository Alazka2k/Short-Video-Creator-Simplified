# Frontend Authentication Implementation

## Auth Client
- Token management
- Auth state
- Protected routes
- Redirect handling

## Components
- Login form
- Registration form
- Auth status
- Protected route wrapper

## Usage Examples
```typescript
// Protected route example
export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return <Loading />
  if (!isAuthenticated) return <Redirect to="/login" />
  
  return <ProtectedContent />
}
``` 