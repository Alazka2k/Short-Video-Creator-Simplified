# SDKs & Libraries

Official client libraries for integrating with Short Video Creator.

## Available SDKs

### JavaScript/TypeScript
```bash
npm install @short-video-creator/sdk
```

```javascript
import { ShortVideoCreator } from '@short-video-creator/sdk';

const client = new ShortVideoCreator({
  apiKey: 'YOUR_API_KEY'
});

// Create a video
const video = await client.videos.create({
  title: 'My Video',
  script: 'Welcome to our product'
});
```

### Python
```bash
pip install short-video-creator
```

```python
from short_video_creator import Client

client = Client(api_key='YOUR_API_KEY')

# Create a video
video = client.videos.create(
    title='My Video',
    script='Welcome to our product'
)
```

### Java
```xml
<dependency>
  <groupId>com.shortvideocreator</groupId>
  <artifactId>sdk</artifactId>
  <version>1.0.0</version>
</dependency>
```

```java
import com.shortvideocreator.Client;

Client client = new Client("YOUR_API_KEY");

// Create a video
Video video = client.videos().create(
    new VideoCreateParams()
        .setTitle("My Video")
        .setScript("Welcome to our product")
);
```

### Ruby
```bash
gem install short-video-creator
```

```ruby
require 'short_video_creator'

client = ShortVideoCreator::Client.new(api_key: 'YOUR_API_KEY')

# Create a video
video = client.videos.create(
  title: 'My Video',
  script: 'Welcome to our product'
)
```

## Common Features

### Authentication
- API key configuration
- OAuth 2.0 support
- Environment selection
- Custom configurations

### Resource Methods
- CRUD operations
- Pagination handling
- Error management
- Type definitions

### Webhooks
- Event handling
- Signature verification
- Webhook management
- Event types

## Best Practices

### Installation
- Use package managers
- Check dependencies
- Version compatibility
- Environment setup

### Configuration
- Secure key storage
- Environment variables
- Timeout settings
- Retry policies

### Error Handling
```javascript
try {
  const video = await client.videos.create({...});
} catch (error) {
  if (error.type === 'rate_limit_exceeded') {
    // Handle rate limiting
  }
  // Handle other errors
}
```

## SDK Features

### Type Safety
- TypeScript definitions
- Input validation
- Response typing
- Error types

### Automatic Retries
- Network errors
- Rate limiting
- Configurable attempts
- Backoff strategy

### Pagination
```javascript
// Automatic pagination
const allVideos = await client.videos.list();

// Manual pagination
const page1 = await client.videos.list({ limit: 10, offset: 0 });
const page2 = await client.videos.list({ limit: 10, offset: 10 });
```

## Examples

### Video Creation
```javascript
const video = await client.videos.create({
  title: 'Product Demo',
  script: 'Welcome to our showcase...',
  style: 'professional',
  duration: 60,
  voice: {
    type: 'male',
    language: 'en-US'
  }
});
```

### Project Management
```javascript
// Create project
const project = await client.projects.create({
  name: 'Q1 Marketing',
  description: 'Marketing videos for Q1'
});

// Add video to project
await client.projects.addVideo(project.id, video.id);
```

### Asset Management
```javascript
// Upload asset
const asset = await client.assets.upload('./logo.png', {
  type: 'image',
  tags: ['logo', 'brand']
});

// Use in video
const video = await client.videos.create({
  title: 'Branded Video',
  assets: [asset.id]
});
```

## Need Help?

- View [API Reference](/api-docs)
- GitHub Repositories:
  - [JavaScript](https://github.com/short-video-creator/js-sdk)
  - [Python](https://github.com/short-video-creator/python-sdk)
  - [Java](https://github.com/short-video-creator/java-sdk)
  - [Ruby](https://github.com/short-video-creator/ruby-sdk)
- Email: dev-support@short-video-creator.com 