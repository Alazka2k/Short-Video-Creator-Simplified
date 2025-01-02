# API Authentication

This document describes the authentication methods and endpoints available in the Short Video Creator API.

## Authentication Methods

The API supports the following authentication methods:

### 1. JWT Bearer Token
```http
Authorization: Bearer <access_token>
```

### 2. OAuth 2.0
For protected documentation access and API testing.

## Authentication Flow

### Email Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "user_id": "123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "auth0_id": "auth0|123456",
    "created_at": "2024-01-02T10:00:00Z"
  },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "v2.local...",
    "expires_in": 3600
  }
}
```

### Email Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "user": {
    "user_id": "123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "auth0_id": "auth0|123456",
    "last_login": "2024-01-02T10:00:00Z"
  },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "v2.local...",
    "expires_in": 3600
  }
}
```

### Social Login

```http
POST /api/auth/social
Content-Type: application/json
Authorization: Bearer <provider_token>

{
  "accessToken": "ya29...",
  "provider": "google",
  "profile": {
    "sub": "google|123456",
    "email": "user@gmail.com",
    "name": "John Doe",
    "picture": "https://..."
  }
}
```

**Response:**
```json
{
  "user": {
    "user_id": "123",
    "email": "user@gmail.com",
    "full_name": "John Doe",
    "auth0_id": "google|123456",
    "picture": "https://...",
    "provider": "google"
  },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "v2.local...",
    "expires_in": 3600
  }
}
```

### Token Refresh

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "v2.local..."
}
```

**Response:**
```json
{
  "user": {
    "user_id": "123",
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "v2.local...",
    "expires_in": 3600
  }
}
```

### Logout

```http
POST /api/auth/logout
Content-Type: application/json

{
  "refresh_token": "v2.local...",
  "all_devices": false
}
```

**Response:**
```json
{
  "message": "Logged out successfully",
  "status": "success",
  "details": {
    "user": {
      "user_id": "123",
      "email": "user@example.com",
      "auth0_id": "auth0|123456"
    },
    "session_id": "789",
    "invalidated_at": "2024-01-02T10:00:00Z"
  }
}
```

## Error Handling

All authentication endpoints return standard error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    "additional": "error details"
  }
}
```

Common error status codes:
- `400 Bad Request`: Missing or invalid parameters
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

Authentication endpoints are protected by rate limiting:
- Login attempts: 5 per 15 minutes
- Token refresh: 100 per hour
- Other endpoints: 1000 per hour

## Security Considerations

1. **Token Storage**
   - Store access tokens in memory
   - Store refresh tokens in HTTP-only cookies
   - Never store tokens in localStorage

2. **Token Expiration**
   - Access tokens expire after 1 hour
   - Refresh tokens expire after 30 days
   - Implement automatic token refresh

3. **CORS Configuration**
   - API endpoints are CORS-protected
   - Whitelist only trusted domains
   - Implement proper preflight handling

4. **Security Headers**
   - HTTPS required for all requests
   - Implement proper CSP headers
   - Enable XSS protection

## Documentation Access

Protected documentation sections require OAuth 2.0 authentication:

1. Click "Login" in the documentation
2. Authenticate with your credentials
3. Access protected documentation sections 