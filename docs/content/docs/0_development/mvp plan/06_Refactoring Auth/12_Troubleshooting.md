# Troubleshooting Guide

## Overview

This guide covers common issues encountered during the authentication migration to JWT with Custom Claims, along with solutions and debugging steps.

## Quick Diagnostic Checklist

Before diving into specific issues, run through this quick checklist:

- [ ] Auth0 Action is deployed and active in Login Flow
- [ ] Backend user lookup endpoint is responding
- [ ] Custom claims namespace matches across all services
- [ ] Environment variables are set correctly
- [ ] Frontend is using the new authentication hooks
- [ ] JWT tokens contain expected custom claims

## Common Issues by Category

### 1. Auth0 Action Issues

#### Issue: Action fails to deploy
**Symptoms**: Action shows deployment error in Auth0 Dashboard

**Solutions**:
```javascript
// Check for common syntax errors in Action code
exports.onExecutePostLogin = async (event, api) => {
  // Ensure all async calls are properly awaited
  try {
    const response = await fetch(url, options);
    // Handle response...
  } catch (error) {
    console.error('Error:', error);
    // Don't throw - just log and continue
  }
};
```

**Debugging Steps**:
1. Check Action code for syntax errors
2. Verify all required secrets are configured
3. Test Action in isolation before adding to flow
4. Check Auth0 logs for specific error messages

#### Issue: Action times out
**Symptoms**: Login fails with timeout error

**Solutions**:
- Optimize backend user lookup endpoint
- Add timeout handling in Action
- Cache user data to reduce API calls

```javascript
// Add timeout to fetch calls
const response = await fetch(url, {
  ...options,
  timeout: 5000  // 5 second timeout
});
```

**Debugging Steps**:
1. Check backend API response times
2. Monitor Auth0 Action execution logs
3. Add performance logging to Action
4. Reduce payload size in API calls

#### Issue: Custom claims not appearing in tokens
**Symptoms**: JWT tokens missing custom claims

**Solutions**:
1. **Verify namespace format**:
```javascript
// Namespace must be a valid URL
const namespace = 'https://short-video-creator.com/';  // ✅ Correct
const namespace = 'narravid';  // ❌ Wrong
```

2. **Check Action is in Login Flow**:
- Go to Actions → Flows → Login
- Verify Action is present and deployed
- Check flow order (Action should be after login)

3. **Verify claims are being set**:
```javascript
// Ensure all claims are properly set
api.accessToken.setCustomClaim(`${namespace}user_id`, userData.user_id);
api.accessToken.setCustomClaim(`${namespace}email`, userData.email);
// ... other claims
```

**Debugging Steps**:
1. Check Auth0 Action logs for errors
2. Decode JWT token to inspect claims
3. Verify Action is being triggered on login
4. Test with different user types (social vs database)

### 2. Backend API Issues

#### Issue: User lookup endpoint not responding
**Symptoms**: Auth0 Action fails to get user data

**Solutions**:
1. **Check endpoint accessibility**:
```bash
# Test endpoint directly
curl -X POST https://narravid.io/api/auth/user-lookup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_M2M_TOKEN" \
  -d '{"auth0_id":"google-oauth2|123","email":"test@example.com"}'
```

2. **Verify middleware configuration**:
```javascript
// Ensure serviceAuthMiddleware is properly configured
router.post('/user-lookup', serviceAuthMiddleware, async (req, res) => {
  // Controller logic...
});
```

3. **Check database connectivity**:
```javascript
// Add health check
router.get('/health', async (req, res) => {
  try {
    await authDataAccess.testConnection();
    res.json({ status: 'healthy' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});
```

**Debugging Steps**:
1. Check backend server logs
2. Verify database connection
3. Test endpoint with curl/Postman
4. Check network connectivity from Auth0 to backend

#### Issue: Database connection failures
**Symptoms**: User lookup fails with database errors

**Solutions**:
1. **Check connection string**:
```bash
# Verify database URL format
DATABASE_URL=postgresql://username:password@host:5432/database?ssl=true
```

2. **Test database connectivity**:
```javascript
// Test database connection
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}
```

3. **Check SSL configuration**:
```javascript
// For production databases requiring SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

**Debugging Steps**:
1. Test database connection independently
2. Check database server status
3. Verify SSL/TLS configuration
4. Monitor database logs for connection errors

### 3. Frontend Authentication Issues

#### Issue: Users can't login after migration
**Symptoms**: Login button doesn't work or redirects fail

**Solutions**:
1. **Check Auth0 configuration**:
```typescript
// Verify Auth0Provider configuration
<Auth0Provider
  domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
  clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
    scope: "openid profile email"
  }}
>
```

2. **Verify environment variables**:
```bash
# Check all required frontend env vars are set
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=https://narravid.io/api
```

3. **Check callback URLs in Auth0**:
- Go to Auth0 Dashboard → Applications → Your SPA
- Verify callback URLs include production domain
- Add `https://narravid.io` to allowed callback URLs

**Debugging Steps**:
1. Check browser console for errors
2. Verify Auth0 application configuration
3. Test login flow in different browsers
4. Check network tab for failed requests

#### Issue: API calls failing with authentication errors
**Symptoms**: 401/403 errors on API requests

**Solutions**:
1. **Check token format**:
```typescript
// Verify authFetch is using correct token
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = await auth0.getAccessTokenSilently();  // Should get user token
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,  // Single JWT token
      // No x-user-token header needed anymore
    },
  });
};
```

2. **Debug token contents**:
```javascript
// Decode JWT to inspect claims
const token = await auth0.getAccessTokenSilently();
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log('Token claims:', decoded);

// Check for custom claims
const namespace = 'https://short-video-creator.com/';
console.log('User ID:', decoded[`${namespace}user_id`]);
```

3. **Verify backend middleware**:
```javascript
// Check unifiedAuth middleware
const unifiedAuth = (options = {}) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const decoded = jwt.verify(token, secret);
      
      // Extract custom claims
      const namespace = 'https://short-video-creator.com/';
      req.user = {
        userId: decoded[`${namespace}user_id`],
        email: decoded[`${namespace}email`],
        // ... other claims
      };
      
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
};
```

**Debugging Steps**:
1. Inspect JWT tokens in browser dev tools
2. Check API response headers for specific errors
3. Test API endpoints with curl/Postman
4. Verify backend middleware logs

### 4. Token Validation Issues

#### Issue: JWT signature verification fails
**Symptoms**: 401 errors with "Invalid signature" message

**Solutions**:
1. **Check Auth0 configuration**:
```javascript
// Verify JWT verification settings
const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Verify token with proper key
jwt.verify(token, getKey, {
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
}, (err, decoded) => {
  if (err) {
    console.error('Token verification failed:', err);
  } else {
    console.log('Token verified:', decoded);
  }
});
```

2. **Verify environment variables match**:
```bash
# Ensure these match between frontend and backend
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://narravid.io/api
```

**Debugging Steps**:
1. Compare Auth0 settings across environments
2. Check JWKS endpoint accessibility
3. Verify token algorithm and signing key
4. Test with manually generated tokens

#### Issue: Custom claims missing from backend
**Symptoms**: Backend can't extract user information from token

**Solutions**:
1. **Verify namespace consistency**:
```javascript
// Same namespace everywhere
const NAMESPACE = 'https://short-video-creator.com/';

// In Auth0 Action
api.accessToken.setCustomClaim(`${NAMESPACE}user_id`, userData.user_id);

// In backend middleware  
const userId = decoded[`${NAMESPACE}user_id`];
```

2. **Check claim extraction logic**:
```javascript
// Robust claim extraction
function extractCustomClaims(token) {
  try {
    const decoded = jwt.decode(token);
    const namespace = 'https://short-video-creator.com/';
    
    if (!decoded) {
      throw new Error('Invalid token format');
    }
    
    return {
      userId: decoded[`${namespace}user_id`],
      email: decoded[`${namespace}email`],
      name: decoded[`${namespace}name`],
      // ... extract all needed claims
    };
  } catch (error) {
    console.error('Error extracting custom claims:', error);
    return null;
  }
}
```

**Debugging Steps**:
1. Log raw JWT token contents
2. Verify namespace string exactly matches
3. Check Auth0 Action logs for claim setting
4. Test claim extraction independently

### 5. Performance Issues

#### Issue: Authentication is slow
**Symptoms**: Login takes >2 seconds, API calls delayed

**Solutions**:
1. **Optimize Auth0 Action**:
```javascript
// Cache user data to reduce database calls
const userCache = new Map();

exports.onExecutePostLogin = async (event, api) => {
  const cacheKey = event.user.user_id;
  
  if (userCache.has(cacheKey)) {
    const userData = userCache.get(cacheKey);
    // Use cached data...
  } else {
    // Fetch from database and cache...
    userCache.set(cacheKey, userData);
  }
};
```

2. **Optimize backend endpoint**:
```javascript
// Add database connection pooling
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Add response caching
const cache = new Map();
const lookupUser = async (req, res) => {
  const cacheKey = req.body.auth0_id;
  
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  
  // Database lookup...
  cache.set(cacheKey, userData);
  res.json(userData);
};
```

**Debugging Steps**:
1. Monitor Auth0 Action execution time
2. Profile backend API response times
3. Check database query performance
4. Monitor network latency

### 6. Cross-Browser and Mobile Issues

#### Issue: Authentication works in Chrome but not Safari
**Symptoms**: Login fails or tokens not persisted in Safari

**Solutions**:
1. **Check SameSite cookie settings**:
```javascript
// Configure Auth0Provider for cross-browser compatibility
<Auth0Provider
  // ... other props
  cacheLocation="localstorage"  // Use localStorage instead of memory
  useRefreshTokens={true}       // Enable refresh tokens
>
```

2. **Verify CORS configuration**:
```javascript
// Backend CORS settings
app.use(cors({
  origin: ['https://narravid.io', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Debugging Steps**:
1. Test in multiple browsers and private/incognito mode
2. Check browser console for CORS errors
3. Verify cookie settings and storage APIs
4. Test on mobile devices

## Debugging Tools and Techniques

### 1. JWT Token Debugging

**Online JWT Decoder**: Use jwt.io to decode and inspect tokens

**Command Line Debugging**:
```bash
# Decode JWT token parts
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq .
```

**Node.js Debugging**:
```javascript
// Debug token in Node.js
const jwt = require('jsonwebtoken');

function debugToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('Header:', decoded.header);
    console.log('Payload:', decoded.payload);
    console.log('Custom Claims:', Object.keys(decoded.payload).filter(key => 
      key.includes('short-video-creator.com')
    ));
  } catch (error) {
    console.error('Token debug error:', error);
  }
}
```

### 2. Network Debugging

**Backend API Testing**:
```bash
# Test user lookup endpoint
curl -X POST https://narravid.io/api/auth/user-lookup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_M2M_TOKEN" \
  -H "x-service-auth: YOUR_SERVICE_TOKEN" \
  -d '{
    "auth0_id": "google-oauth2|123456789",
    "email": "test@example.com",
    "name": "Test User",
    "provider": "google"
  }' \
  -v  # Verbose output for debugging
```

**Frontend Network Debugging**:
```javascript
// Intercept fetch calls for debugging
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('Fetch request:', args);
  const response = await originalFetch(...args);
  console.log('Fetch response:', response.status, response.headers);
  return response;
};
```

### 3. Logging Configuration

**Enhanced Backend Logging**:
```javascript
// Structured logging for authentication
const logger = require('winston');

const authLogger = logger.createLogger({
  level: 'debug',
  format: logger.format.combine(
    logger.format.timestamp(),
    logger.format.json()
  ),
  transports: [
    new logger.transports.File({ filename: 'auth.log' }),
    new logger.transports.Console()
  ]
});

// Log authentication events
function logAuthEvent(event, data) {
  authLogger.info('Auth Event', {
    event,
    timestamp: new Date().toISOString(),
    ...data
  });
}
```

**Frontend Error Tracking**:
```javascript
// Error boundary for authentication
import { ErrorBoundary } from 'react-error-boundary';

function AuthErrorFallback({ error, resetErrorBoundary }) {
  console.error('Auth Error:', error);
  
  return (
    <div>
      <h2>Authentication Error</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try Again</button>
    </div>
  );
}

// Wrap auth components
<ErrorBoundary FallbackComponent={AuthErrorFallback}>
  <AuthProvider>
    <App />
  </AuthProvider>
</ErrorBoundary>
```

## Environment-Specific Issues

### Development Environment
- Check localhost callback URLs in Auth0
- Verify development environment variables
- Test with HTTP (non-SSL) if needed for local development

### Staging Environment  
- Ensure staging URLs in Auth0 configuration
- Test with production-like data
- Verify SSL certificates

### Production Environment
- Monitor for rate limiting issues
- Check SSL/TLS configuration
- Monitor performance metrics
- Verify backup and recovery procedures

## Emergency Procedures

### Immediate Rollback
If critical issues occur in production:

1. **Disable Auth0 Action** (fastest rollback):
   - Go to Auth0 Dashboard → Actions → Flows → Login
   - Remove Custom Claims action from flow
   - Deploy flow immediately

2. **Revert Backend Middleware**:
   - Deploy previous version of unifiedAuth middleware
   - Restore x-user-token header handling

3. **Revert Frontend Changes**:
   - Deploy previous version with M2M + x-user-token pattern
   - Restore old authentication hooks

### Recovery Verification
After rollback, verify:
- [ ] Users can login successfully
- [ ] API calls work correctly
- [ ] No authentication errors in logs
- [ ] All services functioning normally

## Getting Help

### Internal Resources
1. Check this troubleshooting guide
2. Review implementation documentation
3. Check service logs and monitoring
4. Test in staging environment

### External Resources
1. **Auth0 Documentation**: https://auth0.com/docs/
2. **Auth0 Community**: https://community.auth0.com/
3. **JWT Debugger**: https://jwt.io/
4. **Auth0 Support**: Available for paid plans

### Creating Support Tickets
When creating support tickets, include:
- Detailed error messages and logs
- Steps to reproduce the issue
- Environment details (dev/staging/prod)
- JWT token samples (redacted sensitive data)
- Network request/response details
- Browser and device information

## Prevention Best Practices

### Code Quality
- Use TypeScript for better type safety
- Add comprehensive unit tests
- Implement integration tests
- Use linting and code formatting

### Monitoring
- Set up authentication metrics
- Monitor API response times
- Track error rates and types
- Alert on authentication failures

### Documentation
- Keep environment variables documented
- Update configuration guides
- Document troubleshooting procedures
- Maintain deployment runbooks

### Testing
- Test in multiple browsers
- Test on mobile devices
- Test with different user types
- Test network failure scenarios 