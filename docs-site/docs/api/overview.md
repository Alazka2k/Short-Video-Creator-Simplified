# API Overview

The Short Video Creator API provides programmatic access to all platform features, allowing you to integrate video creation capabilities into your applications.

## Base URLs

- Development: `http://localhost:3000/api`
- Staging: `https://api.staging.short-video-creator.com`
- Production: `https://api.short-video-creator.com`

## Authentication

All API requests require authentication. See the [Authentication](authentication) section for details on:
- Obtaining API credentials
- Making authenticated requests
- Managing access tokens

## Rate Limiting

API requests are subject to rate limiting:
- Standard tier: 100 requests per minute
- Premium tier: 1000 requests per minute

## Services

### Content Generation
- [LLM Service](endpoints/llm) - Script and content generation
- [Image Service](endpoints/image) - Image generation and manipulation
- [Voice Service](endpoints/voice) - Text-to-speech conversion
- [Music Service](endpoints/music) - Background music generation

### Video Production
- [Animation Service](endpoints/animation) - Image animation
- [Video Service](endpoints/video) - Video processing
- [Assembly Service](endpoints/assembly) - Final video assembly

### Management
- [Job Service](endpoints/jobs) - Job tracking and management
- [Auth Service](endpoints/auth) - Authentication and user management

## Response Format

All API responses follow a standard format:

```json
{
  "status": "success|error",
  "data": {
    // Response data
  },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Error Handling

Common error codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## SDKs and Libraries

Official SDKs:
- [JavaScript/TypeScript](https://github.com/your-org/svc-js)
- [Python](https://github.com/your-org/svc-python)
- [Java](https://github.com/your-org/svc-java)

## Support

For API support:
- [API Status Page](https://status.short-video-creator.com)
- [Developer Forum](https://forum.short-video-creator.com)
- Email: api-support@short-video-creator.com 