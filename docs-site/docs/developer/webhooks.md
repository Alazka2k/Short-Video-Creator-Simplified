# Webhooks

Learn how to receive real-time updates from our platform.

## Overview

Webhooks allow your application to receive real-time notifications about events in your Short Video Creator account. Instead of polling our API, webhooks push data to your server when events occur.

## Event Types

### Video Events
- `video.created`: Video creation started
- `video.processing`: Processing status updates
- `video.completed`: Video generation completed
- `video.failed`: Generation failed
- `video.updated`: Video details updated
- `video.deleted`: Video removed

### Project Events
- `project.created`: New project created
- `project.updated`: Project details changed
- `project.deleted`: Project removed
- `project.shared`: Project shared with team

### Asset Events
- `asset.created`: New asset uploaded
- `asset.processed`: Asset processing complete
- `asset.failed`: Asset processing failed
- `asset.deleted`: Asset removed

## Setting Up Webhooks

### 1. Create Endpoint
Set up an HTTPS endpoint on your server:
```javascript
app.post('/webhooks/short-video-creator', (req, res) => {
  const event = req.body;
  // Process the event
  res.status(200).send('OK');
});
```

### 2. Register Webhook
```http
POST https://api.short-video-creator.com/v1/webhooks
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "url": "https://your-domain.com/webhooks/short-video-creator",
  "events": ["video.*", "project.updated"],
  "description": "Production webhook"
}
```

### 3. Verify Signature
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return signature === digest;
}
```

## Event Format

### Example Event
```json
{
  "id": "evt_123abc",
  "type": "video.completed",
  "created": "2024-01-20T15:30:00Z",
  "data": {
    "video_id": "vid_456",
    "status": "completed",
    "url": "https://...",
    "duration": 60
  }
}
```

### Common Fields
- `id`: Unique event identifier
- `type`: Event type
- `created`: Timestamp
- `data`: Event-specific data

## Best Practices

### Security
- Validate signatures
- Use HTTPS endpoints
- Implement retry logic
- Store webhook secret securely

### Reliability
- Respond quickly (2xx)
- Process async if needed
- Handle duplicates
- Log all events

### Monitoring
- Track success rates
- Monitor response times
- Set up alerts
- Review logs regularly

## Testing

### Test Events
```http
POST https://api.short-video-creator.com/v1/webhooks/test
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "webhook_id": "webhook_123",
  "event_type": "video.completed"
}
```

### Debugging
- View webhook logs
- Check delivery status
- Retry failed events
- Test signature validation

## Managing Webhooks

### List Webhooks
```http
GET https://api.short-video-creator.com/v1/webhooks
```

### Update Webhook
```http
PUT https://api.short-video-creator.com/v1/webhooks/webhook_123
{
  "events": ["video.completed", "video.failed"]
}
```

### Delete Webhook
```http
DELETE https://api.short-video-creator.com/v1/webhooks/webhook_123
```

## Need Help?

- View [API Reference](/api-docs)
- Email: dev-support@short-video-creator.com
- Status: [status.short-video-creator.com](https://status.short-video-creator.com) 