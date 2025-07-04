# Code Examples Guide

## Overview

This document provides comprehensive code examples for implementing JWT with Custom Claims authentication. All examples are production-ready and follow best practices for security, performance, and maintainability.

## Prerequisites

- Understanding of JWT tokens and Auth0
- Familiarity with Node.js, Express, and React
- Basic knowledge of authentication flows
- Database access for user operations

## Auth0 Custom Claims Action

### Complete Auth0 Action Implementation

```javascript
/**
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://short-video-creator.com/';
  
  try {
    // Get user email from Auth0 event
    const userEmail = event.user.email;
    
    if (!userEmail) {
      console.log('No email found for user:', event.user.user_id);
      return;
    }

    console.log('Looking up user by email:', userEmail);

    // Lookup user in your database
    const response = await fetch(`${event.secrets.API_BASE_URL}/api/auth/user-lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${event.secrets.API_M2M_TOKEN}`,
        'x-api-key': event.secrets.API_SECRET_KEY
      },
      body: JSON.stringify({
        email: userEmail,
        auth0_id: event.user.user_id,
        name: event.user.name || event.user.nickname || userEmail
      })
    });

    if (!response.ok) {
      console.error('Failed to lookup user:', response.status, response.statusText);
      
      // Don't fail the login, but log the error
      if (response.status === 404) {
        console.log('User not found, will be created on first API call');
        return;
      }
      
      // For other errors, still allow login but without custom claims
      return;
    }

    const userData = await response.json();
    console.log('User lookup successful:', userData.user?.user_id);

    if (userData.user) {
      // Add custom claims to the token
      api.accessToken.setCustomClaim(`${namespace}user_id`, userData.user.user_id);
      api.accessToken.setCustomClaim(`${namespace}email`, userData.user.email);
      api.accessToken.setCustomClaim(`${namespace}name`, userData.user.name);
      api.accessToken.setCustomClaim(`${namespace}subscription_plan_id`, userData.user.subscription_plan_id);
      api.accessToken.setCustomClaim(`${namespace}is_admin`, userData.user.is_admin || false);
      api.accessToken.setCustomClaim(`${namespace}created_at`, userData.user.created_at);
      
      // Add permission-based claims if needed
      if (userData.user.permissions) {
        api.accessToken.setCustomClaim(`${namespace}permissions`, userData.user.permissions);
      }
      
      // Add subscription-specific claims
      if (userData.user.subscription_plan_id) {
        api.accessToken.setCustomClaim(`${namespace}plan_name`, userData.user.plan_name);
        api.accessToken.setCustomClaim(`${namespace}token_limit`, userData.user.token_limit);
        api.accessToken.setCustomClaim(`${namespace}current_tokens`, userData.user.current_tokens);
      }

      console.log('Custom claims added successfully for user:', userData.user.user_id);
    }

  } catch (error) {
    console.error('Error in custom claims action:', error);
    
    // Don't fail the login - just log the error
    // The user will still be able to log in, but without custom claims
    // The application should handle this gracefully
  }
};

/**
 * @param {Event} event - Details about the user and the context in which they are continuing.
 * @param {PostLoginAPI} api - Interface whose methods can change the behavior of the login.
 */
exports.onContinuePostLogin = async (event, api) => {
  // This function is called if the action flow continues
  // Can be used for additional processing if needed
};
```

### Auth0 Action Configuration

```javascript
// Auth0 Action Dependencies (package.json)
{
  "dependencies": {
    "node-fetch": "^2.6.7"
  }
}

// Auth0 Action Secrets Configuration
// In Auth0 Dashboard > Actions > Custom > [Your Action] > Settings > Secrets
{
  "API_BASE_URL": "https://narravid.io",
  "API_M2M_TOKEN": "your-m2m-token-for-api-calls",
  "API_SECRET_KEY": "your-secret-api-key-for-validation"
}
```

## Backend Implementation

### User Lookup Controller

```javascript
// backend/services/auth-service/controllers/user-lookup-controller.js
const authDataAccess = require('../data/authDataAccess');
const { validateEmail } = require('../utils/validation');
const logger = require('../utils/logger');

class UserLookupController {
  /**
   * Look up or create user for Auth0 custom claims
   * This endpoint is called by Auth0 Action during login
   */
  async lookupUser(req, res) {
    try {
      const { email, auth0_id, name } = req.body;

      // Validate input
      if (!email || !validateEmail(email)) {
        return res.status(400).json({
          error: 'Invalid email address'
        });
      }

      if (!auth0_id) {
        return res.status(400).json({
          error: 'Auth0 ID is required'
        });
      }

      logger.info('User lookup request', { email, auth0_id });

      // Check if user exists
      let user = await authDataAccess.findUserByEmail(email);

      if (!user) {
        // Check if user exists by Auth0 ID
        user = await authDataAccess.findUserByAuth0Id(auth0_id);
      }

      if (!user) {
        // Create new user
        logger.info('Creating new user', { email, auth0_id });
        
        user = await authDataAccess.createUser({
          email,
          auth0_id,
          name: name || email.split('@')[0],
          subscription_plan_id: 1, // Default to free plan
          is_admin: false,
          created_at: new Date(),
          updated_at: new Date()
        });

        logger.info('New user created', { user_id: user.user_id, email });
      } else {
        // Update existing user if needed
        const updates = {};
        
        if (user.auth0_id !== auth0_id) {
          updates.auth0_id = auth0_id;
        }
        
        if (name && user.name !== name) {
          updates.name = name;
        }

        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date();
          user = await authDataAccess.updateUser(user.user_id, updates);
          logger.info('User updated', { user_id: user.user_id, updates });
        }
      }

      // Get user's subscription details
      const subscriptionData = await authDataAccess.getUserSubscription(user.user_id);
      
      // Get user's permissions
      const permissions = await authDataAccess.getUserPermissions(user.user_id);

      // Combine user data with subscription and permissions
      const userData = {
        ...user,
        plan_name: subscriptionData?.plan_name,
        token_limit: subscriptionData?.token_limit,
        current_tokens: subscriptionData?.current_tokens,
        permissions: permissions || []
      };

      res.json({
        user: userData
      });

    } catch (error) {
      logger.error('Error in user lookup', { error: error.message, stack: error.stack });
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to lookup user'
      });
    }
  }

  /**
   * Get user profile with full details
   * This endpoint is called by frontend after authentication
   */
  async getUserProfile(req, res) {
    try {
      const userId = req.user.userId;

      logger.info('Profile request', { userId });

      // Get user data
      const user = await authDataAccess.findUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Get subscription details
      const subscription = await authDataAccess.getUserSubscription(userId);
      
      // Get usage statistics
      const usage = await authDataAccess.getUserUsage(userId);
      
      // Get recent activity
      const recentActivity = await authDataAccess.getUserRecentActivity(userId, 10);

      res.json({
        user: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          is_admin: user.is_admin,
          created_at: user.created_at,
          subscription: subscription,
          usage: usage,
          recent_activity: recentActivity
        }
      });

    } catch (error) {
      logger.error('Error getting user profile', { 
        userId: req.user?.userId, 
        error: error.message 
      });
      
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { name, preferences } = req.body;

      logger.info('Profile update request', { userId, updates: { name, preferences } });

      // Validate input
      if (name && (typeof name !== 'string' || name.length < 1 || name.length > 100)) {
        return res.status(400).json({
          error: 'Name must be between 1 and 100 characters'
        });
      }

      const updates = {};
      
      if (name) updates.name = name;
      if (preferences) updates.preferences = preferences;
      updates.updated_at = new Date();

      const updatedUser = await authDataAccess.updateUser(userId, updates);

      res.json({
        user: updatedUser
      });

    } catch (error) {
      logger.error('Error updating user profile', { 
        userId: req.user?.userId, 
        error: error.message 
      });
      
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new UserLookupController();
```

### Unified Authentication Middleware

```javascript
// backend/api-gateway/middleware/unifiedAuth.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const jwksClient = require('jwks-rsa');
const logger = require('../utils/logger');

// JWKS client for Auth0 token verification
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  requestHeaders: {},
  timeout: 30000,
});

// Promisify JWT verification
const jwtVerify = promisify(jwt.verify);

// Get signing key from Auth0
const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      logger.error('Error getting signing key:', err);
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

const getKeyPromise = promisify(getKey);

/**
 * Unified authentication middleware that handles multiple token types:
 * 1. Auth0 JWT tokens with custom claims (preferred for new implementation)
 * 2. Backend JWT tokens (for service-to-service communication)
 * 3. M2M tokens (legacy support during transition)
 */
class UnifiedAuth {
  constructor(options = {}) {
    this.requireUser = options.requireUser || false;
    this.requireAdmin = options.requireAdmin || false;
    this.allowServiceAuth = options.allowServiceAuth !== false;
    this.customClaimsNamespace = process.env.CUSTOM_CLAIMS_NAMESPACE || 'https://short-video-creator.com/';
  }

  /**
   * Main middleware function
   */
  middleware() {
    return async (req, res, next) => {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          if (this.requireUser || this.requireAdmin) {
            return this.sendUnauthorized(res, 'No token provided');
          }
          return next();
        }

        const token = authHeader.substring(7);
        
        // Attempt to verify and extract user information
        const authResult = await this.verifyToken(token, req);
        
        if (!authResult.success) {
          if (this.requireUser || this.requireAdmin) {
            return this.sendUnauthorized(res, authResult.error);
          }
          return next();
        }

        // Attach user information to request
        req.user = authResult.user;
        req.tokenType = authResult.tokenType;

        // Check user requirements
        if (this.requireUser && !req.user) {
          return this.sendUnauthorized(res, 'User authentication required');
        }

        if (this.requireAdmin && !req.user.isAdmin) {
          return this.sendForbidden(res, 'Admin access required');
        }

        // Log authentication success
        logger.info('Authentication successful', {
          userId: req.user?.userId,
          tokenType: req.tokenType,
          endpoint: req.path
        });

        next();

      } catch (error) {
        logger.error('Authentication middleware error:', {
          error: error.message,
          stack: error.stack,
          endpoint: req.path
        });

        if (this.requireUser || this.requireAdmin) {
          return this.sendUnauthorized(res, 'Authentication failed');
        }
        
        next();
      }
    };
  }

  /**
   * Verify token and extract user information
   */
  async verifyToken(token, req) {
    try {
      // First, try to decode without verification to check token structure
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded) {
        return { success: false, error: 'Invalid token format' };
      }

      // Check if this is an Auth0 token (has 'iss' field with Auth0 domain)
      if (decoded.payload.iss && decoded.payload.iss.includes(process.env.AUTH0_DOMAIN)) {
        return await this.verifyAuth0Token(token, decoded);
      }

      // Check if this is a backend JWT token
      if (decoded.payload.type === 'backend' || decoded.payload.backend === true) {
        return await this.verifyBackendToken(token, decoded);
      }

      // Try as M2M token (legacy support)
      return await this.verifyM2MToken(token, req);

    } catch (error) {
      logger.error('Token verification error:', error);
      return { success: false, error: 'Token verification failed' };
    }
  }

  /**
   * Verify Auth0 JWT token with custom claims
   */
  async verifyAuth0Token(token, decoded) {
    try {
      // Get the signing key
      const signingKey = await getKeyPromise(decoded.header);
      
      // Verify the token
      const verified = await jwtVerify(token, signingKey, {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256']
      });

      // Extract custom claims
      const namespace = this.customClaimsNamespace;
      const user = {
        userId: verified[`${namespace}user_id`],
        email: verified[`${namespace}email`],
        name: verified[`${namespace}name`],
        subscriptionPlanId: verified[`${namespace}subscription_plan_id`],
        isAdmin: verified[`${namespace}is_admin`] || false,
        permissions: verified[`${namespace}permissions`] || [],
        planName: verified[`${namespace}plan_name`],
        tokenLimit: verified[`${namespace}token_limit`],
        currentTokens: verified[`${namespace}current_tokens`],
        auth0Id: verified.sub
      };

      // Validate that we have minimum required user data
      if (!user.userId || !user.email) {
        logger.warn('Auth0 token missing required custom claims', { 
          hasUserId: !!user.userId, 
          hasEmail: !!user.email 
        });
        return { success: false, error: 'Token missing required user information' };
      }

      return {
        success: true,
        user: user,
        tokenType: 'auth0-jwt'
      };

    } catch (error) {
      logger.error('Auth0 token verification failed:', error);
      return { success: false, error: 'Invalid Auth0 token' };
    }
  }

  /**
   * Verify backend JWT token
   */
  async verifyBackendToken(token, decoded) {
    try {
      const verified = await jwtVerify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256']
      });

      const user = {
        userId: verified.user_id,
        email: verified.email,
        name: verified.name,
        isAdmin: verified.is_admin || false,
        subscriptionPlanId: verified.subscription_plan_id
      };

      return {
        success: true,
        user: user,
        tokenType: 'backend-jwt'
      };

    } catch (error) {
      logger.error('Backend token verification failed:', error);
      return { success: false, error: 'Invalid backend token' };
    }
  }

  /**
   * Verify M2M token (legacy support)
   */
  async verifyM2MToken(token, req) {
    try {
      // For M2M tokens, we need to check the x-user-token header
      const userToken = req.headers['x-user-token'];
      
      if (!userToken && this.requireUser) {
        return { success: false, error: 'User token required with M2M authentication' };
      }

      // Verify M2M token (implementation depends on your M2M token format)
      // This is a simplified example - adjust based on your actual M2M token verification
      const m2mVerified = await jwtVerify(token, process.env.M2M_JWT_SECRET || process.env.JWT_SECRET);
      
      if (!m2mVerified || m2mVerified.type !== 'm2m') {
        return { success: false, error: 'Invalid M2M token' };
      }

      // If we have a user token, extract user information
      let user = null;
      if (userToken) {
        try {
          const userVerified = await jwtVerify(userToken, process.env.JWT_SECRET);
          user = {
            userId: userVerified.user_id,
            email: userVerified.email,
            name: userVerified.name,
            isAdmin: userVerified.is_admin || false,
            subscriptionPlanId: userVerified.subscription_plan_id
          };
        } catch (userTokenError) {
          logger.warn('Invalid user token with M2M auth:', userTokenError.message);
          if (this.requireUser) {
            return { success: false, error: 'Invalid user token' };
          }
        }
      }

      return {
        success: true,
        user: user,
        tokenType: 'auth0-m2m'
      };

    } catch (error) {
      logger.error('M2M token verification failed:', error);
      return { success: false, error: 'Invalid M2M token' };
    }
  }

  /**
   * Send unauthorized response
   */
  sendUnauthorized(res, message) {
    logger.warn('Unauthorized access attempt:', message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: message
    });
  }

  /**
   * Send forbidden response
   */
  sendForbidden(res, message) {
    logger.warn('Forbidden access attempt:', message);
    return res.status(403).json({
      error: 'Forbidden',
      message: message
    });
  }
}

/**
 * Factory function to create middleware with options
 */
function createUnifiedAuth(options = {}) {
  const auth = new UnifiedAuth(options);
  return auth.middleware();
}

// Export both the class and factory function
module.exports = createUnifiedAuth;
module.exports.UnifiedAuth = UnifiedAuth;

// Convenience functions for common use cases
module.exports.requireUser = () => createUnifiedAuth({ requireUser: true });
module.exports.requireAdmin = () => createUnifiedAuth({ requireAdmin: true });
module.exports.optional = () => createUnifiedAuth({ requireUser: false });
```

### Route Implementation Examples

```javascript
// backend/api-gateway/routes/auth.js
const express = require('express');
const router = express.Router();
const unifiedAuth = require('../middleware/unifiedAuth');
const userLookupController = require('../../services/auth-service/controllers/user-lookup-controller');

// User lookup endpoint (called by Auth0 Action)
router.post('/user-lookup', 
  unifiedAuth({ allowServiceAuth: true }), // Allow service-to-service calls
  userLookupController.lookupUser
);

// Get user profile (requires user authentication)
router.get('/profile', 
  unifiedAuth.requireUser(), // Requires user to be authenticated
  userLookupController.getUserProfile
);

// Update user profile (requires user authentication)
router.put('/profile', 
  unifiedAuth.requireUser(),
  userLookupController.updateUserProfile
);

// Admin endpoint example
router.get('/admin/users', 
  unifiedAuth.requireAdmin(), // Requires admin user
  async (req, res) => {
    try {
      // Admin-only logic here
      res.json({ message: 'Admin access granted' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
```

```javascript
// backend/api-gateway/routes/jobs.js
const express = require('express');
const router = express.Router();
const unifiedAuth = require('../middleware/unifiedAuth');
const jobService = require('../services/jobService');

// Get user's jobs
router.get('/jobs', 
  unifiedAuth.requireUser(), // Requires user authentication
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const jobs = await jobService.getUserJobs(userId);
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  }
);

// Create new job
router.post('/jobs', 
  unifiedAuth.requireUser(),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const jobData = {
        ...req.body,
        userId: userId // Ensure job is associated with authenticated user
      };
      
      const newJob = await jobService.createJob(jobData);
      res.status(201).json(newJob);
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ error: 'Failed to create job' });
    }
  }
);

// Get specific job (with ownership check)
router.get('/jobs/:jobId', 
  unifiedAuth.requireUser(),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const jobId = req.params.jobId;
      
      const job = await jobService.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      // Check ownership
      if (job.userId !== userId && !req.user.isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  }
);

module.exports = router;
```

## Frontend Implementation

### Updated useAuth Hook

```typescript
// frontend/src/lib/hooks/useAuth.ts
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';

interface CustomUser {
  user_id: number;
  email: string;
  name: string;
  subscription_plan_id: number;
  is_admin: boolean;
  plan_name?: string;
  token_limit?: number;
  current_tokens?: number;
  permissions?: string[];
  auth0_id: string;
}

export const useAuth = () => {
  const {
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0IsLoading,
    user: auth0User,
    loginWithRedirect,
    logout,
    getAccessTokenSilently
  } = useAuth0();

  const [user, setUser] = useState<CustomUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract custom claims from Auth0 user
  useEffect(() => {
    if (auth0IsAuthenticated && auth0User) {
      const namespace = 'https://short-video-creator.com/';
      
      // Extract custom claims from the Auth0 user object
      const customUser: CustomUser = {
        user_id: auth0User[`${namespace}user_id`],
        email: auth0User[`${namespace}email`] || auth0User.email,
        name: auth0User[`${namespace}name`] || auth0User.name,
        subscription_plan_id: auth0User[`${namespace}subscription_plan_id`] || 1,
        is_admin: auth0User[`${namespace}is_admin`] || false,
        plan_name: auth0User[`${namespace}plan_name`],
        token_limit: auth0User[`${namespace}token_limit`],
        current_tokens: auth0User[`${namespace}current_tokens`],
        permissions: auth0User[`${namespace}permissions`] || [],
        auth0_id: auth0User.sub || ''
      };

      setUser(customUser);
    } else {
      setUser(null);
    }
    
    setIsLoading(auth0IsLoading);
  }, [auth0IsAuthenticated, auth0User, auth0IsLoading]);

  /**
   * Get access token for API calls
   * This will return the Auth0 access token with custom claims
   */
  const getToken = async (): Promise<string | null> => {
    try {
      if (!auth0IsAuthenticated) {
        throw new Error('User not authenticated');
      }

      const token = await getAccessTokenSilently({
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
        scope: 'openid profile email'
      });

      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  };

  /**
   * Make authenticated API request
   */
  const apiRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
    try {
      const token = await getToken();
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      };

      const response = await fetch(url, {
        ...options,
        headers
      });

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  };

  /**
   * Login function
   */
  const login = async () => {
    try {
      await loginWithRedirect({
        appState: {
          returnTo: window.location.pathname
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Logout function
   */
  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return user?.is_admin || false;
  };

  /**
   * Get user's subscription plan details
   */
  const getSubscriptionInfo = () => {
    if (!user) return null;
    
    return {
      planId: user.subscription_plan_id,
      planName: user.plan_name,
      tokenLimit: user.token_limit,
      currentTokens: user.current_tokens,
      remainingTokens: user.token_limit ? user.token_limit - (user.current_tokens || 0) : null
    };
  };

  return {
    // Authentication state
    isAuthenticated: auth0IsAuthenticated,
    isLoading,
    user,
    
    // Auth functions
    login,
    logout: handleLogout,
    getToken,
    apiRequest,
    
    // Utility functions
    hasPermission,
    isAdmin,
    getSubscriptionInfo
  };
};
```

### Updated Auth Context

```typescript
// frontend/src/lib/auth/AuthContext.tsx
import { Auth0Provider } from '@auth0/auth0-react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN!;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!;

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
        audience: audience,
        scope: 'openid profile email'
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
};
```

### API Client Example

```typescript
// frontend/src/lib/api/client.ts
import { useAuth } from '@/lib/hooks/useAuth';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make authenticated request
   */
  async request(endpoint: string, options: RequestInit = {}) {
    const { getToken } = useAuth();
    
    try {
      const token = await getToken();
      
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User endpoints
  async getUserProfile() {
    return this.request('/api/auth/profile');
  }

  async updateUserProfile(data: any) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Job endpoints
  async getJobs() {
    return this.request('/api/job/jobs');
  }

  async createJob(data: any) {
    return this.request('/api/job/jobs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getJob(jobId: string) {
    return this.request(`/api/job/jobs/${jobId}`);
  }

  // Subscription endpoints
  async getSubscription() {
    return this.request('/api/subscription/subscriptions/current');
  }

  async getTokenUsage() {
    return this.request('/api/subscription/tokens/usage');
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

// Hook for using API client
export const useApi = () => {
  return apiClient;
};
```

### Component Examples

```tsx
// frontend/src/components/auth/LoginButton.tsx
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';

export const LoginButton = () => {
  const { isAuthenticated, login, logout, isLoading, user } = useAuth();

  if (isLoading) {
    return <Button disabled>Loading...</Button>;
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span>Welcome, {user?.name}</span>
        <Button onClick={logout} variant="outline">
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={login}>
      Login
    </Button>
  );
};
```

```tsx
// frontend/src/components/auth/ProtectedRoute.tsx
import { useAuth } from '@/lib/hooks/useAuth';
import { ReactNode } from 'react';
import { LoginButton } from './LoginButton';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  fallback 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl mb-4">Authentication Required</h1>
        <p className="mb-4">Please log in to access this page.</p>
        <LoginButton />
      </div>
    );
  }

  if (requireAdmin && !user?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl mb-4">Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
};
```

```tsx
// frontend/src/components/dashboard/UserProfile.tsx
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const UserProfile = () => {
  const { user, getSubscriptionInfo } = useAuth();
  const subscription = getSubscriptionInfo();

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Plan:</strong> {subscription?.planName || 'Unknown'}</p>
          <p><strong>Role:</strong> {user.is_admin ? 'Admin' : 'User'}</p>
          
          {subscription && (
            <div className="mt-4">
              <h4 className="font-semibold">Subscription Details</h4>
              <p>Token Limit: {subscription.tokenLimit}</p>
              <p>Used Tokens: {subscription.currentTokens}</p>
              <p>Remaining: {subscription.remainingTokens}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

## Environment Configuration

### Backend Environment Variables

```bash
# backend/.env
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://narravid.io/api
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Custom Claims Configuration
CUSTOM_CLAIMS_NAMESPACE=https://short-video-creator.com/

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
M2M_JWT_SECRET=your-m2m-jwt-secret

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/narravid_db

# API Configuration
API_BASE_URL=https://narravid.io
API_SECRET_KEY=your-api-secret-key

# Service Configuration
NODE_ENV=production
PORT=3000
```

### Frontend Environment Variables

```bash
# frontend/.env.local
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-spa-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=https://narravid.io/api
NEXT_PUBLIC_API_URL=https://narravid.io
```

## Testing Examples

### Unit Test for Middleware

```javascript
// tests/middleware/unifiedAuth.test.js
const unifiedAuth = require('../../backend/api-gateway/middleware/unifiedAuth');
const jwt = require('jsonwebtoken');

describe('Unified Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      path: '/api/test'
    };
    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res)
    };
    next = jest.fn();
  });

  describe('Auth0 JWT Token', () => {
    test('should extract user from valid Auth0 token', async () => {
      const token = createMockAuth0Token({
        'https://short-video-creator.com/user_id': 123,
        'https://short-video-creator.com/email': 'test@example.com',
        'https://short-video-creator.com/is_admin': false
      });

      req.headers.authorization = `Bearer ${token}`;

      const middleware = unifiedAuth.requireUser();
      await middleware(req, res, next);

      expect(req.user).toEqual({
        userId: 123,
        email: 'test@example.com',
        isAdmin: false
      });
      expect(next).toHaveBeenCalled();
    });

    test('should reject token without custom claims', async () => {
      const token = createMockAuth0Token({}); // No custom claims

      req.headers.authorization = `Bearer ${token}`;

      const middleware = unifiedAuth.requireUser();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Admin Access', () => {
    test('should allow admin access for admin users', async () => {
      const token = createMockAuth0Token({
        'https://short-video-creator.com/user_id': 1,
        'https://short-video-creator.com/email': 'admin@example.com',
        'https://short-video-creator.com/is_admin': true
      });

      req.headers.authorization = `Bearer ${token}`;

      const middleware = unifiedAuth.requireAdmin();
      await middleware(req, res, next);

      expect(req.user.isAdmin).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    test('should deny admin access for regular users', async () => {
      const token = createMockAuth0Token({
        'https://short-video-creator.com/user_id': 123,
        'https://short-video-creator.com/email': 'user@example.com',
        'https://short-video-creator.com/is_admin': false
      });

      req.headers.authorization = `Bearer ${token}`;

      const middleware = unifiedAuth.requireAdmin();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

function createMockAuth0Token(customClaims) {
  const payload = {
    iss: `https://${process.env.AUTH0_DOMAIN}/`,
    aud: process.env.AUTH0_AUDIENCE,
    sub: 'auth0|123456789',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...customClaims
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret');
}
```

### Integration Test Example

```javascript
// tests/integration/auth-flow.test.js
const request = require('supertest');
const app = require('../../backend/api-gateway/server');
const jwt = require('jsonwebtoken');

describe('Authentication Flow Integration', () => {
  let authToken;

  beforeAll(() => {
    // Create test token with custom claims
    authToken = jwt.sign({
      iss: `https://${process.env.AUTH0_DOMAIN}/`,
      aud: process.env.AUTH0_AUDIENCE,
      sub: 'auth0|test123',
      'https://short-video-creator.com/user_id': 123,
      'https://short-video-creator.com/email': 'test@example.com',
      'https://short-video-creator.com/name': 'Test User',
      'https://short-video-creator.com/subscription_plan_id': 2,
      'https://short-video-creator.com/is_admin': false,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
    }, process.env.JWT_SECRET);
  });

  test('should access user profile with valid token', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.user).toMatchObject({
      user_id: 123,
      email: 'test@example.com'
    });
  });

  test('should create job with user context', async () => {
    const jobData = {
      title: 'Test Job',
      type: 'video',
      scenes: [{ content: 'Test scene' }]
    };

    const response = await request(app)
      .post('/api/job/jobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(jobData)
      .expect(201);

    expect(response.body.userId).toBe(123);
    expect(response.body.title).toBe('Test Job');
  });

  test('should reject unauthorized requests', async () => {
    await request(app)
      .get('/api/auth/profile')
      .expect(401);
  });

  test('should reject requests with invalid tokens', async () => {
    await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
```

This comprehensive code examples guide provides production-ready implementations for all major components of the JWT with Custom Claims authentication system. Each example includes proper error handling, security considerations, and follows best practices for maintainability and scalability. 