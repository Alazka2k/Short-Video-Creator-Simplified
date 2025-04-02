# TC-API-AUTH-008: Email Verification

## Description
Verify user's email address using a verification token sent via email.

## API Details

### Step 1: Request New Verification Email

#### Endpoint
```http
POST /api/auth/email/verification-request
```

#### Headers
```json
{
  "Authorization": "Bearer {access_token}",
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
  "message": "Verification email sent",
  "status": "success",
  "timestamp": "2024-01-14T12:00:00Z"
}
```

### Step 2: Verify Email

#### Endpoint
```http
POST /api/auth/email/verify
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
  "token": "valid_verification_token_here"
}
```

#### Expected Response
```json
{
  "message": "Email successfully verified",
  "status": "success",
  "timestamp": "2024-01-14T12:00:00Z",
  "user": {
    "email": "user@example.com",
    "email_verified": true,
    "verification_date": "2024-01-14T12:00:00Z"
  }
}
```

## Database Verification

### Expected State
```sql
-- Create verification token
INSERT INTO email_verification_tokens (
  user_id,
  token_hash,
  expires_at,
  created_at
) VALUES (
  1,
  'hashed_token_value',
  CURRENT_TIMESTAMP + INTERVAL '24 hours',
  CURRENT_TIMESTAMP
);

-- After verification: Update user and invalidate token
UPDATE users 
SET 
  email_verified = true,
  email_verified_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1;

UPDATE email_verification_tokens
SET 
  used_at = CURRENT_TIMESTAMP,
  is_valid = false
WHERE user_id = 1 
  AND token_hash = 'hashed_token_value';
```

### Verification Queries
```sql
-- Verify email verification status
SELECT 
  user_id,
  email,
  email_verified,
  email_verified_at
FROM users
WHERE user_id = 1;

-- Check verification token status
SELECT 
  token_hash,
  is_valid,
  expires_at,
  used_at
FROM email_verification_tokens
WHERE user_id = 1
ORDER BY created_at DESC
LIMIT 1;

-- Check verification event log
SELECT *
FROM auth_logs
WHERE user_id = 1
  AND event_type = 'email_verification'
ORDER BY created_at DESC
LIMIT 1;
```

## Error Cases

### Invalid Token
```json
{
  "error": "Invalid Token",
  "message": "Verification token is invalid or expired",
  "status": 401
}
```

### Already Verified
```json
{
  "error": "Bad Request",
  "message": "Email is already verified",
  "status": 400
}
```

### Token Expired
```json
{
  "error": "Token Expired",
  "message": "Verification token has expired",
  "status": 401
}
```

### Rate Limit Exceeded
```json
{
  "error": "Too Many Requests",
  "message": "Too many verification attempts",
  "retryAfter": 3600,
  "status": 429
}
```

### User Not Found
```json
{
  "error": "Not Found",
  "message": "User not found",
  "status": 404
}
``` 