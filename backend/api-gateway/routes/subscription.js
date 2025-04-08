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
        const gatewayUrl = config.services?.gateway?.url;
        
        // Check if gateway URL is configured
        if (!gatewayUrl) {
          logger.error('Gateway URL not configured correctly', {
            config: JSON.stringify(config.services || {})
          });
          throw new Error('Gateway URL configuration missing');
        }
        
        logger.info('Verify Gateway URL:', gatewayUrl);
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
    
    // Check if we have a user token header which indicates a real user request
    const hasUserToken = !!(req.headers['x-user-token'] || req.headers['x-forwarded-user-token']);
    
    // Critical security check for user ID handling
    if (userContext.isApiUser && !hasUserToken) {
      // For API users (admin), allow them to specify any user ID
      // This permits admin users to work with any user's data for testing
      logger.info('API user detected - using provided userId value for admin operations');
      
      // Ensure we have either userId or user_id in the request
      if (!requestData.userId && !requestData.user_id && userContext.actualUserId) {
        requestData.userId = userContext.actualUserId.toString();
      }
    } else {
      // Either we have a regular user OR we have a user token header:
      // In both cases, enforce that they can only use their own user ID
      // This prevents users from accessing or modifying other users' data
      
      if (hasUserToken && !userContext.actualUserId) {
        // If we have a user token but couldn't extract the user context correctly,
        // we must reject the request rather than falling back to API user
        logger.error('Security issue: User token present but no user ID extracted', {
          hasUserToken,
          userContext
        });
        
        throw new Error('Security error: Unable to validate user identity from token');
      }
      
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
      } else if (hasUserToken) {
        // If user token is present but we couldn't extract a user ID, this is an error
        throw new Error('Invalid user token or user not found');
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
  }
  catch (error) {
    logger.error('Error in subscription service request:', {
      endpoint,
      error: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    
    // Send appropriate error response
    const status = error.response?.status || 500;
    const errorResponse = {
      error: error.response?.data?.error || 'Subscription service error',
      message: error.response?.data?.message || error.message,
      details: error.response?.data?.details || null
    };
    
    res.status(status).json(errorResponse);
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
 * @route POST /api/subscription/subscriptions/:userId/renew
 * @description Renew a subscription's token allocation period
 * @access Protected - requires update:subscription permission
 */
router.post('/subscriptions/:userId/renew', 
  verifyAuth0Token,
  checkPermission('/api/subscription/subscriptions'), 
  async (req, res) => {
    try {
      const userContext = await extractUserContext(req);
      const requestedUserId = parseInt(req.params.userId);
      
      // Security check: regular users can only renew their own subscriptions
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasAdminPermission = 
        (req.user.permissions && req.user.permissions.includes('create:subscription')) ||
        tokenScopes.includes('create:subscription') ||
        isApiUser;
        
      if (!hasAdminPermission && userContext.actualUserId !== requestedUserId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only renew your own subscription'
        });
      }
      
      // Forward to the correct endpoint on the subscription service
      // which expects '/subscriptions/user/:userId/renew'
      await forwardToSubscriptionService(req, res, `/subscriptions/user/${req.params.userId}/renew`);
    } catch (error) {
      logger.error('Error renewing subscription:', {
        error: error.message,
        stack: error.stack,
        userId: req.params.userId
      });
      
      res.status(500).json({
        error: 'Failed to renew subscription',
        details: error.message
      });
    }
});

/**
 * @route POST /api/subscription/subscriptions
 * @description Create a new subscription or change an existing subscription plan
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
      
      // Security check: regular users can only create/change their own subscriptions
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasAdminPermission = 
        (req.user.permissions && req.user.permissions.includes('create:subscription')) ||
        tokenScopes.includes('create:subscription') ||
        isApiUser;
        
      if (!hasAdminPermission && userContext.actualUserId.toString() !== requestBody.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only manage your own subscriptions'
        });
      }
      
      // Check if this is a plan change by seeing if the user already has an active subscription
      const userId = requestBody.userId;
      try {
        // Get current subscription if it exists
        const currentSubscription = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/subscriptions/user/${userId}`, {
          headers: { Authorization: req.headers.authorization }
        });
        
        // If we found a subscription and the plan is being changed, we need to check validity
        if (currentSubscription.data && currentSubscription.data.plan_id && 
            requestBody.planId && currentSubscription.data.plan_id !== parseInt(requestBody.planId)) {
          
          // Free tier (plan_id=1) validation - prevent downgrades
          if (currentSubscription.data.plan_id === 1) {
            // Get the new plan to check if it's a downgrade (we need to validate tier_id)
            const newPlanResponse = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/plans/${requestBody.planId}`, {
              headers: { Authorization: req.headers.authorization }
            });
            
            // The backend will handle full validation, but we do a basic check here
            logger.info('Plan change from free tier detected:', {
              currentPlanId: currentSubscription.data.plan_id,
              newPlanId: requestBody.planId,
              newPlanTier: newPlanResponse.data.tier_id
            });
          }
          
          logger.info('Subscription plan change detected:', {
            userId,
            currentPlanId: currentSubscription.data.plan_id,
            newPlanId: requestBody.planId
          });
        }
      } catch (subscriptionCheckError) {
        // If we can't find a current subscription, this is a new subscription - continue
        logger.info('No active subscription found, creating new subscription', {
          userId,
          planId: requestBody.planId
        });
      }
      
      // Remove any user_id property to avoid confusion - we only use userId consistently
      if (requestBody.user_id) {
        delete requestBody.user_id;
      }
      
      await forwardToSubscriptionService(req, res, '/subscriptions', requestBody);
    } catch (error) {
      logger.error('Error creating/changing subscription:', {
        error: error.message,
        stack: error.stack,
        userId: req.body.userId || 'unknown'
      });
      
      res.status(500).json({
        error: 'Failed to create/change subscription',
        details: error.message
      });
    }
});

/**
 * @route GET /api/subscription/subscriptions/pending-cancellations
 * @description Get subscriptions that are pending cancellation
 * @access Protected - requires manage:subscriptions permission (administrative)
 */
router.get('/subscriptions/pending-cancellations', 
  verifyAuth0Token,
  checkPermission('/api/subscription/subscriptions'), 
  async (req, res) => {
    try {
      // This endpoint is for administrative use only - typically used by batch jobs
      // to get subscriptions that are pending cancellation
      const userContext = await extractUserContext(req);
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasManagePermission = 
        (req.user.permissions && req.user.permissions.includes('manage:subscription')) ||
        tokenScopes.includes('manage:subscription') ||
        isApiUser;
      
      if (!hasManagePermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access pending cancellation information'
        });
      }
      
      await forwardToSubscriptionService(req, res, '/subscriptions/pending-cancellations', req.body);
    } catch (error) {
      logger.error('Error fetching pending cancellations:', {
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        error: 'Failed to fetch pending cancellations',
        details: error.message
      });
    }
});

/**
 * @route GET /api/subscription/subscriptions/renewal
 * @description Get subscriptions that need to be renewed
 * @access Protected - requires manage:subscriptions permission (administrative)
 */
router.get('/subscriptions/renewal', 
  verifyAuth0Token,
  checkPermission('/api/subscription/subscriptions'), 
  async (req, res) => {
    try {
      // This endpoint is for administrative use only - typically used by batch jobs
      // to get subscriptions that need to be renewed
      const userContext = await extractUserContext(req);
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasManagePermission = 
        (req.user.permissions && req.user.permissions.includes('manage:subscription')) ||
        tokenScopes.includes('manage:subscription') ||
        isApiUser;
      
      if (!hasManagePermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access renewal information'
        });
      }
      
      await forwardToSubscriptionService(req, res, '/subscriptions/renewal', req.body);
    } catch (error) {
      logger.error('Error fetching subscriptions to renew:', {
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        error: 'Failed to fetch subscriptions to renew',
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
router.post('/subscriptions/:subscriptionId/cancel', [verifyAuth0Token, checkPermission('/api/subscription/subscriptions')], async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userContext = await extractUserContext(req);
    const userId = userContext.actualUserId;
    
    // Check if this is an API user or if token has admin permissions
    const isApiUser = userContext.isApiUser;
    const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
    const hasAdminPermission = 
      (req.user.permissions && req.user.permissions.includes('create:subscription')) ||
      tokenScopes.includes('create:subscription') ||
      isApiUser;
    
    // Get subscription details to validate plan ID and ownership
    const subscription = await axios.get(`${SUBSCRIPTION_SERVICE_URL}/subscriptions/${subscriptionId}`, {
      headers: { Authorization: req.headers.authorization }
    });
    
    // Validate: Free tier (plan_id=1) subscriptions cannot be cancelled
    if (subscription.data.plan_id === 1) {
      return res.status(400).json({ 
        error: 'Invalid Operation', 
        message: 'Free tier subscriptions cannot be cancelled'
      });
    }
    
    // Security check: Regular users can only cancel their own subscriptions
    // Admin users (API users or users with create:subscriptions permission) can cancel any subscription
    if (!hasAdminPermission && subscription.data.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this subscription' });
    }
    
    // Forward the request to subscription service using the helper function
    await forwardToSubscriptionService(req, res, `/subscriptions/${subscriptionId}/cancel`, req.body);
  } catch (error) {
    logger.error('Error cancelling subscription', { error: error.message, stack: error.stack });
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(500).json({ message: 'Failed to cancel subscription', error: error.message });
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
 * @route POST /api/subscription/token-packages/add
 * @description Create a new token package
 * @access Protected - requires manage:token_packages permission (admin only)
 */
// TODO Add only for admins
router.post('/token-packages/add', 
  verifyAuth0Token,
  checkPermission('/api/subscription/token-packages'), 
  async (req, res) => {
    try {
      // Only allow admin users to create token packages
      const userContext = await extractUserContext(req);
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasAdminPermission = 
        (req.user.permissions && req.user.permissions.includes('manage:token_packages')) ||
        tokenScopes.includes('manage:token_packages') ||
        isApiUser;
        
      if (!hasAdminPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only administrators can create token packages'
        });
      }
      
      await forwardToSubscriptionService(req, res, '/token-packages/add');
    } catch (error) {
      logger.error('Error creating token package:', {
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        error: 'Failed to create token package',
        details: error.message
      });
    }
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
 * @route POST /api/subscription/tokens/usage
 * @description Record token usage for service usage
 * @access Protected - requires service auth (internal use)
 */
router.post('/tokens/usage', serviceAuthMiddleware, async (req, res) => {
  await forwardToSubscriptionService(req, res, '/tokens/usage');
});

/**
 * @route POST /api/subscription/tokens/buy
 * @description Buy tokens package
 * @access Protected - requires purchase:tokens permission
 */
router.post('/tokens/buy', 
  verifyAuth0Token,
  checkPermission('/api/subscription/tokens/buy'), 
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
 * @route GET /api/subscription/transactions/token-costs
 * @description Get token costs for different services
 * @access Public - requires service auth
 */
router.get('/transactions/token-costs', serviceAuthMiddleware, async (req, res) => {
  await forwardToSubscriptionService(req, res, '/transactions/token-costs');
});

/**
 * @route POST /api/subscription/calculate-job-cost
 * @description Calculate token cost for a job
 * @access Protected - requires service auth (internal use)
 */
router.post('/transactions/calculate-job-cost', serviceAuthMiddleware, async (req, res) => {
  await forwardToSubscriptionService(req, res, '/transactions/calculate-job-cost');
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
 * @route POST /api/subscription/payments
 * @description Create a new payment record (for renewal payments, token packages, etc.)
 * @access Protected - requires manage:payments permission (administrative)
 */
router.post('/payments', 
  verifyAuth0Token,
  checkPermission('/api/subscription/payments'), 
  async (req, res) => {
    try {
      // This endpoint is for administrative use only
      // Only API users and admin users with specific permission can create payment records
      const userContext = await extractUserContext(req);
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasManagePermission = 
        (req.user.permissions && req.user.permissions.includes('manage:payments')) ||
        tokenScopes.includes('manage:payments') ||
        isApiUser;
      
      if (!hasManagePermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to create payment records'
        });
      }
      
      await forwardToSubscriptionService(req, res, '/payments', req.body);
    } catch (error) {
      logger.error('Error creating payment record:', {
        error: error.message,
        stack: error.stack,
        paymentData: req.body
      });
      
      res.status(500).json({
        error: 'Failed to create payment record',
        details: error.message
      });
    }
});

/**
 * @route POST /api/subscription/payments/:paymentId/status
 * @description Update payment status
 * @access Protected - requires manage:payments permission (administrative)
 */
router.post('/payments/:paymentId/status', 
  verifyAuth0Token,
  checkPermission('/api/subscription/payments'), 
  async (req, res) => {
    try {
      // This endpoint is for administrative use only - typically used by batch jobs
      // to mark renewal payments as completed after successful collection
      const userContext = await extractUserContext(req);
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasManagePermission = 
        (req.user.permissions && req.user.permissions.includes('manage:payments')) ||
        tokenScopes.includes('manage:payments') ||
        isApiUser;
      
      if (!hasManagePermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to update payment status'
        });
      }
      
      await forwardToSubscriptionService(req, res, `/payments/${req.params.paymentId}/status`, req.body);
    } catch (error) {
      logger.error('Error updating payment status:', {
        error: error.message,
        stack: error.stack,
        paymentId: req.params.paymentId,
        status: req.body.status
      });
      
      res.status(500).json({
        error: 'Failed to update payment status',
        details: error.message
      });
    }
});

/**
 * @route POST /api/subscription/payments/update
 * @description Update a payment record with payment provider details
 * @access Protected - requires manage:payments permission (administrative)
 */
router.post('/payments/update', 
  verifyAuth0Token,
  checkPermission('/api/subscription/payments'), 
  async (req, res) => {
    try {
      // This endpoint is for administrative use only - typically used by batch jobs
      // to update payment records with payment provider details
      const userContext = await extractUserContext(req);
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasManagePermission = 
        (req.user.permissions && req.user.permissions.includes('manage:payments')) ||
        tokenScopes.includes('manage:payments') ||
        isApiUser;
      
      if (!hasManagePermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to update payment records'
        });
      }
      
      await forwardToSubscriptionService(req, res, '/payments/update', req.body);
    } catch (error) {
      logger.error('Error updating payment record:', {
        error: error.message,
        stack: error.stack,
        paymentData: req.body
      });
      
      res.status(500).json({
        error: 'Failed to update payment record',
        details: error.message
      });
    }
});

/**
 * @route POST /api/subscription/token-packages/buy
 * @description Purchase a token package
 * @access Protected - requires manage:tokens permission
 */
router.post('/token-packages/buy', 
  verifyAuth0Token,
  checkPermission('/api/subscription/tokens'), 
  async (req, res) => {
    try {
      const userContext = await extractUserContext(req);
      
      // If userId not provided in request body, use the authenticated user's ID
      const requestBody = { ...req.body };
      if (!requestBody.userId && userContext.actualUserId) {
        requestBody.userId = userContext.actualUserId.toString();
      }
      
      // Security check: Ensure users can only make purchases for themselves 
      // unless they have special permissions
      const requestedUserId = requestBody.userId;
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasAdminPermission = 
        (req.user.permissions && req.user.permissions.includes('manage:payments')) ||
        tokenScopes.includes('manage:payments') ||
        isApiUser;
        
      if (!hasAdminPermission && userContext.actualUserId !== requestedUserId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only purchase tokens for your own account'
        });
      }
      
      await forwardToSubscriptionService(req, res, '/token-packages/buy', requestBody);
    } catch (error) {
      logger.error('Error purchasing token package:', {
        error: error.message,
        stack: error.stack,
        userId: req.body.userId || 'unknown',
        packageId: req.body.packageId
      });
      
      res.status(500).json({
        error: 'Failed to purchase token package',
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

// Process pending cancellations (admin only) 
// // TODO: How is the `admin` permission set and checked?
router.post('/pending-cancellations/process', [verifyAuth0Token, checkPermission(['admin'])], async (req, res) => {
  try {
    // Only admins can process pending cancellations
    const response = await axios.post(`${SUBSCRIPTION_SERVICE_URL}/pending-cancellations/process`, {}, {
      headers: { Authorization: req.headers.authorization }
    });
    
    return res.status(response.status).json(response.data);
  } catch (error) {
    logger.error('Error processing pending cancellations', { error: error.message, stack: error.stack });
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(500).json({ message: 'Failed to process pending cancellations', error: error.message });
  }
});

/**
 * @route POST /api/subscription/plans/add
 * @description Create a new subscription plan
 * @access Protected - requires manage:plans permission (admin only)
 */
// TODO Add only for admins
router.post('/plans/add', 
  verifyAuth0Token,
  checkPermission('/api/subscription/plans'), 
  async (req, res) => {
    try {
      // Only allow admin users to create plans
      const userContext = await extractUserContext(req);
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasAdminPermission = 
        (req.user.permissions && req.user.permissions.includes('manage:plans')) ||
        tokenScopes.includes('manage:plans') ||
        isApiUser;
        
      if (!hasAdminPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only administrators can create subscription plans'
        });
      }
      
      await forwardToSubscriptionService(req, res, '/plans/add');
    } catch (error) {
      logger.error('Error creating subscription plan:', {
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        error: 'Failed to create subscription plan',
        details: error.message
      });
    }
});

/**
 * @route GET /api/subscription/payments/renewal
 * @description Get payments that need to be renewed
 * @access Protected - requires manage:payments permission (administrative)
 */
router.get('/payments/renewal', 
  verifyAuth0Token,
  checkPermission('/api/subscription/payments'), 
  async (req, res) => {
    try {
      // This endpoint is for administrative use only - typically used by batch jobs
      // to get payments that need to be renewed
      const userContext = await extractUserContext(req);
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasManagePermission = 
        (req.user.permissions && req.user.permissions.includes('manage:payments')) ||
        tokenScopes.includes('manage:payments') ||
        isApiUser;
      
      if (!hasManagePermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access payment renewal information'
        });
      }
      
      await forwardToSubscriptionService(req, res, '/payments/renewal', req.body);
    } catch (error) {
      logger.error('Error fetching payments for renewal:', {
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        error: 'Failed to fetch payments for renewal',
        details: error.message
      });
    }
});

/**
 * @route GET /api/subscription/payments/collect
 * @description Get payments that need to be collected
 * @access Protected - requires manage:payments permission (administrative)
 */
router.get('/payments/collect', 
  verifyAuth0Token,
  checkPermission('/api/subscription/payments'), 
  async (req, res) => {
    try {
      // This endpoint is for administrative use only - typically used by batch jobs
      // to get payments that need to be collected
      const userContext = await extractUserContext(req);
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasManagePermission = 
        (req.user.permissions && req.user.permissions.includes('manage:payments')) ||
        tokenScopes.includes('manage:payments') ||
        isApiUser;
      
      if (!hasManagePermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access payment collection information'
        });
      }
      
      await forwardToSubscriptionService(req, res, '/payments/collect', req.query);
    } catch (error) {
      logger.error('Error fetching payments to collect:', {
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        error: 'Failed to fetch payments to collect',
        details: error.message
      });
    }
});

/**
 * @route POST /api/subscription/payments/:paymentId/collect
 * @description Collect a specific payment by ID
 * @access Protected - requires manage:payments permission (administrative)
 */
router.post('/payments/:paymentId/collect', 
  verifyAuth0Token,
  checkPermission('/api/subscription/payments'), 
  async (req, res) => {
    try {
      // This endpoint is for administrative use only - typically used by batch jobs
      // to collect a specific payment
      const userContext = await extractUserContext(req);
      const isApiUser = userContext.isApiUser;
      const tokenScopes = req.user.scope ? req.user.scope.split(' ') : [];
      const hasManagePermission = 
        (req.user.permissions && req.user.permissions.includes('manage:payments')) ||
        tokenScopes.includes('manage:payments') ||
        isApiUser;
      
      if (!hasManagePermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to collect payments'
        });
      }
      
      await forwardToSubscriptionService(req, res, `/payments/${req.params.paymentId}/collect`);
    } catch (error) {
      logger.error('Error collecting payment:', {
        error: error.message,
        stack: error.stack,
        paymentId: req.params.paymentId
      });
      
      res.status(500).json({
        error: 'Failed to collect payment',
        details: error.message
      });
    }
});

module.exports = router; 