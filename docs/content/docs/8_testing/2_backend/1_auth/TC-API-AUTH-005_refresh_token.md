# TC-API-AUTH-005: Token Refresh

## Description
Refresh an expired access token using a valid refresh token.

## API Details

### Endpoint
```http
POST /api/auth/refresh
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
  "refresh_token": "valid_refresh_token_here"
}
```

### Expected Response
```json
{
  "tokens": {
    "access_token": "new_access_token_here",
    "refresh_token": "new_refresh_token_here",
    "expires_in": 3600,
    "token_type": "Bearer"
  },
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "role_name": "user"
  }
}
```

## Database Verification

### Expected State
```sql
-- Update last token refresh timestamp
UPDATE users 
SET 
  last_token_refresh = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1;

-- Log token refresh event
INSERT INTO auth_logs (
  user_id,
  event_type,
  ip_address,
  user_agent,
  created_at
) VALUES (
  1,
  'token_refresh',
  '127.0.0.1',
  'PostmanRuntime/7.32.3',
  CURRENT_TIMESTAMP
);
```

### Verification Queries
```sql
-- Verify last refresh timestamp
SELECT 
  user_id,
  last_token_refresh,
  updated_at
FROM users 
WHERE user_id = 1
  AND last_token_refresh > NOW() - INTERVAL '1 minute';

-- Check refresh event log
SELECT *
FROM auth_logs
WHERE user_id = 1
  AND event_type = 'token_refresh'
ORDER BY created_at DESC
LIMIT 1;
```

## Error Cases

### Invalid Refresh Token
```json
{
  "error": "Invalid Token",
  "message": "The refresh token is invalid or expired",
  "status": 401
}
```

### Missing Refresh Token
```json
{
  "error": "Bad Request",
  "message": "Refresh token is required",
  "status": 400
}
```

### User Account Disabled
```json
{
  "error": "Unauthorized",
  "message": "User account is disabled",
  "status": 401
}
```

### Rate Limit Exceeded
```json
{
  "error": "Too Many Requests",
  "message": "Token refresh rate limit exceeded",
  "retryAfter": 60,
  "status": 429
}
``` 