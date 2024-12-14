# Backend Authentication Implementation

## Core Components

### 1. Auth Controller (`auth-controller.js`)
Handles HTTP endpoints and request/response flow:

```javascript
// Social Login
POST /api/auth/social
{
  body: {
    accessToken: string,
    provider: 'google' | 'apple',
    profile: {
      sub: string,
      email: string,
      name: string,
      picture: string
    }
  }
}

// Email Registration
POST /api/auth/register
{
  body: {
    email: string,
    password: string,
    name: string
  }
}

// Profile Management
GET /api/auth/profile
Authorization: Bearer {token}

// Logout
POST /api/auth/logout
Authorization: Bearer {token}
```

### 2. Auth Service (`auth-service.js`)
Business logic layer:
```javascript
class AuthService {
  async getUserProfile(auth0Id) {
    // Get user details with roles & permissions
  }

  async updateUserProfile(auth0Id, userData) {
    // Update both Auth0 and local DB
  }

  async syncUserWithAuth0(auth0Id) {
    // Sync user data between systems
  }
}
```

### 3. Auth Data Access (`authDataAccess.js`)
Database operations with transaction support:
```javascript
class AuthDataAccess {
  async createUser(userData) {
    return knex.transaction(async trx => {
      // Create user record
      const [user] = await trx('users').insert({...}).returning('*');
      
      // Assign default role
      await trx('user_roles').insert({...});
      
      // Create trial subscription
      await trx('user_subscriptions').insert({...});
      
      return user;
    });
  }
}
```

### 4. Auth Middleware (`auth-middleware.js`)
Security and validation:
```javascript
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token
    const token = req.headers.authorization?.split(' ')[1];
    
    // Validate with JWKS
    const decodedToken = await verifyToken(token);
    
    // Add user to request
    req.user = decodedToken;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const checkPermission = (requiredPermission) => async (req, res, next) => {
  // Permission checking logic
};
```

## Database Schema

```sql
-- Users Table
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  auth0_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  picture VARCHAR(1024),
  provider VARCHAR(50),
  last_login TIMESTAMP WITH TIME ZONE,
  video_preferences JSONB DEFAULT '{"defaultResolution": "1080p"}',
  notification_settings JSONB DEFAULT '{"emailNotifications": true}',
  api_settings JSONB DEFAULT '{"apiKeys": []}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles Table
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions Table
CREATE TABLE permissions (
  permission_id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource_type VARCHAR(50),
  action VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction Tables
CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(role_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  role_id INTEGER REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(permission_id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Subscriptions
CREATE TABLE user_subscriptions (
  subscription_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES plans(plan_id),
  status VARCHAR(50) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Error Handling

```javascript
class AuthError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.details = details;
  }
}

// Usage in controller
try {
  // Auth logic
} catch (error) {
  if (error instanceof AuthError) {
    logger.warn('Auth error:', error);
    res.status(error.code).json({
      error: error.message,
      details: error.details
    });
  } else {
    logger.error('Unexpected error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}
```

## Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});
```

## Logging & Monitoring

```javascript
const logAuthEvent = async (userId, eventType, details) => {
  await knex('auth_logs').insert({
    user_id: userId,
    event_type: eventType,
    details: details,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    created_at: new Date()
  });
};
```