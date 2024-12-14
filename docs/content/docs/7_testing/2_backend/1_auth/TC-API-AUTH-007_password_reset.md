# TC-API-AUTH-007: Password Reset

## Description
Allow users to request and complete a password reset using a secure token.

## API Details

### Step 1: Request Password Reset

#### Endpoint
```http
POST /api/auth/password/reset-request
```

#### Headers
```json
{
  "Content-Type": "application/json"
}
```

#### Request Body
```json
{
  "email": "user@example.com"
}
```

#### Expected Response
```json
{
  "message": "Password reset instructions sent",
  "status": "success",
  "timestamp": "2024-01-14T12:00:00Z"
}
```

### Step 2: Reset Password

#### Endpoint
```http
POST /api/auth/password/reset
```

#### Headers
```json
{
  "Content-Type": "application/json"
}
```

#### Request Body
```json
{
  "token": "valid_reset_token_here",
  "new_password": "NewSecurePass123!",
  "confirm_password": "NewSecurePass123!"
}
```

#### Expected Response
```json
{
  "message": "Password successfully reset",
  "status": "success",
  "timestamp": "2024-01-14T12:00:00Z"
}
```

## Database Verification

### Expected State
```sql
-- Create password reset request
INSERT INTO password_reset_tokens (
  user_id,
  token_hash,
  expires_at,
  created_at
) VALUES (
  1,
  'hashed_token_value',
  CURRENT_TIMESTAMP + INTERVAL '1 hour',
  CURRENT_TIMESTAMP
);

-- After reset: Update user password and invalidate token
UPDATE users 
SET 
  password_hash = 'new_hashed_password',
  updated_at = CURRENT_TIMESTAMP,
  password_changed_at = CURRENT_TIMESTAMP
WHERE user_id = 1;

UPDATE password_reset_tokens
SET 
  used_at = CURRENT_TIMESTAMP,
  is_valid = false
WHERE user_id = 1 
  AND token_hash = 'hashed_token_value';
```

### Verification Queries
```sql
-- Verify reset token creation
SELECT 
  user_id,
  is_valid,
  expires_at,
  used_at
FROM password_reset_tokens
WHERE user_id = 1
ORDER BY created_at DESC
LIMIT 1;

-- Verify password update
SELECT 
  user_id,
  password_changed_at,
  updated_at
FROM users
WHERE user_id = 1
  AND password_changed_at > NOW() - INTERVAL '1 minute';

-- Check password reset event log
SELECT *
FROM auth_logs
WHERE user_id = 1
  AND event_type = 'password_reset'
ORDER BY created_at DESC
LIMIT 1;
```

## Error Cases

### Invalid Email
```json
{
  "error": "Bad Request",
  "message": "Email address not found",
  "status": 400
}
```

### Invalid Reset Token
```json
{
  "error": "Invalid Token",
  "message": "Password reset token is invalid or expired",
  "status": 401
}
```

### Password Requirements Not Met
```json
{
  "error": "Validation Error",
  "message": "Password does not meet requirements",
  "details": {
    "length": "Must be at least 8 characters",
    "complexity": "Must include uppercase, lowercase, number, and special character"
  },
  "status": 400
}
```

### Passwords Don't Match
```json
{
  "error": "Validation Error",
  "message": "Passwords do not match",
  "status": 400
}
```

### Rate Limit Exceeded
```json
{
  "error": "Too Many Requests",
  "message": "Too many reset attempts",
  "retryAfter": 3600,
  "status": 429
}