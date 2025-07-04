# Route Updates Guide

## Overview

This document provides step-by-step instructions for updating API Gateway routes to support JWT tokens with custom claims. This involves simplifying authentication middleware and removing the dual token system.

## Prerequisites

- Backend implementation completed ([05_Backend_Implementation.md](./05_Backend_Implementation.md))
- Frontend implementation completed ([06_Frontend_Implementation.md](./06_Frontend_Implementation.md))
- Understanding of current route structure

## Current Route Architecture

### Current Authentication Pattern
```javascript
// Current: Dual token system
router.get('/jobs', 
  verifyAuth0Token,
  checkPermission('/api/job/jobs'),
  async (req, res) => {
    // Extract user from x-user-token header
    const userContext = await extractUserContext(req);
    // Complex user validation logic
  }
);
```

### Target Authentication Pattern
```javascript
// Target: Single JWT with custom claims
router.get('/jobs',
  unifiedAuth({ requireUser: true }),
  async (req, res) => {
    // User context available directly from req.user
    const userId = req.user.userId;
    // Simple, direct access to user data
  }
);
```

## Implementation Steps

### Step 1: Update API Gateway Server

#### 1.1 Update Server Configuration
```javascript
// backend/api-gateway/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const unifiedAuth = require('./middleware/unifiedAuth');
const logger = require('../shared/utils/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['https://narravid.io', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info('API Request:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'api-gateway'
  });
});

// API routes with unified authentication
app.use('/api/auth', require('./routes/auth'));
app.use('/api/job', require('./routes/job'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/assembly', require('./routes/assembly'));
app.use('/api/animation', require('./routes/animation'));
app.use('/api/image', require('./routes/image'));
app.use('/api/voice', require('./routes/voice'));
app.use('/api/video', require('./routes/video'));
app.use('/api/music', require('./routes/music'));
app.use('/api/llm', require('./routes/llm'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('API Gateway Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});

module.exports = app;
```

### Step 2: Update Authentication Routes

#### 2.1 Simplified Auth Routes
```javascript
// backend/api-gateway/routes/auth.js
const express = require('express');
const router = express.Router();
const unifiedAuth = require('../middleware/unifiedAuth');
const userLookupController = require('../../services/auth-service/controllers/user-lookup-controller');
const logger = require('../../shared/utils/logger');

/**
 * @route POST /api/auth/user-lookup
 * @description Lookup/create user for Auth0 Actions
 * @access Service (Auth0 Actions only)
 */
router.post('/user-lookup', unifiedAuth(), async (req, res) => {
  try {
    await userLookupController.lookupUser(req, res);
  } catch (error) {
    logger.error('Error in user lookup route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/auth/profile
 * @description Get current user profile from JWT custom claims
 * @access User
 */
router.get('/profile', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    // User information is now available directly from custom claims
    const user = req.user;
    
    res.json({
      user: {
        user_id: user.userId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
        is_admin: user.isAdmin,
        permissions: user.permissions,
        subscription_plan_id: user.subscriptionPlanId
      }
    });
    
  } catch (error) {
    logger.error('Error getting user profile:', error);
    res.status(500).json({ 
      error: 'Failed to get user profile',
      details: error.message 
    });
  }
});

/**
 * @route GET /api/auth/me
 * @description Alternative endpoint for user profile (backward compatibility)
 * @access User
 */
router.get('/me', unifiedAuth({ requireUser: true }), async (req, res) => {
  // Redirect to profile endpoint
  return router.handle({ ...req, url: '/profile' }, res);
});

/**
 * @route POST /api/auth/logout
 * @description Logout endpoint (mainly for logging purposes)
 * @access User
 */
router.post('/logout', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    logger.info('User logout:', {
      userId: req.user.userId,
      email: req.user.email
    });
    
    res.json({ 
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    logger.error('Error during logout:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
```

#### 2.2 Remove Legacy Auth Middleware
```javascript
// Remove these files (they're no longer needed):
// - backend/api-gateway/middleware/auth0.js (deleted)
// - backend/api-gateway/middleware/userTokenExtractor.js (deleted)
// - backend/api-gateway/middleware/requireUserToken.js (deleted)

// Keep only:
// - backend/api-gateway/middleware/unifiedAuth.js (updated)
// - backend/api-gateway/middleware/serviceAuth.js (for service-to-service calls)
```

### Step 3: Update Job Routes

#### 3.1 Simplified Job Routes
```javascript
// backend/api-gateway/routes/job.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const unifiedAuth = require('../middleware/unifiedAuth');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

const JOB_SERVICE_URL = config.services?.job?.url || 'http://localhost:3003';

/**
 * @route GET /api/job/jobs
 * @description Get user's jobs with pagination and filtering
 * @access User
 */
router.get('/jobs', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    // User ID is now directly available from custom claims
    const userId = req.user.userId;
    const { page = 1, limit = 10, status, search } = req.query;
    
    const params = new URLSearchParams({
      userId: userId.toString(),
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(search && { search })
    });
    
    const url = `${JOB_SERVICE_URL}/jobs?${params}`;
    
    logger.info('Fetching user jobs:', {
      userId,
      url,
      params: Object.fromEntries(params)
    });
    
    const response = await axios.get(url, {
      headers: {
        'x-service-auth': process.env.SERVICE_AUTH_TOKEN
      },
      timeout: 30000
    });
    
    res.json(response.data);
    
  } catch (error) {
    logger.error('Error fetching jobs:', {
      error: error.message,
      userId: req.user?.userId,
      url: error.config?.url
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch jobs',
        details: error.message 
      });
    }
  }
});

/**
 * @route GET /api/job/jobs/:jobId
 * @description Get specific job details
 * @access User (owner) or Admin
 */
router.get('/jobs/:jobId', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.isAdmin;
    
    const url = `${JOB_SERVICE_URL}/jobs/${jobId}`;
    
    const response = await axios.get(url, {
      headers: {
        'x-service-auth': process.env.SERVICE_AUTH_TOKEN
      },
      timeout: 30000
    });
    
    const job = response.data;
    
    // Security check: users can only access their own jobs (unless admin)
    if (!isAdmin && job.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own jobs'
      });
    }
    
    res.json(job);
    
  } catch (error) {
    logger.error('Error fetching job:', {
      error: error.message,
      jobId: req.params.jobId,
      userId: req.user?.userId
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch job',
        details: error.message 
      });
    }
  }
});

/**
 * @route POST /api/job/jobs
 * @description Create new job
 * @access User
 */
router.post('/jobs', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    // User context available directly from custom claims
    const userId = req.user.userId;
    const planId = req.user.subscriptionPlanId;
    const isAdmin = req.user.isAdmin;
    
    const jobData = {
      ...req.body,
      userId,
      planId,
      createdBy: userId,
      // Add user permissions for job service validation
      userPermissions: req.user.permissions,
      isAdmin
    };
    
    logger.info('Creating job:', {
      userId,
      planId,
      jobType: jobData.type,
      sceneCount: jobData.scenes?.length
    });
    
    const url = `${JOB_SERVICE_URL}/jobs`;
    const response = await axios.post(url, jobData, {
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': process.env.SERVICE_AUTH_TOKEN
      },
      timeout: 30000
    });
    
    res.status(201).json(response.data);
    
  } catch (error) {
    logger.error('Error creating job:', {
      error: error.message,
      userId: req.user?.userId,
      requestBody: req.body
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to create job',
        details: error.message 
      });
    }
  }
});

/**
 * @route PUT /api/job/jobs/:jobId
 * @description Update job
 * @access User (owner) or Admin
 */
router.put('/jobs/:jobId', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.isAdmin;
    
    // First, check if user owns this job
    const getJobUrl = `${JOB_SERVICE_URL}/jobs/${jobId}`;
    const jobResponse = await axios.get(getJobUrl, {
      headers: { 'x-service-auth': process.env.SERVICE_AUTH_TOKEN }
    });
    
    const existingJob = jobResponse.data;
    
    if (!isAdmin && existingJob.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own jobs'
      });
    }
    
    const updateData = {
      ...req.body,
      updatedBy: userId,
      updatedAt: new Date().toISOString()
    };
    
    const updateUrl = `${JOB_SERVICE_URL}/jobs/${jobId}`;
    const response = await axios.put(updateUrl, updateData, {
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': process.env.SERVICE_AUTH_TOKEN
      },
      timeout: 30000
    });
    
    res.json(response.data);
    
  } catch (error) {
    logger.error('Error updating job:', {
      error: error.message,
      jobId: req.params.jobId,
      userId: req.user?.userId
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to update job',
        details: error.message 
      });
    }
  }
});

/**
 * @route DELETE /api/job/jobs/:jobId
 * @description Delete job
 * @access User (owner) or Admin
 */
router.delete('/jobs/:jobId', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.isAdmin;
    
    // First, check if user owns this job
    const getJobUrl = `${JOB_SERVICE_URL}/jobs/${jobId}`;
    const jobResponse = await axios.get(getJobUrl, {
      headers: { 'x-service-auth': process.env.SERVICE_AUTH_TOKEN }
    });
    
    const existingJob = jobResponse.data;
    
    if (!isAdmin && existingJob.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own jobs'
      });
    }
    
    const deleteUrl = `${JOB_SERVICE_URL}/jobs/${jobId}`;
    await axios.delete(deleteUrl, {
      headers: { 'x-service-auth': process.env.SERVICE_AUTH_TOKEN },
      timeout: 30000
    });
    
    res.json({ 
      success: true,
      message: 'Job deleted successfully'
    });
    
  } catch (error) {
    logger.error('Error deleting job:', {
      error: error.message,
      jobId: req.params.jobId,
      userId: req.user?.userId
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to delete job',
        details: error.message 
      });
    }
  }
});

module.exports = router;
```

### Step 4: Update Subscription Routes

#### 4.1 Simplified Subscription Routes
```javascript
// backend/api-gateway/routes/subscription.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const unifiedAuth = require('../middleware/unifiedAuth');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

const SUBSCRIPTION_SERVICE_URL = config.services?.subscription?.url || 'http://localhost:3002';

/**
 * Helper function to forward requests to subscription service
 */
async function forwardToSubscriptionService(req, res, endpoint, additionalData = {}) {
  try {
    const url = `${SUBSCRIPTION_SERVICE_URL}${endpoint}`;
    
    const requestData = {
      ...req.body,
      ...additionalData,
      // Add user context from custom claims
      ...(req.user && {
        userId: req.user.userId,
        userEmail: req.user.email,
        planId: req.user.subscriptionPlanId,
        isAdmin: req.user.isAdmin
      })
    };
    
    logger.info('Forwarding to subscription service:', {
      endpoint,
      method: req.method,
      userId: req.user?.userId
    });
    
    const response = await axios({
      method: req.method,
      url,
      data: requestData,
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': process.env.SERVICE_AUTH_TOKEN
      },
      params: req.query,
      timeout: 30000
    });
    
    res.status(response.status).json(response.data);
    
  } catch (error) {
    logger.error('Error forwarding to subscription service:', {
      endpoint,
      error: error.message,
      status: error.response?.status
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Subscription service error',
        details: error.message
      });
    }
  }
}

/**
 * @route GET /api/subscription/plans
 * @description Get all available subscription plans
 * @access Public
 */
router.get('/plans', unifiedAuth(), async (req, res) => {
  await forwardToSubscriptionService(req, res, '/plans');
});

/**
 * @route GET /api/subscription/subscriptions/user/:userId
 * @description Get user's subscription
 * @access User (own data) or Admin
 */
router.get('/subscriptions/user/:userId', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    const requestedUserId = parseInt(req.params.userId);
    const currentUserId = req.user.userId;
    const isAdmin = req.user.isAdmin;
    
    // Security check: users can only access their own data (unless admin)
    if (!isAdmin && currentUserId !== requestedUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own subscription information'
      });
    }
    
    await forwardToSubscriptionService(req, res, `/subscriptions/user/${requestedUserId}`);
    
  } catch (error) {
    logger.error('Error getting user subscription:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

/**
 * @route GET /api/subscription/tokens/balance/:userId
 * @description Get user's token balance
 * @access User (own data) or Admin
 */
router.get('/tokens/balance/:userId', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    const requestedUserId = parseInt(req.params.userId);
    const currentUserId = req.user.userId;
    const isAdmin = req.user.isAdmin;
    
    // Security check
    if (!isAdmin && currentUserId !== requestedUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own token balance'
      });
    }
    
    await forwardToSubscriptionService(req, res, `/tokens/balance/${requestedUserId}`);
    
  } catch (error) {
    logger.error('Error getting token balance:', error);
    res.status(500).json({ error: 'Failed to get token balance' });
  }
});

/**
 * @route POST /api/subscription/subscriptions
 * @description Create or update subscription
 * @access User
 */
router.post('/subscriptions', unifiedAuth({ requireUser: true }), async (req, res) => {
  await forwardToSubscriptionService(req, res, '/subscriptions');
});

/**
 * @route POST /api/subscription/tokens/purchase
 * @description Purchase token package
 * @access User
 */
router.post('/tokens/purchase', unifiedAuth({ requireUser: true }), async (req, res) => {
  await forwardToSubscriptionService(req, res, '/tokens/purchase');
});

module.exports = router;
```

### Step 5: Update Admin Routes

#### 5.1 Admin-Only Routes
```javascript
// backend/api-gateway/routes/admin.js
const express = require('express');
const router = express.Router();
const unifiedAuth = require('../middleware/unifiedAuth');
const logger = require('../../shared/utils/logger');

/**
 * @route GET /api/admin/health
 * @description Admin health check
 * @access Admin
 */
router.get('/health', unifiedAuth({ requireAdmin: true }), async (req, res) => {
  try {
    logger.info('Admin health check:', {
      adminUserId: req.user.userId,
      adminEmail: req.user.email
    });
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      admin: {
        userId: req.user.userId,
        email: req.user.email
      }
    });
    
  } catch (error) {
    logger.error('Error in admin health check:', error);
    res.status(500).json({ error: 'Admin health check failed' });
  }
});

/**
 * @route GET /api/admin/users
 * @description Get all users (admin only)
 * @access Admin
 */
router.get('/users', unifiedAuth({ requireAdmin: true }), async (req, res) => {
  try {
    // Forward to auth service for user management
    // Implementation depends on your user management needs
    res.json({ 
      message: 'User management endpoint',
      admin: req.user.email
    });
    
  } catch (error) {
    logger.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * @route POST /api/admin/batches/run/:batchType
 * @description Run admin batch jobs
 * @access Admin
 */
router.post('/batches/run/:batchType', unifiedAuth({ requireAdmin: true }), async (req, res) => {
  try {
    const { batchType } = req.params;
    
    logger.info('Running admin batch:', {
      batchType,
      adminUserId: req.user.userId,
      adminEmail: req.user.email
    });
    
    // Forward to batch service
    // Implementation depends on your batch processing needs
    res.json({
      success: true,
      message: `Batch ${batchType} started`,
      startedBy: req.user.email
    });
    
  } catch (error) {
    logger.error('Error running batch:', error);
    res.status(500).json({ error: 'Failed to run batch' });
  }
});

module.exports = router;
```

### Step 6: Update Service Routes

#### 6.1 Service-to-Service Routes
```javascript
// backend/api-gateway/routes/llm.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const unifiedAuth = require('../middleware/unifiedAuth');
const serviceAuth = require('../middleware/serviceAuth');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

const LLM_SERVICE_URL = config.services?.llm?.url || 'http://localhost:3004';

/**
 * @route POST /api/llm/generate
 * @description Generate text content
 * @access User
 */
router.post('/generate', unifiedAuth({ requireUser: true }), async (req, res) => {
  try {
    const userId = req.user.userId;
    const planId = req.user.subscriptionPlanId;
    
    const requestData = {
      ...req.body,
      userId,
      planId,
      // Add user context for token deduction
      userPermissions: req.user.permissions
    };
    
    logger.info('LLM generation request:', {
      userId,
      planId,
      prompt: req.body.prompt?.substring(0, 100) + '...'
    });
    
    const response = await axios.post(`${LLM_SERVICE_URL}/generate`, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': process.env.SERVICE_AUTH_TOKEN
      },
      timeout: 30000
    });
    
    res.json(response.data);
    
  } catch (error) {
    logger.error('Error in LLM generation:', {
      error: error.message,
      userId: req.user?.userId
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'LLM generation failed',
        details: error.message 
      });
    }
  }
});

/**
 * @route POST /api/llm/internal/generate
 * @description Internal LLM generation (service-to-service)
 * @access Service
 */
router.post('/internal/generate', serviceAuth, async (req, res) => {
  try {
    const response = await axios.post(`${LLM_SERVICE_URL}/generate`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': process.env.SERVICE_AUTH_TOKEN
      },
      timeout: 30000
    });
    
    res.json(response.data);
    
  } catch (error) {
    logger.error('Error in internal LLM generation:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Internal LLM generation failed',
        details: error.message 
      });
    }
  }
});

module.exports = router;
```

### Step 7: Route Testing and Validation

#### 7.1 Route Testing Script
```javascript
// scripts/test-routes.js
const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_JWT_TOKEN; // JWT with custom claims

async function testRoutes() {
  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      url: `${API_BASE}/health`,
      requiresAuth: false
    },
    {
      name: 'User Profile',
      method: 'GET',
      url: `${API_BASE}/api/auth/profile`,
      requiresAuth: true
    },
    {
      name: 'User Jobs',
      method: 'GET',
      url: `${API_BASE}/api/job/jobs`,
      requiresAuth: true
    },
    {
      name: 'Subscription Plans',
      method: 'GET',
      url: `${API_BASE}/api/subscription/plans`,
      requiresAuth: false
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\nTesting: ${test.name}`);
      
      const headers = {};
      if (test.requiresAuth && TEST_TOKEN) {
        headers.Authorization = `Bearer ${TEST_TOKEN}`;
      }
      
      const response = await axios({
        method: test.method,
        url: test.url,
        headers,
        timeout: 5000
      });
      
      console.log(`✅ ${test.name}: ${response.status} ${response.statusText}`);
      
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.response?.status || 'ERROR'} ${error.message}`);
    }
  }
}

if (require.main === module) {
  testRoutes().then(() => {
    console.log('\nRoute testing completed.');
    process.exit(0);
  }).catch(error => {
    console.error('Route testing failed:', error);
    process.exit(1);
  });
}

module.exports = { testRoutes };
```

#### 7.2 Manual Testing Checklist
```bash
# Test authentication routes
curl -X GET http://localhost:3000/health
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test job routes
curl -X GET http://localhost:3000/api/job/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X POST http://localhost:3000/api/job/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Job","type":"video"}'

# Test subscription routes
curl -X GET http://localhost:3000/api/subscription/plans

curl -X GET http://localhost:3000/api/subscription/subscriptions/user/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 8: Error Handling and Monitoring

#### 8.1 Enhanced Error Handling
```javascript
// backend/api-gateway/middleware/errorHandler.js
const logger = require('../../shared/utils/logger');

const errorHandler = (error, req, res, next) => {
  // Log the error
  logger.error('API Gateway Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    timestamp: new Date().toISOString()
  });
  
  // Authentication errors
  if (error.name === 'UnauthorizedError' || error.status === 401) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
  
  // Authorization errors
  if (error.status === 403) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Insufficient permissions'
    });
  }
  
  // Validation errors
  if (error.name === 'ValidationError' || error.status === 400) {
    return res.status(400).json({
      error: 'Validation failed',
      message: error.message,
      details: error.details || null
    });
  }
  
  // Service unavailable
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Backend service is temporarily unavailable'
    });
  }
  
  // Default server error
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
};

module.exports = errorHandler;
```

#### 8.2 Request Logging Middleware
```javascript
// backend/api-gateway/middleware/requestLogger.js
const logger = require('../../shared/utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Incoming request:', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.userId,
    hasAuth: !!req.headers.authorization
  });
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    logger.info('Request completed:', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = requestLogger;
```

## Validation Checklist

### Route Updates Checklist

- [ ] **Server Configuration**
  - [ ] CORS properly configured
  - [ ] Rate limiting implemented
  - [ ] Security headers added
  - [ ] Error handling comprehensive

- [ ] **Authentication Routes**
  - [ ] User lookup endpoint working
  - [ ] Profile endpoint returns custom claims
  - [ ] Legacy auth middleware removed
  - [ ] Error responses standardized

- [ ] **Job Routes**
  - [ ] User context from custom claims
  - [ ] Security checks implemented
  - [ ] CRUD operations working
  - [ ] Error handling comprehensive

- [ ] **Subscription Routes**
  - [ ] Request forwarding simplified
  - [ ] User context included
  - [ ] Security validation working
  - [ ] Error responses consistent

- [ ] **Admin Routes**
  - [ ] Admin-only access enforced
  - [ ] Custom claims validation
  - [ ] Audit logging implemented
  - [ ] Error handling complete

- [ ] **Service Routes**
  - [ ] Service-to-service auth working
  - [ ] User context passed through
  - [ ] Token deduction logic updated
  - [ ] Performance optimized

- [ ] **Testing and Monitoring**
  - [ ] Route testing script working
  - [ ] Manual testing completed
  - [ ] Error logging comprehensive
  - [ ] Performance monitoring active

## Next Steps

1. **Complete Route Updates** - Follow all steps in this guide
2. **Test All Endpoints** - Use testing scripts and manual verification
3. **Monitor Performance** - Check response times and error rates
4. **Proceed to Testing** - Continue with [Testing Strategy](./08_Testing_Strategy.md)

## Rollback Plan

If issues occur during route updates:

1. **Immediate**: Restore previous route files from git
2. **Middleware**: Restore old authentication middleware
3. **Dependencies**: Restore previous middleware imports
4. **Configuration**: Restore original server configuration
5. **Testing**: Verify all services are responding correctly

## Support

For route update issues:
- Check [Troubleshooting Guide](./12_Troubleshooting.md)
- Review service logs for errors
- Test individual route endpoints
- Verify middleware configuration 