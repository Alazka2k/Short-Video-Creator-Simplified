# Authentication Technical Documentation

## Architecture Overview

### Components
1. **Frontend Authentication Client**
   - Handles user interface for authentication
   - Manages token storage and refresh
   - Implements protected route logic

2. **Auth0 Integration**
   - Identity provider configuration
   - Social connection setup
   - JWT token issuance

3. **Backend Auth Service**
   - Token validation and verification
   - Session management
   - User profile synchronization

4. **Database Layer**
   - User data storage
   - Session tracking
   - Role and permission management

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  auth0_id VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  picture VARCHAR(512),
  provider VARCHAR(50),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  video_preferences JSONB,
  notification_settings JSONB,
  api_settings JSONB
);
```

### User Sessions Table
```sql
CREATE TABLE user_sessions (
  session_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  refresh_token_hash VARCHAR(255),
  is_valid BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  invalidated_at TIMESTAMP,
  invalidation_reason VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Roles and Permissions Tables
```sql
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(user_id),
  role_id INTEGER REFERENCES roles(role_id),
  PRIMARY KEY (user_id, role_id)
);
```

## Authentication Flows

### Email Registration Flow
1. User submits email/password
2. Auth0 creates user account
3. Backend creates local user record
4. Session created and tokens issued
5. User profile synchronized

### Social Login Flow
1. User initiates social login
2. Auth0 handles OAuth flow
3. Backend verifies tokens
4. User record created/updated
5. Session established

### Token Refresh Flow
1. Access token expires
2. Refresh token sent to backend
3. Old session invalidated
4. New session created
5. New tokens issued

## Security Implementation

### Token Management
```javascript
class TokenService {
  static async generateAccessToken(user) {
    return jwt.sign(
      {
        auth0_id: user.auth0_id,
        email: user.email,
        name: user.full_name
      },
      config.auth.jwt.secret,
      { expiresIn: '1h' }
    );
  }
}
```

### Session Handling
```javascript
class SessionService {
  async createSession(userId) {
    const sessionId = await authDataAccess.createSession(userId);
    const refreshToken = generateToken();
    await authDataAccess.updateSession(sessionId, {
      refresh_token_hash: hashToken(refreshToken)
    });
    return { sessionId, refreshToken };
  }
}
```

### Middleware Protection
```javascript
const verifyJwtToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.auth.jwt.secret);
    req.user = {
      auth0Id: decoded.auth0_id,
      email: decoded.email
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

## Rate Limiting

### Login Attempts
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    error: 'Too many login attempts',
    retryAfter: '15 minutes'
  }
});
```

### Token Refresh
```javascript
const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 refreshes
  message: {
    error: 'Too many refresh attempts'
  }
});
```

## Error Handling

### Authentication Errors
```javascript
class AuthError extends Error {
  constructor(message, code = 401, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}
```

### Error Responses
```javascript
try {
  // Auth logic
} catch (error) {
  if (error instanceof AuthError) {
    res.status(error.code).json({
      error: error.message,
      details: error.details
    });
  } else {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}
```

## Integration Guidelines

### Auth0 Setup
1. Create Auth0 application
2. Configure social connections
3. Set up API and scopes
4. Configure callback URLs

### Environment Configuration
```javascript
module.exports = {
  auth: {
    auth0: {
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE
    },
    jwt: {
      secret: process.env.JWT_SECRET
    }
  }
};
```

### API Protection
1. Implement JWT middleware
2. Set up rate limiting
3. Configure CORS
4. Enable security headers

## Testing

### Authentication Tests
```javascript
describe('Authentication', () => {
  it('should create user on registration', async () => {
    // Test implementation
  });

  it('should handle social login', async () => {
    // Test implementation
  });

  it('should refresh tokens', async () => {
    // Test implementation
  });
});
```

### Security Tests
```javascript
describe('Security', () => {
  it('should prevent unauthorized access', async () => {
    // Test implementation
  });

  it('should handle rate limiting', async () => {
    // Test implementation
  });
}); 