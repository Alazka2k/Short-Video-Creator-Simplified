# TC-API-AUTH-002: Apple Social Login

## Description
Test the Apple ID social authentication endpoint for new and existing users.

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
  "accessToken": "apple_access_token",
  "provider": "apple",
  "profile": {
    "sub": "apple|123456789",
    "email": "user@privaterelay.appleid.com",
    "name": "Test User",
    "picture": null
  }
}
```

### Expected Response
```json
{
  "user": {
    "user_id": 1,
    "email": "user@privaterelay.appleid.com",
    "full_name": "Test User",
    "provider": "apple",
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
  'apple|123456789',
  'user@privaterelay.appleid.com',
  'Test User',
  'apple',
  NULL,
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
-- Verify user with Apple ID
SELECT user_id, email, full_name, provider, auth0_id 
FROM users 
WHERE auth0_id = 'apple|123456789';

-- Check role and subscription
SELECT u.email, r.role_name, us.status
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
JOIN user_subscriptions us ON u.user_id = us.user_id
WHERE u.auth0_id = 'apple|123456789';
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