# TC-API-AUTH-003: Get User Profile

## Description
Retrieve user profile with roles, permissions, and subscription details.

## API Details

### Endpoint
```http
GET /api/auth/profile
```

### Headers
```json
{
  "Authorization": "Bearer {access_token}"
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
    "picture": "https://example.com/photo.jpg",
    "role_name": "user",
    "permissions": ["create:video", "edit:profile"],
    "subscription": {
      "status": "active",
      "plan": "free_trial",
      "expires_at": "2024-01-14T00:00:00Z"
    },
    "video_preferences": {
      "defaultStyle": "modern",
      "defaultVoice": "neural-1",
      "defaultLanguage": "en"
    },
    "notification_settings": {
      "emailNotifications": true,
      "videoCompletionAlert": true
    }
  }
}
```

## Database Verification

### Expected State
User should exist with appropriate roles and permissions:
```sql
-- Sample user data
INSERT INTO users VALUES (
  1,
  'google|123456789',
  'user@example.com',
  'Test User',
  'https://example.com/photo.jpg',
  'google',
  CURRENT_TIMESTAMP,  -- last_login
  '{"defaultStyle": "modern"}'::jsonb,  -- video_preferences
  '{"emailNotifications": true}'::jsonb  -- notification_settings
);

-- Role assignment
INSERT INTO user_roles VALUES (1, 1);  -- user_id, role_id

-- Active subscription
INSERT INTO user_subscriptions VALUES (
  1, 1, 'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days'
);
```

### Verification Queries
```sql
-- Get full user profile with all relations
SELECT 
  u.*,
  r.role_name,
  string_agg(p.name, ',') as permissions,
  us.status as subscription_status,
  us.current_period_end
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.role_id
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
LEFT JOIN user_subscriptions us ON u.user_id = us.user_id
WHERE u.user_id = 1
GROUP BY 
  u.user_id, 
  r.role_name, 
  us.status, 
  us.current_period_end;

-- Verify permissions
SELECT p.name as permission
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN user_roles ur ON rp.role_id = ur.role_id
WHERE ur.user_id = 1;
```

## Error Cases

### Unauthorized Access
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "status": 401
}
```

### User Not Found
```json
{
  "error": "Not Found",
  "message": "User profile not found",
  "status": 404
}
```

### Invalid Token Format
```json
{
  "error": "Invalid Token",
  "message": "Malformed authorization header",
  "status": 401
}