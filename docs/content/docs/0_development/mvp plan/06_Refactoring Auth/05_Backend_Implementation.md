# Backend Implementation Guide

### Note: This documentation is deprecated.

## Overview

This document provides step-by-step instructions for updating backend services to support JWT tokens with custom claims. This includes middleware updates, endpoint creation, and authentication logic modifications.

## Prerequisites

- Auth0 configuration completed ([04_Auth0_Configuration.md](./04_Auth0_Configuration.md))
- Auth0 Action deployed and tested
- Backend development environment set up
- Database access for user operations

## Implementation Steps

### Step 1: Update Environment Variables

#### 1.1 Add Custom Claims Configuration
Add these environment variables to all backend services:

```bash
# Custom Claims Configuration
CUSTOM_CLAIMS_NAMESPACE=https://short-video-creator.com/
AUTH0_AUDIENCE=https://narravid.io/api
AUTH0_ISSUER=https://[your-tenant].auth0.com/
AUTH0_ALGORITHMS=RS256

# M2M Configuration for Auth0 Action calls
AUTH0_M2M_CLIENT_ID=[your-m2m-client-id]
AUTH0_M2M_CLIENT_SECRET=[your-m2m-client-secret]
```

#### 1.2 Update Service Configuration
```javascript
// backend/shared/utils/config.js
module.exports = {
  auth: {
    auth0: {
      domain: process.env.AUTH0_DOMAIN,
      audience: process.env.AUTH0_AUDIENCE,
      issuer: process.env.AUTH0_ISSUER,
      algorithms: [process.env.AUTH0_ALGORITHMS || 'RS256']
    },
    customClaims: {
      namespace: process.env.CUSTOM_CLAIMS_NAMESPACE
    },
    m2m: {
      clientId: process.env.AUTH0_M2M_CLIENT_ID,
      clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE
    }
  }
};
```

### Step 2: Create User Lookup Endpoint

#### 2.1 Create Controller
```javascript
// backend/services/auth-service/controllers/user-lookup-controller.js
const authDataAccess = require('../data/authDataAccess');
const logger = require('../../../shared/utils/logger');

const UserLookupController = {
  async lookupUser(req, res) {
    try {
      const { auth0_id, email, name, picture, provider } = req.body;
      
      logger.info('User lookup request:', { auth0_id, email, provider });
      
      if (!auth0_id || !email) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'auth0_id and email are required'
        });
      }
      
      // Try to find existing user
      let user = await authDataAccess.findUserByAuth0Id(auth0_id);
      
      if (user) {
        // Update existing user with latest info
        const updatedUser = await authDataAccess.updateUser(user.user_id, {
          name: name || user.name,
          picture: picture || user.picture,
          last_login: new Date(),
          provider: provider || user.provider
        });
        
        logger.info('Existing user found and updated:', { 
          userId: updatedUser.user_id,
          email: updatedUser.email 
        });
        
        return res.json({
          user_id: updatedUser.user_id,
          email: updatedUser.email,
          name: updatedUser.name,
          picture: updatedUser.picture,
          provider: updatedUser.provider,
          is_admin: updatedUser.is_admin || false,
          permissions: updatedUser.permissions || [],
          subscription_plan_id: updatedUser.subscription_plan_id || 1
        });
        
      } else {
        // Create new user
        const newUser = await authDataAccess.createUser({
          auth0_id,
          email,
          name: name || email.split('@')[0],
          picture,
          provider: provider || 'auth0',
          is_admin: false,
          subscription_plan_id: 1 // Default to free plan
        });
        
        logger.info('New user created:', { 
          userId: newUser.user_id,
          email: newUser.email 
        });
        
        return res.json({
          user_id: newUser.user_id,
          email: newUser.email,
          name: newUser.name,
          picture: newUser.picture,
          provider: newUser.provider,
          is_admin: false,
          permissions: [],
          subscription_plan_id: 1
        });
      }
      
    } catch (error) {
      logger.error('Error in user lookup:', {
        error: error.message,
        stack: error.stack,
        requestBody: req.body
      });
      
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to lookup/create user'
      });
    }
  }
};

module.exports = UserLookupController;
```

#### 2.2 Add Route to Auth Service
```javascript
// backend/services/auth-service/index.js
const userLookupController = require('./controllers/user-lookup-controller');

// Add new route for Auth0 Action calls
router.post('/user-lookup', serviceAuthMiddleware, async (req, res) => {
  try {
    await userLookupController.lookupUser(req, res);
  } catch (error) {
    logger.error('Error in user lookup route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Step 3: Update Unified Auth Middleware

#### 3.1 Enhance Custom Claims Extraction
```javascript
// backend/api-gateway/middleware/unifiedAuth.js
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

// JWKS client for Auth0 token verification
const client = jwksClient({
  jwksUri: `https://${config.auth.auth0.domain}/.well-known/jwks.json`,
  requestHeaders: {},
  timeout: 30000,
});

// Get signing key for Auth0 tokens
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      logger.error('Error getting signing key:', err);
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

/**
 * Extract custom claims from JWT token
 */
function extractCustomClaims(token) {
  try {
    const decoded = jwt.decode(token);
    const namespace = config.auth.customClaims.namespace;
    
    if (!decoded || !namespace) {
      return null;
    }
    
    // Extract all custom claims
    const customClaims = {};
    Object.keys(decoded).forEach(key => {
      if (key.startsWith(namespace)) {
        const claimName = key.replace(namespace, '');
        customClaims[claimName] = decoded[key];
      }
    });
    
    if (Object.keys(customClaims).length === 0) {
      return null;
    }
    
    return {
      userId: customClaims.user_id,
      email: customClaims.email,
      name: customClaims.name,
      picture: customClaims.picture,
      provider: customClaims.provider,
      isAdmin: customClaims.is_admin || false,
      permissions: customClaims.permissions || [],
      subscriptionPlanId: customClaims.subscription_plan_id || 1
    };
    
  } catch (error) {
    logger.error('Error extracting custom claims:', error);
    return null;
  }
}

/**
 * Verify Auth0 JWT token with custom claims
 */
function verifyAuth0Token(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: config.auth.auth0.audience,
      issuer: config.auth.auth0.issuer,
      algorithms: config.auth.auth0.algorithms
    }, (err, decoded) => {
      if (err) {
        logger.error('Auth0 token verification failed:', err);
        return reject(err);
      }
      
      // Extract custom claims
      const customClaims = extractCustomClaims(token);
      
      resolve({
        token: decoded,
        user: customClaims
      });
    });
  });
}

/**
 * Enhanced unified authentication middleware
 */
const unifiedAuth = (options = {}) => {
  const { requireUser = false, requireAdmin = false } = options;
  
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (requireUser || requireAdmin) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Bearer token is required'
          });
        }
        return next();
      }
      
      const token = authHeader.substring(7);
      const tokenType = determineTokenType(token);
      
      logger.info('Processing token:', { tokenType });
      
      switch (tokenType) {
        case 'auth0-user':
        case 'auth0-m2m':
          try {
            const { token: decodedToken, user: customClaims } = await verifyAuth0Token(token);
            
            // Set service authentication (for all Auth0 tokens)
            req.serviceAuth = {
              valid: true,
              type: tokenType,
              token: decodedToken
            };
            
            // Set user context from custom claims (if available)
            if (customClaims && customClaims.userId) {
              req.user = {
                userId: customClaims.userId,
                email: customClaims.email,
                name: customClaims.name,
                picture: customClaims.picture,
                provider: customClaims.provider,
                isAdmin: customClaims.isAdmin,
                permissions: customClaims.permissions,
                subscriptionPlanId: customClaims.subscriptionPlanId
              };
              
              logger.info('User context set from custom claims:', {
                userId: req.user.userId,
                email: req.user.email,
                provider: req.user.provider
              });
            }
            
            // Validation for user requirements
            if (requireUser && (!req.user || !req.user.userId)) {
              return res.status(401).json({
                error: 'User authentication required',
                message: 'Valid user context is required for this endpoint'
              });
            }
            
            if (requireAdmin && (!req.user || !req.user.isAdmin)) {
              return res.status(403).json({
                error: 'Admin access required',
                message: 'Administrator privileges are required for this endpoint'
              });
            }
            
            break;
            
          } catch (auth0Error) {
            logger.error('Auth0 token verification failed:', auth0Error);
            return res.status(401).json({
              error: 'Invalid token',
              message: 'Auth0 token verification failed'
            });
          }
          
        case 'backend':
          // Handle legacy backend tokens (for backward compatibility)
          try {
            const decoded = jwt.verify(token, config.auth.jwt.secret);
            
            req.serviceAuth = {
              valid: true,
              type: 'backend',
              token: decoded
            };
            
            req.user = {
              userId: decoded.user_id,
              email: decoded.email,
              name: decoded.name,
              picture: decoded.picture,
              provider: decoded.provider || 'unknown',
              isAdmin: decoded.is_admin || false,
              permissions: decoded.permissions || [],
              subscriptionPlanId: decoded.subscription_plan_id || 1
            };
            
            break;
            
          } catch (backendError) {
            logger.error('Backend token verification failed:', backendError);
            return res.status(401).json({
              error: 'Invalid backend token',
              message: 'Backend token verification failed'
            });
          }
          
        default:
          logger.error('Unknown token type:', tokenType);
          return res.status(401).json({
            error: 'Invalid token type',
            message: 'Unsupported token format'
          });
      }
      
      next();
      
    } catch (error) {
      logger.error('Unified auth middleware error:', error);
      res.status(500).json({
        error: 'Authentication error',
        message: 'Internal authentication error'
      });
    }
  };
};

module.exports = unifiedAuth;
```

### Step 4: Update API Gateway Routes

#### 4.1 Update Auth Routes
```javascript
// backend/api-gateway/routes/auth.js
const userLookupController = require('../../services/auth-service/controllers/user-lookup-controller');

// Add user lookup route for Auth0 Actions
router.post('/user-lookup', serviceAuthMiddleware, async (req, res) => {
  try {
    await userLookupController.lookupUser(req, res);
  } catch (error) {
    logger.error('Error in user lookup route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile route to use custom claims
router.get('/profile', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    // User information is now available from custom claims
    const user = req.user;
    
    res.json({
      user: {
        user_id: user.userId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        is_admin: user.isAdmin,
        subscription_plan_id: user.subscriptionPlanId
      }
    });
    
  } catch (error) {
    logger.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});
```

#### 4.2 Update Other Service Routes
```javascript
// backend/api-gateway/routes/job.js
const unifiedAuth = require('../middleware/unifiedAuth');

// Update job routes to use unified auth with custom claims
router.get('/jobs', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    // User ID is now directly available from custom claims
    const userId = req.user.userId;
    
    const url = `${JOB_SERVICE_URL}/jobs?userId=${userId}`;
    const response = await axios.get(url, {
      headers: {
        'x-service-auth': req.headers['x-service-auth'] || process.env.SERVICE_AUTH_TOKEN
      }
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

router.post('/jobs', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    // User context available from custom claims
    const userId = req.user.userId;
    const planId = req.user.subscriptionPlanId;
    
    const jobData = {
      ...req.body,
      userId,
      planId
    };
    
    const url = `${JOB_SERVICE_URL}/jobs`;
    const response = await axios.post(url, jobData, {
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': req.headers['x-service-auth'] || process.env.SERVICE_AUTH_TOKEN
      }
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});
```

### Step 5: Update Individual Services

#### 5.1 Update Auth Service
```javascript
// backend/services/auth-service/index.js
const express = require('express');
const cors = require('cors');
const unifiedAuth = require('../../api-gateway/middleware/unifiedAuth');
const userLookupController = require('./controllers/user-lookup-controller');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/user-lookup', unifiedAuth(), userLookupController.lookupUser);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service' });
});

module.exports = app;
```

#### 5.2 Update Subscription Service
```javascript
// backend/services/subscription-service/index.js
const unifiedAuth = require('../../api-gateway/middleware/unifiedAuth');

// Update routes to use unified auth
app.get('/tokens/balance/:userId', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    // Validate user can access this data
    const requestedUserId = parseInt(req.params.userId);
    
    if (!req.user.isAdmin && req.user.userId !== requestedUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own token balance'
      });
    }
    
    // Continue with token balance logic...
    const balance = await subscriptionService.getTokenBalance(requestedUserId);
    res.json(balance);
    
  } catch (error) {
    logger.error('Error getting token balance:', error);
    res.status(500).json({ error: 'Failed to get token balance' });
  }
});
```

### Step 6: Update Database Operations

#### 6.1 Enhance User Data Access
```javascript
// backend/services/auth-service/data/authDataAccess.js
const knex = require('../../shared/utils/database');

const AuthDataAccess = {
  // Enhanced user lookup with subscription info
  async findUserByAuth0Id(auth0_id) {
    try {
      const user = await knex('users')
        .leftJoin('user_subscriptions', 'users.user_id', 'user_subscriptions.user_id')
        .leftJoin('plans', 'user_subscriptions.plan_id', 'plans.plan_id')
        .select(
          'users.*',
          'user_subscriptions.plan_id as subscription_plan_id',
          'plans.name as plan_name'
        )
        .where('users.auth0_id', auth0_id)
        .where(function() {
          this.where('user_subscriptions.status', 'active')
            .orWhereNull('user_subscriptions.status');
        })
        .first();
        
      return user;
    } catch (error) {
      logger.error('Error finding user by Auth0 ID:', error);
      throw error;
    }
  },

  // Enhanced user creation with default subscription
  async createUser(userData) {
    const trx = await knex.transaction();
    
    try {
      // Create user
      const [user] = await trx('users')
        .insert({
          auth0_id: userData.auth0_id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          provider: userData.provider,
          is_admin: userData.is_admin || false,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');
      
      // Create default free subscription
      await trx('user_subscriptions').insert({
        user_id: user.user_id,
        plan_id: 1, // Free plan
        status: 'active',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        created_at: new Date()
      });
      
      // Allocate default tokens
      await trx('tokens').insert({
        user_id: user.user_id,
        balance: 300, // Free tier tokens
        allocated_at: new Date()
      });
      
      await trx.commit();
      
      // Return user with subscription info
      return {
        ...user,
        subscription_plan_id: 1
      };
      
    } catch (error) {
      await trx.rollback();
      logger.error('Error creating user:', error);
      throw error;
    }
  }
};

module.exports = AuthDataAccess;
```

### Step 7: Testing and Validation

#### 7.1 Test User Lookup Endpoint
```bash
# Test the user lookup endpoint
curl -X POST http://localhost:3001/user-lookup \
  -H "Content-Type: application/json" \
  -H "x-service-auth: your-service-token" \
  -d '{
    "auth0_id": "google-oauth2|123456",
    "email": "test@example.com",
    "name": "Test User",
    "picture": "https://example.com/avatar.jpg",
    "provider": "google"
  }'
```

#### 7.2 Test Custom Claims Extraction
```javascript
// Test script: test-custom-claims.js
const jwt = require('jsonwebtoken');
const { extractCustomClaims } = require('./middleware/unifiedAuth');

// Mock JWT with custom claims
const mockToken = jwt.sign({
  sub: 'google-oauth2|123456',
  iss: 'https://your-tenant.auth0.com/',
  aud: 'https://narravid.io/api',
  'https://short-video-creator.com/user_id': 30,
  'https://short-video-creator.com/email': 'test@example.com',
  'https://short-video-creator.com/name': 'Test User',
  'https://short-video-creator.com/provider': 'google',
  'https://short-video-creator.com/is_admin': false,
  'https://short-video-creator.com/subscription_plan_id': 2
}, 'test-secret');

console.log('Testing custom claims extraction...');
const claims = extractCustomClaims(mockToken);
console.log('Extracted claims:', claims);
```

### Step 8: Error Handling and Logging

#### 8.1 Enhanced Error Handling
```javascript
// backend/shared/utils/auth-errors.js
class AuthenticationError extends Error {
  constructor(message, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
  }
}

class AuthorizationError extends Error {
  constructor(message, code = 'AUTHZ_ERROR') {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
  }
}

class CustomClaimsError extends Error {
  constructor(message, code = 'CLAIMS_ERROR') {
    super(message);
    this.name = 'CustomClaimsError';
    this.code = code;
  }
}

module.exports = {
  AuthenticationError,
  AuthorizationError,
  CustomClaimsError
};
```

#### 8.2 Comprehensive Logging
```javascript
// backend/shared/utils/auth-logger.js
const logger = require('./logger');

const AuthLogger = {
  logTokenValidation(tokenType, success, userId = null, error = null) {
    const logData = {
      event: 'token_validation',
      tokenType,
      success,
      userId,
      timestamp: new Date().toISOString()
    };
    
    if (error) {
      logData.error = error.message;
      logger.error('Token validation failed:', logData);
    } else {
      logger.info('Token validation successful:', logData);
    }
  },

  logUserLookup(auth0Id, success, userId = null, error = null) {
    const logData = {
      event: 'user_lookup',
      auth0Id,
      success,
      userId,
      timestamp: new Date().toISOString()
    };
    
    if (error) {
      logData.error = error.message;
      logger.error('User lookup failed:', logData);
    } else {
      logger.info('User lookup successful:', logData);
    }
  },

  logCustomClaims(token, claims, success, error = null) {
    const logData = {
      event: 'custom_claims_extraction',
      hasToken: !!token,
      claimsCount: claims ? Object.keys(claims).length : 0,
      success,
      timestamp: new Date().toISOString()
    };
    
    if (error) {
      logData.error = error.message;
      logger.error('Custom claims extraction failed:', logData);
    } else {
      logger.info('Custom claims extracted successfully:', logData);
    }
  }
};

module.exports = AuthLogger;
```

## Validation Checklist

### Backend Implementation Checklist

- [ ] **Environment Variables**
  - [ ] CUSTOM_CLAIMS_NAMESPACE configured
  - [ ] AUTH0_AUDIENCE configured
  - [ ] AUTH0_ISSUER configured
  - [ ] M2M credentials configured

- [ ] **User Lookup Endpoint**
  - [ ] Controller created and tested
  - [ ] Route added to auth service
  - [ ] Database operations working
  - [ ] Error handling implemented

- [ ] **Unified Auth Middleware**
  - [ ] Custom claims extraction working
  - [ ] Auth0 token verification working
  - [ ] User context setting working
  - [ ] Admin validation working

- [ ] **API Gateway Routes**
  - [ ] Auth routes updated
  - [ ] Job routes updated
  - [ ] Subscription routes updated
  - [ ] Error handling consistent

- [ ] **Database Operations**
  - [ ] User lookup enhanced
  - [ ] User creation with subscriptions
  - [ ] Token allocation working
  - [ ] Subscription management working

- [ ] **Testing and Validation**
  - [ ] Unit tests for middleware
  - [ ] Integration tests for endpoints
  - [ ] Manual testing with real tokens
  - [ ] Performance testing completed

- [ ] **Error Handling and Logging**
  - [ ] Custom error classes created
  - [ ] Comprehensive logging implemented
  - [ ] Error responses standardized
  - [ ] Monitoring and alerting configured

## Next Steps

1. **Complete Implementation** - Follow all steps in this guide
2. **Test Thoroughly** - Use [Testing Strategy](./08_Testing_Strategy.md)
3. **Update Frontend** - Proceed to [Frontend Implementation](./06_Frontend_Implementation.md)
4. **Update Routes** - Continue with [Route Updates](./07_Route_Updates.md)

## Rollback Plan

If issues occur during backend implementation:

1. **Immediate**: Revert middleware changes
2. **Database**: Rollback database migrations if needed
3. **Configuration**: Restore original environment variables
4. **Services**: Restart services with previous configuration
5. **Monitoring**: Check all services are healthy

## Support

For backend implementation issues:
- Check [Troubleshooting Guide](./12_Troubleshooting.md)
- Review service logs
- Test individual components
- Verify Auth0 configuration 