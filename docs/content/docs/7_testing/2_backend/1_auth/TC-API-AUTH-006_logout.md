# TC-API-AUTH-006: User Logout

## Description
Invalidate user's current session and clear authentication tokens.

## API Details

### Endpoint
```http
POST /api/auth/logout
```

### Headers
```json
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "all_devices": false  // Optional: logout from all devices
}
```

### Expected Response
```json
{
  "message": "Successfully logged out",
  "status": "success",
  "timestamp": "2024-01-14T12:00:00Z"
}
```

## Database Verification

### Expected State
```sql
-- Update user's last logout timestamp
UPDATE users 
SET 
  last_logout = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1;

-- Log logout event
INSERT INTO auth_logs (
  user_id,
  event_type,
  details,
  ip_address,
  user_agent,
  created_at
) VALUES (
  1,
  'logout',
  '{"type": "single_device", "reason": "user_initiated"}',
  '127.0.0.1',
  'PostmanRuntime/7.32.3',
  CURRENT_TIMESTAMP
);

-- If all_devices is true, invalidate all refresh tokens
UPDATE user_sessions
SET 
  is_valid = false,
  invalidated_at = CURRENT_TIMESTAMP,
  invalidation_reason = 'user_logout_all'
WHERE user_id = 1;
```

### Verification Queries
```sql
-- Verify logout timestamp
SELECT 
  user_id,
  last_logout,
  updated_at
FROM users 
WHERE user_id = 1
  AND last_logout > NOW() - INTERVAL '1 minute';

-- Check logout event log
SELECT *
FROM auth_logs
WHERE user_id = 1
  AND event_type = 'logout'
ORDER BY created_at DESC
LIMIT 1;

-- Verify session invalidation (for all_devices = true)
SELECT 
  session_id,
  is_valid,
  invalidated_at,
  invalidation_reason
FROM user_sessions
WHERE user_id = 1
  AND invalidated_at IS NOT NULL;
```

## Error Cases

### Invalid Token
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "status": 401
}
```

### Session Already Invalidated
```json
{
  "error": "Invalid Session",
  "message": "Session has already been invalidated",
  "status": 400
}
```

### Database Error
```json
{
  "error": "Internal Server Error",
  "message": "Failed to process logout",
  "status": 500
}
```

### Rate Limit Exceeded
```json
{
  "error": "Too Many Requests",
  "message": "Too many logout attempts",
  "retryAfter": 60,
  "status": 429
}