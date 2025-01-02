# Developer Authentication

Learn how to authenticate your API requests and manage access tokens.

## Authentication Methods

### API Keys
For server-to-server integrations:
- Generate in developer dashboard
- Include in Authorization header
- Rotate regularly
- Environment-specific keys

### OAuth 2.0
For user-based access:
- Standard OAuth 2.0 flow
- Access and refresh tokens
- Scope-based permissions
- Token management

## Getting API Keys

1. **Create Developer Account**
   - Register at developer portal
   - Verify email
   - Complete profile

2. **Create Application**
   - Name your application
   - Add description
   - Set platform type
   - Choose scopes

3. **Generate Keys**
   - Development keys
   - Production keys
   - Sandbox environment
   - Rate limits apply

## Using API Keys

### HTTP Header
```bash
Authorization: Bearer YOUR_API_KEY
```

### SDK Configuration
```javascript
const client = new ShortVideoCreator({
  apiKey: 'YOUR_API_KEY',
  environment: 'production'
});
```

## OAuth Integration

### 1. Authorization Request
```http
GET https://auth.short-video-creator.com/oauth/authorize
?client_id=YOUR_CLIENT_ID
&response_type=code
&redirect_uri=YOUR_REDIRECT_URI
&scope=read write
```

### 2. Token Exchange
```http
POST https://auth.short-video-creator.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&code=AUTHORIZATION_CODE
&redirect_uri=YOUR_REDIRECT_URI
```

### 3. Token Usage
```bash
Authorization: Bearer USER_ACCESS_TOKEN
```

## Security Best Practices

### API Keys
- Never expose in client-side code
- Use environment variables
- Rotate regularly
- Monitor usage

### OAuth Tokens
- Secure storage
- Implement refresh flow
- Handle expiration
- Revoke unused tokens

### General Security
- Use HTTPS only
- Validate all input
- Rate limit requests
- Log access attempts

## Token Management

### Refresh Flow
```http
POST https://auth.short-video-creator.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&refresh_token=REFRESH_TOKEN
```

### Token Revocation
```http
POST https://auth.short-video-creator.com/oauth/revoke
Content-Type: application/x-www-form-urlencoded

token=TOKEN_TO_REVOKE
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
```

## Error Handling

### Common Errors
- 401: Invalid credentials
- 403: Insufficient scope
- 429: Rate limit exceeded

### Best Practices
- Implement retry logic
- Handle token refresh
- Log authentication errors
- Monitor failed attempts

## Need Help?

- View [API Reference](/api-docs)
- Email: dev-support@short-video-creator.com
- Status: [status.short-video-creator.com](https://status.short-video-creator.com) 