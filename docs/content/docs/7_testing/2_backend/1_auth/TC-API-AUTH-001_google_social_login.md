# TC-API-AUTH-001: Google Social Login

## Description
Test the Google social authentication endpoint for new and existing users.

## API Details

### Endpoint
```http
POST /api/auth/social
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "accessToken": "google_access_token",
  "provider": "google",
  "profile": {
    "sub": "google|123456789",
    "email": "user@example.com",
    "name": "Test User",
    "picture": "https://example.com/photo.jpg"
  }
}
```

### Expected Response
```json
{
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "full_name": "Test User",
    "provider": "google",
    "role_name": "user",
    "status": "active"
  },
  "token": {
    "access_token": "jwt_token",
    "expires_in": 3600
  }
}
```

## Database Verification

### Expected State
```sql
-- users table
INSERT INTO users (
  auth0_id, email, full_name, provider, 
  picture, last_login
) VALUES (
  'google|123456789',
  'user@example.com',
  'Test User',
  'google',
  'https://example.com/photo.jpg',
  CURRENT_TIMESTAMP
);

-- user_roles table
INSERT INTO user_roles (
  user_id, role_id
) VALUES (
  1, 1  -- Default user role
);

-- user_subscriptions table
INSERT INTO user_subscriptions (
  user_id, plan_id, status,
  start_date, current_period_end
) VALUES (
  1, 1, 'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days'
);
```

### Verification Queries
```sql
-- Verify user creation
SELECT user_id, email, full_name, provider, auth0_id 
FROM users 
WHERE auth0_id = 'google|123456789';

-- Verify role assignment
SELECT u.email, r.role_name
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
WHERE u.auth0_id = 'google|123456789';

-- Verify subscription
SELECT u.email, us.status, us.plan_id, us.current_period_end
FROM users u
JOIN user_subscriptions us ON u.user_id = us.user_id
WHERE u.auth0_id = 'google|123456789';
```

## Error Cases

### Invalid Token
```json
{
  "error": "Invalid token",
  "status": 401
}
```

### Duplicate Email
```json
{
  "error": "Email already registered",
  "status": 409
}
```

### Missing Fields
```json
{
  "error": "Missing required fields",
  "required": ["accessToken", "provider", "profile"],
  "status": 400
}
``` 