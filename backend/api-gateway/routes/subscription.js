/**
 * Subscription Routes for API Gateway
 * 
 * This file defines the routes for the API Gateway to forward subscription-related
 * requests to the Subscription Service.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const serviceAuthMiddleware = require('../middleware/serviceAuth');
const authDataAccess = require('../../services/auth-service/data/authDataAccess');
const jwt = require('jsonwebtoken');
const extractUserFromToken = require('../middleware/userTokenExtractor');

// Get the subscription service URL from environment or config
const SUBSCRIPTION_SERVICE_URL = config.services?.subscription?.url
console.log('To verify the subscription service URL', SUBSCRIPTION_SERVICE_URL);

/**
 * Extract actual user ID from various token types
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Object containing userId and isApiUser flag
 */
async function extractUserContext(req) {
  // Log token details for debugging
  const tokenInfo = {
    type: req.user.gty === 'client-credentials' ? 'M2M' : 'User',
    sub: req.user.sub,
    auth0Id: req.user.auth0_id,
    databaseUser: req.user.databaseUser
  };
  
  logger.info('Token and user context:', tokenInfo);

  // If this is an M2M token, try to get the actual user profile
  let actualUserId = req.user.databaseUser?.userId;
  let isApiUser = req.user.databaseUser?.isApiUser || false;

  if (tokenInfo.type === 'M2M') {
    try {
      // Get the Authorization header from the original request
      const authHeader = req.headers.authorization;
      const userToken = req.headers['x-user-token'] || req.headers['x-forwarded-user-token'];

      logger.info('Checking for user token:', {
        hasUserToken: !!userToken,
        tokenStart: userToken ? `${userToken.substring(0, 10)}...` : null
      });

      if (userToken) {
        // Try to get user profile using the user token
        const gatewayUrl = process.env[`${process.env.NODE_ENV?.toUpperCase()}_GATEWAY_SERVICE_PORT`] || 'http://localhost:3000';
        const profileUrl = `${gatewayUrl}/api/auth/profile`;
        
        logger.info('Making profile request with user token:', {
          url: profileUrl,
          gatewayUrl,
          headers: {
            'Authorization': `Bearer ${userToken.substring(0, 20)}...`, // Log partial token for security
            'Content-Type': 'application/json'
          }
        });

        try {
          const profileResponse = await axios.get(profileUrl, {
            headers: { 
              'Authorization': `Bearer ${userToken}`,
              'Content-Type': 'application/json'
            }
          });

          logger.info('Profile response received:', {
            status: profileResponse.status,
            hasUser: !!profileResponse.data?.user,
            userData: profileResponse.data?.user ? {
              auth0Id: profileResponse.data.user.auth0_id,
              email: profileResponse.data.user.email
            } : null
          });

          if (profileResponse.data?.user) {
            // Get auth0_id from the decoded token
            const decodedToken = jwt.decode(userToken);
            const auth0Id = decodedToken?.auth0_id;
            
            logger.info('Looking up user in database:', { 
              auth0Id,
              email: profileResponse.data.user.email
            });
            
            if (!auth0Id) {
              logger.error('No auth0_id found in token:', { decodedToken });
              throw new Error('No auth0_id found in token');
            }
            
            try {
              // Look up user in database
              const dbUser = await authDataAccess.findUserByAuth0Id(auth0Id);
              if (dbUser) {
                actualUserId = dbUser.user_id;
                isApiUser = false;
                logger.info('Found user in database:', { 
                  userId: actualUserId,
                  auth0Id,
                  email: dbUser.email 
                });
              } else {
                logger.warn('User not found in database:', { 
                  auth0Id,
                  email: profileResponse.data.user.email 
                });
              }
            } catch (dbError) {
              logger.error('Database error looking up user:', {
                error: dbError.message,
                stack: dbError.stack,
                auth0Id
              });
            }
          } else {
            logger.warn('No user data in profile response');
          }
        } catch (profileError) {
          logger.error('Error getting user profile:', {
            error: profileError.message,
            stack: profileError.stack,
            response: {
              status: profileError.response?.status,
              data: profileError.response?.data
            }
          });
          logger.warn('Falling back to API user due to profile error');
        }
      } else {
        logger.warn('No valid user token found');
      }
    } catch (error) {
      logger.error('Error extracting user context:', error);
    }
  }

  return { actualUserId, isApiUser };
}

/**
 * Helper function to forward requests to the subscription service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} endpoint - Target endpoint on subscription service
 * @param {Object} additionalData - Additional data to include in the request
 */
async function forwardToSubscriptionService(req, res, endpoint, additionalData = {}) {
  try {
    const url = `${SUBSCRIPTION_SERVICE_URL}${endpoint}`;
    logger.info(`Forwarding ${req.method} request to subscription service: ${url}`);
    
    // Get user context if applicable
    let userContext = {};
    if (req.user) {
      userContext = await extractUserContext(req);
      logger.info('User context for forwarded request:', userContext);
    }
    
    // Prepare the request data
    const requestData = {
      ...req.body,
      ...additionalData
    };
    
    // Security check for user ID handling
    if (userContext.isApiUser) {
      // For API users (admin), allow them to specify any user ID
      // This permits admin users to work with any user's data for testing
      logger.info('API user detected - using provided userId value for admin operations');
      
      // Ensure we have either userId or user_id in the request
      if (!requestData.userId && !requestData.user_id && userContext.actualUserId) {
        requestData.userId = userContext.actualUserId.toString();
      }
    } else {
      // For regular users, enforce that they can only use their own user ID
      // This prevents users from accessing or modifying other users' data
      if (userContext.actualUserId) {
        // Force the user ID to be the authenticated user's ID for security
        requestData.userId = userContext.actualUserId.toString();
        
        // Log if we're overriding a different user ID for security
        if (requestData.user_id && requestData.user_id !== userContext.actualUserId.toString()) {
          logger.warn('Security: Overriding provided user_id with authenticated user ID', {
            providedUserId: requestData.user_id,
            authenticatedUserId: userContext.actualUserId
          });
        }
      }
    }
    
    // Forward the request with authentication headers
    const response = await axios({
      method: req.method,
      url,
      data: requestData,
      headers: {
        'Content-Type': 'application/json',
        'x-service-auth': req.headers['x-service-auth'] || process.env.SERVICE_AUTH_TOKEN,
        'x-user-token': req.headers['x-user-token'] || req.headers['x-forwarded-user-token'],
        'Authorization': req.headers['authorization']
      },
      params: req.query,
      timeout: 30000 // 30 seconds timeout
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error('Error forwarding to subscription service:', {
      error: error.message,
      stack: error.stack,
      endpoint,
      requestBody: req.body,
      response: {
        status: error.response?.status,
        data: error.response?.data
      }
    });
    
    // Forward the error response
    if (error.response) {
      // Extract the error details from the subscription service response
      const status = error.response.status || 500;
      let errorData = error.response.data;
      
      // Format the error for consistent client-side handling
      if (typeof errorData === 'string') {
        errorData = { error: 'Subscription Service Error', details: errorData };
      }
      
      // Check for specific error types based on message content
      if (errorData.details && errorData.details.includes('already has an active subscription with this plan')) {
        // Send a 409 Conflict for duplicate subscription attempts
        return res.status(409).json({
          error: 'Duplicate Subscription',
          details: 'User already has an active subscription with this plan',
          code: 'DUPLICATE_SUBSCRIPTION'
        });
      }
      
      // For other errors, forward the original error response
      res.status(status).json(errorData);
    } else {
      res.status(500).json({ 
        error: 'Error communicating with subscription service',
        details: error.message
      });
    }
  }
}

/**
 * @route GET /api/subscription/plans
 * @description Get all available subscription plans
 * @access Public - requires service auth
 */
router.get('/plans', serviceAuthMiddleware, async (req, res) => {
  await forwardToSubscriptionService(req, res, '/plans');
});

/**
 * @route GET /api/subscription/plans/:planId
 * @description Get details of a specific plan
 * @access Public - requires service auth
 */
router.get('/plans/:planId', serviceAuthMiddleware, async (req, res) => {
  await forwardToSubscriptionService(req, res, `/plans/${req.params.planId}`);
});

/**
 * @route GET /api/subscription/subscriptions/user/:userId
 * @description Get active subscription for a user
 * @access Protected - requires read:subscription permission
 */
router.get('/subscriptions/user/:userId', 
  verifyAuth0Token, 
  checkPermission('/api/subscription/subscriptions/user'), 
  async (req, res) => {
    try {
      const userContext = await extractUserContext(req);
      
      // Security check: Ensure users can only access their own data
      // unless they have special permissions
      const requestedUserId = req.params.userId;
      
      // Check if this is an API user or if token has read:subscription permission
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasAdminPermission = 
        (req.user.permissions && req.user.permissions.includes('read:subscription')) ||
        tokenScopes.includes('read:subscription') ||
        isApiUser;
        
      if (!hasAdminPermission && userContext.actualUserId !== requestedUserId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only access your own subscription information'
        });
      }
      
      await forwardToSubscriptionService(req, res, `/subscriptions/user/${req.params.userId}`);
    } catch (error) {
      logger.error('Error handling subscription request:', {
        error: error.message,
        stack: error.stack,
        userId: req.params.userId
      });
      
      res.status(500).json({
        error: 'Failed to process subscription request',
        details: error.message
      });
    }
});

/**
 * @route POST /api/subscription/subscriptions
 * @description Create a new subscription
 * @access Protected - requires create:subscription permission
 */
router.post('/subscriptions', 
  verifyAuth0Token,
  checkPermission('/api/subscription/subscriptions'), 
  async (req, res) => {
    try {
      const userContext = await extractUserContext(req);
      
      // If userId not provided in request body, use the authenticated user's ID
      const requestBody = { ...req.body };
      if (!requestBody.userId && userContext.actualUserId) {
        requestBody.userId = userContext.actualUserId.toString();
      }
      
      // Remove any user_id property to avoid confusion - we only use userId consistently
      if (requestBody.user_id) {
        delete requestBody.user_id;
      }
      
      await forwardToSubscriptionService(req, res, '/subscriptions', requestBody);
    } catch (error) {
      logger.error('Error creating subscription:', {
        error: error.message,
        stack: error.stack,
        userId: req.body.userId || 'unknown'
      });
      
      res.status(500).json({
        error: 'Failed to create subscription',
        details: error.message
      });
    }
});

/**
 * @route PUT /api/subscription/subscriptions/:subscriptionId
 * @description Update an existing subscription
 * @access Protected - requires update:subscription permission
 */
router.put('/subscriptions/:subscriptionId', 
  verifyAuth0Token,
  checkPermission('/api/subscription/subscriptions'), 
  async (req, res) => {
    try {
      await forwardToSubscriptionService(req, res, `/subscriptions/${req.params.subscriptionId}`);
    } catch (error) {
      logger.error('Error updating subscription:', {
        error: error.message,
        stack: error.stack,
        subscriptionId: req.params.subscriptionId
      });
      
      res.status(500).json({
        error: 'Failed to update subscription',
        details: error.message
      });
    }
});

/**
 * @route POST /api/subscription/subscriptions/:subscriptionId/cancel
 * @description Cancel a subscription
 * @access Protected - requires update:subscription permission
 */
router.post('/subscriptions/:subscriptionId/cancel', 
  verifyAuth0Token,
  checkPermission('/api/subscription/subscriptions'), 
  async (req, res) => {
    try {
      await forwardToSubscriptionService(req, res, `/subscriptions/${req.params.subscriptionId}/cancel`);
    } catch (error) {
      logger.error('Error cancelling subscription:', {
        error: error.message,
        stack: error.stack,
        subscriptionId: req.params.subscriptionId
      });
      
      res.status(500).json({
        error: 'Failed to cancel subscription',
        details: error.message
      });
    }
});

/**
 * @route GET /api/subscription/token-packages
 * @description Get all available token packages
 * @access Public - requires service auth
 */
router.get('/token-packages', serviceAuthMiddleware, async (req, res) => {
  await forwardToSubscriptionService(req, res, '/token-packages');
});

/**
 * @route GET /api/subscription/token-packages/:packageId
 * @description Get details of a specific token package
 * @access Public - requires service auth
 */
router.get('/token-packages/:packageId', serviceAuthMiddleware, async (req, res) => {
  await forwardToSubscriptionService(req, res, `/token-packages/${req.params.packageId}`);
});

/**
 * @route GET /api/subscription/tokens/balance/:userId
 * @description Get token balance for a user
 * @access Protected - requires read:tokens permission
 */
router.get('/tokens/balance/:userId', 
  verifyAuth0Token,
  checkPermission('/api/subscription/tokens/balance'), 
  async (req, res) => {
    try {
      const userContext = await extractUserContext(req);
      
      // Security check: Ensure users can only access their own data
      // unless they have special permissions
      const requestedUserId = req.params.userId;
      
      // Check if this is an API user or if token has read:tokens permission
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasAdminPermission = 
        (req.user.permissions && req.user.permissions.includes('read:tokens')) ||
        tokenScopes.includes('read:tokens') ||
        isApiUser;
        
      if (!hasAdminPermission && userContext.actualUserId !== requestedUserId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only access your own token information'
        });
      }
      
      await forwardToSubscriptionService(req, res, `/tokens/balance/${req.params.userId}`);
    } catch (error) {
      logger.error('Error fetching token balance:', {
        error: error.message,
        stack: error.stack,
        userId: req.params.userId
      });
      
      res.status(500).json({
        error: 'Failed to fetch token balance',
        details: error.message
      });
    }
});

/**
 * @route POST /api/subscription/tokens/allocate
 * @description Allocate tokens to a user from subscription
 * @access Protected - requires service auth (internal use)
 */
router.post('/tokens/allocate', serviceAuthMiddleware, async (req, res) => {
  await forwardToSubscriptionService(req, res, '/tokens/allocate');
});

/**
 * @route POST /api/subscription/tokens/deduct
 * @description Deduct tokens for service usage
 * @access Protected - requires service auth (internal use)
 */
router.post('/tokens/deduct', serviceAuthMiddleware, async (req, res) => {
  await forwardToSubscriptionService(req, res, '/tokens/deduct');
});

/**
 * @route POST /api/subscription/tokens/purchase
 * @description Purchase tokens package
 * @access Protected - requires purchase:tokens permission
 */
router.post('/tokens/purchase', 
  verifyAuth0Token,
  checkPermission('/api/subscription/tokens/purchase'), 
  async (req, res) => {
    try {
      const userContext = await extractUserContext(req);
      
      // If userId not provided in request body, use the authenticated user's ID
      const requestBody = { ...req.body };
      if (!requestBody.userId && userContext.actualUserId) {
        requestBody.userId = userContext.actualUserId.toString();
      }
      
      await forwardToSubscriptionService(req, res, '/tokens/purchase', requestBody);
    } catch (error) {
      logger.error('Error purchasing tokens:', {
        error: error.message,
        stack: error.stack,
        userId: req.body.userId || 'unknown',
        packageId: req.body.packageId
      });
      
      res.status(500).json({
        error: 'Failed to purchase tokens',
        details: error.message
      });
    }
});

/**
 * @route GET /api/subscription/transactions/user/:userId
 * @description Get token transactions for a user
 * @access Protected - requires read:transactions permission
 */
router.get('/transactions/user/:userId', 
  verifyAuth0Token,
  checkPermission('/api/subscription/transactions'), 
  async (req, res) => {
    try {
      const userContext = await extractUserContext(req);
      
      // Security check: Ensure users can only access their own data
      // unless they have special permissions
      const requestedUserId = req.params.userId;
      
      // Check if this is an API user or if token has read:transactions permission
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasAdminPermission = 
        (req.user.permissions && req.user.permissions.includes('read:transactions')) ||
        tokenScopes.includes('read:transactions') ||
        isApiUser;
        
      if (!hasAdminPermission && userContext.actualUserId !== requestedUserId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only access your own transaction information'
        });
      }
      
      await forwardToSubscriptionService(req, res, `/transactions/user/${req.params.userId}`);
    } catch (error) {
      logger.error('Error fetching transactions:', {
        error: error.message,
        stack: error.stack,
        userId: req.params.userId
      });
      
      res.status(500).json({
        error: 'Failed to fetch transactions',
        details: error.message
      });
    }
});

/**
 * @route GET /api/subscription/token-costs
 * @description Get token costs for different services
 * @access Public - requires service auth
 */
router.get('/token-costs', serviceAuthMiddleware, async (req, res) => {
  await forwardToSubscriptionService(req, res, '/token-costs');
});

/**
 * @route POST /api/subscription/calculate-job-cost
 * @description Calculate token cost for a job
 * @access Protected - requires service auth (internal use)
 */
router.post('/calculate-job-cost', serviceAuthMiddleware, async (req, res) => {
  await forwardToSubscriptionService(req, res, '/calculate-job-cost');
});

/**
 * @route GET /api/subscription/payments/user/:userId
 * @description Get payment history for a user
 * @access Protected - requires read:payments permission
 */
router.get('/payments/user/:userId', 
  verifyAuth0Token,
  checkPermission('/api/subscription/payments'), 
  async (req, res) => {
    try {
      const userContext = await extractUserContext(req);
      
      // Security check: Ensure users can only access their own data
      // unless they have special permissions
      const requestedUserId = req.params.userId;
      
      // Check if this is an API user or if token has read:payments permission
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasAdminPermission = 
        (req.user.permissions && req.user.permissions.includes('read:payments')) ||
        tokenScopes.includes('read:payments') ||
        isApiUser;
        
      if (!hasAdminPermission && userContext.actualUserId !== requestedUserId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only access your own payment information'
        });
      }
      
      await forwardToSubscriptionService(req, res, `/payments/user/${req.params.userId}`);
    } catch (error) {
      logger.error('Error fetching payments:', {
        error: error.message,
        stack: error.stack,
        userId: req.params.userId
      });
      
      res.status(500).json({
        error: 'Failed to fetch payments',
        details: error.message
      });
    }
});

/**
 * @route GET /api/subscription/payments/summary/:userId
 * @description Get payment summary for a user
 * @access Protected - requires read:payments permission
 */
router.get('/payments/summary/:userId', 
  verifyAuth0Token,
  checkPermission('/api/subscription/payments'), 
  async (req, res) => {
    try {
      const userContext = await extractUserContext(req);
      
      // Security check: Ensure users can only access their own data
      // unless they have special permissions
      const requestedUserId = req.params.userId;
      
      // Check if this is an API user or if token has read:payments permission
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasAdminPermission = 
        (req.user.permissions && req.user.permissions.includes('read:payments')) ||
        tokenScopes.includes('read:payments') ||
        isApiUser;
        
      if (!hasAdminPermission && userContext.actualUserId !== requestedUserId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only access your own payment information'
        });
      }
      
      await forwardToSubscriptionService(req, res, `/payments/summary/${req.params.userId}`);
    } catch (error) {
      logger.error('Error fetching payment summary:', {
        error: error.message,
        stack: error.stack,
        userId: req.params.userId
      });
      
      res.status(500).json({
        error: 'Failed to fetch payment summary',
        details: error.message
      });
    }
});

/**
 * @route POST /api/subscription/webhooks/stripe
 * @description Receive and process Stripe webhook events
 * @access Public - verification happens with Stripe signature
 */
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const url = `${SUBSCRIPTION_SERVICE_URL}/webhooks/stripe`;
    logger.info(`Forwarding Stripe webhook to subscription service: ${url}`);
    
    const response = await axios({
      method: 'POST',
      url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': req.headers['stripe-signature'],
        'x-service-auth': process.env.SERVICE_AUTH_TOKEN
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error('Error forwarding Stripe webhook:', {
      error: error.message,
      stack: error.stack,
      response: {
        status: error.response?.status,
        data: error.response?.data
      }
    });
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Error communicating with subscription service',
        details: error.message
      });
    }
  }
});

module.exports = router; 