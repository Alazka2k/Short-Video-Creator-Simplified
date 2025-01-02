# Developer Getting Started

Welcome to the Short Video Creator developer documentation. This guide will help you integrate our video creation capabilities into your applications.

## Quick Start

1. **Get API Credentials**
   - Create a developer account
   - Generate API keys
   - Choose your plan

2. **Make Your First API Call**
   ```bash
   curl -X POST https://api.short-video-creator.com/v1/videos \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "My First Video",
       "script": "Welcome to my video"
     }'
   ```

3. **Handle the Response**
   ```json
   {
     "video_id": "vid_123abc",
     "status": "processing",
     "estimated_completion": "2024-01-20T15:30:00Z"
   }
   ```

## Integration Options

### REST API
Direct API access for:
- Video generation
- Asset management
- Project control
- User management

### SDKs
Official libraries for:
- JavaScript/TypeScript
- Python
- Java
- Ruby

### Webhooks
Real-time notifications for:
- Generation completion
- Status updates
- Error alerts

## Next Steps

1. [Read Authentication Guide](authentication)
2. [Explore API Basics](api-basics)
3. [Set Up Webhooks](webhooks)
4. [Choose an SDK](sdks)

## Resources

- [API Reference](/api-docs)
- [Code Examples](https://github.com/short-video-creator/examples)
- [Support Forum](https://forum.short-video-creator.com)

## Need Help?

- Email: dev-support@short-video-creator.com
- API Status: [status.short-video-creator.com](https://status.short-video-creator.com) 