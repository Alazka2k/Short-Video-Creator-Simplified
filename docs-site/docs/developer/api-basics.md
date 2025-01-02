# API Basics

Learn the fundamentals of integrating with our API.

## API Overview

### Base URLs
- Production: `https://api.short-video-creator.com/v1`
- Staging: `https://api-staging.short-video-creator.com/v1`
- Development: `https://api-dev.short-video-creator.com/v1`

### Request Format
All requests should:
- Use HTTPS
- Include authentication
- Send JSON data
- Specify content type

### Response Format
```json
{
  "status": "success|error",
  "data": {
    // Response data
  },
  "meta": {
    "request_id": "req_123",
    "processing_time": 0.23
  }
}
```

## Making Requests

### HTTP Methods
- GET: Retrieve resources
- POST: Create resources
- PUT: Update resources
- DELETE: Remove resources

### Headers
```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
Accept: application/json
```

### Query Parameters
```http
GET /videos?limit=10&offset=0&sort=created_at
```

### Request Body
```json
{
  "title": "My Video",
  "script": "Welcome to our product showcase",
  "style": "professional",
  "duration": 60
}
```

## Handling Responses

### Success Response
```json
{
  "status": "success",
  "data": {
    "video_id": "vid_123",
    "status": "processing"
  },
  "meta": {
    "request_id": "req_123"
  }
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid video duration",
    "details": {
      "parameter": "duration",
      "constraint": "Must be between 15-300"
    }
  }
}
```

## Rate Limiting

### Limits
- Free: 100 requests/hour
- Pro: 1000 requests/hour
- Enterprise: Custom limits

### Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

### Request
```http
GET /videos?limit=10&offset=0
```

### Response
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "next": "/videos?limit=10&offset=10"
  }
}
```

## Error Handling

### Status Codes
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Server Error

### Best Practices
- Validate input
- Handle rate limits
- Implement retries
- Log errors

## Testing

### Sandbox Environment
- Test credentials
- Simulated responses
- No billing
- Full API access

### Test Data
- Sample videos
- Test scripts
- Mock responses
- Error scenarios

## Need Help?

- View [API Reference](/api-docs)
- Email: dev-support@short-video-creator.com
- Status: [status.short-video-creator.com](https://status.short-video-creator.com) 