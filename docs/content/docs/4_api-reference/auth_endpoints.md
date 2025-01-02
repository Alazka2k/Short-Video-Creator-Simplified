# Authentication API Reference

## Authentication Endpoints

### Register with Email
```http
POST /api/auth/register
Content-Type: application/json
```

Register a new user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response: 200 OK**
```json
{
  "user": {
    "user_id": "123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "auth0_id": "auth0|123456",
    "created_at": "2023-12-14T10:00:00Z"
  },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "v2.local...",
    "expires_in": 3600
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `409 Conflict`: Email already registered
- `500 Internal Server Error`: Registration failed

### Login with Email
```http
POST /api/auth/login
Content-Type: application/json
```

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response: 200 OK**
```json
{
  "user": {
    "user_id": "123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "auth0_id": "auth0|123456",
    "last_login": "2023-12-14T10:00:00Z"
  },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "v2.local...",
    "expires_in": 3600
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid credentials
- `404 Not Found`: Account not found
- `500 Internal Server Error`: Login failed

### Social Login
```http
POST /api/auth/social
Content-Type: application/json
Authorization: Bearer {accessToken}
```

Handle social authentication callback.

**Request Body:**
```json
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

**Response: 200 OK**
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

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid token
- `500 Internal Server Error`: Login failed

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json
```

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "v2.local..."
}
```

**Response: 200 OK**
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

**Error Responses:**
- `400 Bad Request`: Missing refresh token
- `401 Unauthorized`: Invalid refresh token
- `500 Internal Server Error`: Token refresh failed

### Logout
```http
POST /api/auth/logout
Content-Type: application/json
```

Invalidate the current session or all sessions.

**Request Body:**
```json
{
  "refresh_token": "v2.local...",
  "all_devices": false
}
```

**Response: 200 OK**
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
    "invalidated_at": "2023-12-14T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing refresh token
- `401 Unauthorized`: Invalid refresh token
- `500 Internal Server Error`: Logout failed

### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer {accessToken}
```

Retrieve the authenticated user's profile.

**Response: 200 OK**
```json
{
  "user_id": "123",
  "email": "user@example.com",
  "full_name": "John Doe",
  "picture": "https://...",
  "provider": "google",
  "last_login": "2023-12-14T10:00:00Z",
  "created_at": "2023-12-01T00:00:00Z",
  "role": {
    "role_name": "user",
    "description": "Regular user"
  },
  "subscription": {
    "plan_id": 1,
    "status": "active",
    "current_period_end": "2024-01-14T00:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Failed to retrieve profile

## Rate Limiting

All authentication endpoints are protected by rate limiting:

- Login attempts: 5 attempts per 15 minutes
- Token refresh: 100 attempts per hour
- Other endpoints: 1000 requests per hour

## Authentication Headers

Protected endpoints require the following header:
```http
Authorization: Bearer {accessToken}
```

## Error Response Format

All error responses follow this format:
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    "additional": "error details"
  }
}
``` 