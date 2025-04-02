# TC-API-AUTH-004: Update User Profile

## Description
Update user profile information including preferences and notification settings.

## API Details

### Endpoint
```http
PATCH /api/auth/profile
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
  "full_name": "Updated Name",
  "picture": "https://example.com/new-photo.jpg",
  "video_preferences": {
    "defaultStyle": "cinematic",
    "defaultVoice": "neural-2",
    "defaultLanguage": "de"
  },
  "notification_settings": {
    "emailNotifications": true,
    "videoCompletionAlert": false
  }
}
```

### Expected Response
```json
{
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "full_name": "Updated Name",
    "picture": "https://example.com/new-photo.jpg",
    "video_preferences": {
      "defaultStyle": "cinematic",
      "defaultVoice": "neural-2",
      "defaultLanguage": "de"
    },
    "notification_settings": {
      "emailNotifications": true,
      "videoCompletionAlert": false
    },
    "updated_at": "2024-01-14T12:00:00Z"
  }
}
```

## Database Verification

### Expected State
```sql
-- Updated user record
UPDATE users 
SET 
  full_name = 'Updated Name',
  picture = 'https://example.com/new-photo.jpg',
  video_preferences = '{"defaultStyle": "cinematic", "defaultVoice": "neural-2", "defaultLanguage": "de"}'::jsonb,
  notification_settings = '{"emailNotifications": true, "videoCompletionAlert": false}'::jsonb,
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1;
```

### Verification Queries
```sql
-- Verify profile updates
SELECT 
  user_id, 
  full_name, 
  picture, 
  video_preferences,
  notification_settings,
  updated_at
FROM users
WHERE user_id = 1;

-- Verify update timestamp
SELECT updated_at 
FROM users 
WHERE user_id = 1 
  AND updated_at > NOW() - INTERVAL '5 minutes';

-- Verify JSON fields
SELECT 
  video_preferences->>'defaultStyle' as style,
  video_preferences->>'defaultVoice' as voice,
  notification_settings->>'emailNotifications' as email_notifications
FROM users
WHERE user_id = 1;
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

### Invalid Fields
```json
{
  "error": "Validation Error",
  "message": "Invalid field values",
  "details": {
    "defaultStyle": "Must be one of: modern, cinematic, casual",
    "defaultVoice": "Must be a valid voice ID"
  },
  "status": 400
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

### Concurrent Update Conflict
```json
{
  "error": "Conflict",
  "message": "Profile was updated by another request",
  "status": 409
}
``` 