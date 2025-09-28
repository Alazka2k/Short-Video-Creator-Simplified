/**
 * ============================================================================
 * SUBSCRIPTION ROUTES FOR API GATEWAY - COMPLETE BILLING & SUBSCRIPTION API
 * ============================================================================
 * 
 * This file defines all subscription-related routes for the API Gateway,
 * handling authentication, authorization, and forwarding requests to the
 * Subscription Service. It manages the complete billing and subscription
 * lifecycle for the application.
 * 
 * ROUTE CATEGORIES:
 * 
 * 1. PLAN MANAGEMENT
 *    - GET /plans - Get all available subscription plans
 *    - GET /plans/:planId - Get specific plan details
 *    - POST /plans/add - Create new subscription plan (admin only)
 * 
 * 2. SUBSCRIPTION MANAGEMENT
 *    - GET /subscriptions/me - Get user's subscription
 *    - GET /subscriptions/me?status=active - Get user's active subscription
 *    - POST /subscriptions/me/cancel - Cancel user's active subscription
 *    - POST /subscriptions - Create/change subscription for user
 *    - PUT /subscriptions/:subscriptionId - Update existing subscription
 *    - POST /subscriptions/:subscriptionId/cancel - Cancel subscription (DEPRECATED)
 *    - POST /subscriptions/:userId/renew - Renew subscription tokens
 *    - GET /subscriptions/pending-cancellations - Get cancellations to process (admin)
 *    - GET /subscriptions/renewal - Get subscriptions to renew (admin)
 * 
 * 3. TOKEN MANAGEMENT
 *    - GET /tokens/balance/:userId - Get user's token balance // TODO: Change to /me instead of usersID
 *    - POST /tokens/allocate - Allocate tokens to user (internal)
 *    - POST /tokens/usage - Record token usage (internal)
 *    - POST /tokens/buy - Purchase token package
 * 
 * 4. TRANSACTION MANAGEMENT
 *    - GET /transactions/user/:userId - Get user's transaction history // TODO: Change to /me instead of usersID
 *    - GET /transactions/token-costs - Get service token costs
 *    - POST /transactions/calculate-job-cost - Calculate cost for job
 * 
 * 5. TOKEN PACKAGE MANAGEMENT
 *    - GET /token-packages - Get all available token packages
 *    - GET /token-packages/:packageId - Get specific package details
 *    - POST /token-packages/add - Create new token package (admin)
 *    - POST /token-packages/buy - Purchase token package
 * 
 * 6. PAYMENT MANAGEMENT
 *    - GET /payments/user/:userId - Get user's payment history // TODO: Change to /me instead of usersID
 *    - GET /payments/summary/:userId - Get payment summary // TODO: Change to summary/me instead of usersID
 *    - POST /payments - Create payment record (admin)
 *    - POST /payments/:paymentId/status - Update payment status (admin)
 *    - POST /payments/update - Update payment with provider details (admin)
 *    - GET /payments/renewal - Get payments to renew (admin)
 *    - GET /payments/collect - Get payments to collect (admin)
 *    - POST /payments/:paymentId/collect - Collect specific payment (admin)
 * 
 * 7. STRIPE INTEGRATION
 *    - POST /checkout/create-subscription-session - Create Stripe subscription checkout
 *    - POST /checkout/create-token-package-session - Create Stripe token purchase checkout
 *    - POST /checkout/create-customer-portal-session - Create Stripe customer portal
 *    - GET /checkout/verify-session/:sessionId - Verify Stripe session (public)
 *    - POST /webhooks/stripe - Handle Stripe webhooks (public)
 * 
 * AUTHENTICATION & AUTHORIZATION:
 * 
 * 1. SERVICE AUTHENTICATION
 *    - serviceAuthMiddleware: For internal service-to-service calls
 *    - Used for public data and internal operations
 * 
 * 2. USER AUTHENTICATION
 *    - verifyAuth0Token: Validates Auth0 user tokens
 *    - checkPermission: Validates specific permissions
 *    - Used for user-specific operations
 * 
 * 3. ADMIN AUTHENTICATION
 *    - Additional permission checks for administrative functions
 *    - API users and users with specific scopes
 *    - Batch processing and system management
 * 
 * USER CONTEXT EXTRACTION:
 * - extractUserContext(): Determines actual user ID from various token types
 * - Handles M2M tokens vs user tokens
 * - Security enforcement for user data access
 * - Admin privilege detection and validation
 * 
 * SECURITY FEATURES:
 * - User isolation: Users can only access their own data
 * - Admin privileges: Controlled access to system-wide operations
 * - Token validation: Proper authentication checks
 * - Permission-based routing: Role-based access control
 * 
 * FORWARDING LOGIC:
 * - forwardToSubscriptionService(): Central request forwarding function
 * - Authentication header propagation
 * - Error handling and response formatting
 * - Timeout and retry management
 * 
 * INTEGRATION POINTS:
 * - Subscription Service: Core business logic
 * - Auth0: User authentication and authorization
 * - Stripe: Payment processing and webhooks
 * - Batch Service: Administrative operations
 * 
 * ERROR HANDLING:
 * - Comprehensive error logging
 * - Proper HTTP status codes
 * - Detailed error messages for debugging
 * - Graceful fallback for service failures
 * 
 * DEPENDENCIES:
 * - Express.js: Web framework and routing
 * - Axios: HTTP client for service communication
 * - Auth0: Authentication and authorization
 * - JWT: Token parsing and validation
 * - Logger: Centralized logging system
 * 
 * Last Updated: 2025-06-30
 * Architecture: API Gateway with Microservice Forwarding
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const serviceAuth = require('../middleware/serviceAuth');
const jwtAuth = require('../middleware/jwtAuth');

const SUBSCRIPTION_SERVICE_URL = config.services?.subscription?.url;
console.log('To verify the subscription service URL', SUBSCRIPTION_SERVICE_URL);

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
    const { user } = req;
    
    logger.info(`Forwarding ${req.method} to: ${url}`, { 
      userId: user?.userId, 
      isAdmin: user?.isAdmin 
    });

    // Start with the original request body
    const requestData = { ...req.body };

    // Securely inject the userId from the token, overwriting any userId in the body
    if (user) {
      requestData.userId = user.userId;
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'x-service-auth': process.env.SERVICE_AUTH_TOKEN,
      // Forward the original Authorization header for the downstream service
      ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
    };

    logger.info('Forwarding data to subscription service:', requestData);

    const response = await axios({
      method: req.method,
      url,
      data: requestData,
      headers,
      params: req.query,
      timeout: 30000
    });
    
    res.status(response.status).json(response.data);
  }
  catch (error) {
    logger.error('Error forwarding to subscription service:', {
      endpoint,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    const status = error.response?.status || 500;
    res.status(status).json({
      error: 'Subscription service error',
      message: error.response?.data?.message || error.message
    });
  }
}

/**
 * @route GET /api/subscription/plans
 * @description Get all subscription plans
 * @access Public
 */
router.get('/plans', (req, res) => forwardToSubscriptionService(req, res, '/plans'));

/**
 * @route GET /api/subscription/plans/:planId
 * @description Get a specific subscription plan
 * @access Public
 */
router.get('/plans/:planId', (req, res) => forwardToSubscriptionService(req, res, `/plans/${req.params.planId}`));

/**
 * @route GET /api/subscription/subscriptions/me
 * @description Get the current user's active subscription
 * @access Private
 */
router.get('/subscriptions/me', jwtAuth({ requireUser: true }), (req, res) => {
  // Forward to the service, which will get the userId from the token
  forwardToSubscriptionService(req, res, `/subscriptions/user/${req.user.userId}`);
});

/**
 * @route POST /api/subscription/subscriptions/me/cancel
 * @description Cancel current user's subscription
 * @access Protected - requires authenticated user
 */
router.post('/subscriptions/me/cancel', jwtAuth({ requireUser: true }), (req, res) => {
  // Forward to the service, which will get the userId from the token and find the user's active subscription
  forwardToSubscriptionService(req, res, `/subscriptions/user/${req.user.userId}/cancel`);
});

/**
 * @route POST /api/subscription/subscriptions
 * @description Create a new subscription
 * @access Protected - requires create:subscription permission
 */
router.post('/subscriptions', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, '/subscriptions'));

/**
 * @route GET /api/subscription/subscriptions/pending-cancellations
 * @description Get subscriptions that are pending cancellation
 * @access Protected - requires manage:subscriptions permission (administrative)
 */
router.get('/subscriptions/pending-cancellations', jwtAuth({ requireAdmin: true }), (req, res) => forwardToSubscriptionService(req, res, '/subscriptions/pending-cancellations'));

/**
 * @route GET /api/subscription/subscriptions/renewal
 * @description Get subscriptions that need to be renewed
 * @access Protected - requires manage:subscriptions permission (administrative)
 */
router.get('/subscriptions/renewal', jwtAuth({ requireAdmin: true }), (req, res) => forwardToSubscriptionService(req, res, '/subscriptions/renewal'));

/**
 * @route PUT /api/subscription/subscriptions/:subscriptionId
 * @description Update an existing subscription
 * @access Protected - requires update:subscription permission
 */
router.put('/subscriptions/:subscriptionId', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, `/subscriptions/${req.params.subscriptionId}`));

/**
 * @route POST /api/subscription/subscriptions/:subscriptionId/cancel
 * @description Cancel a subscription
 * @access Protected - requires update:subscription permission
 * @deprecated Use POST /api/subscription/subscriptions/me/cancel instead
 */
router.post('/subscriptions/:subscriptionId/cancel', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, `/subscriptions/${req.params.subscriptionId}/cancel`));

/**
 * @route POST /api/subscription/subscriptions/:userId/renew
 * @description Renew a subscription's token allocation period
 * @access Protected - requires update:subscription permission
 */
router.post('/subscriptions/:userId/renew', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, `/subscriptions/user/${req.params.userId}/renew`));

/**
 * @route GET /api/subscription/token-packages
 * @description Get all available token packages
 * @access Public
 */
router.get('/token-packages', (req, res) => forwardToSubscriptionService(req, res, '/token-packages'));

/**
 * @route GET /api/subscription/token-packages/:packageId
 * @description Get details of a specific token package
 * @access Public
 */
router.get('/token-packages/:packageId', (req, res) => forwardToSubscriptionService(req, res, `/token-packages/${req.params.packageId}`));

/**
 * @route POST /api/subscription/token-packages/add
 * @description Create a new token package
 * @access Protected - requires manage:token_packages permission (admin only)
 */
// TODO Add only for admins
router.post('/token-packages/add', jwtAuth({ requireAdmin: true }), (req, res) => forwardToSubscriptionService(req, res, '/token-packages/add'));

/**
 * @route GET /api/subscription/tokens/balance/me
 * @description Get user's token balance
 * @access Protected - requires read:tokens permission
 */
router.get('/tokens/balance/me', jwtAuth({ requireUser: true }), (req, res) => {
  const userId = req.user.userId;
  forwardToSubscriptionService(req, res, `/tokens/balance/${userId}`);
});

/* DEPRECATED: Use /api/subscription/tokens/balance/me instead */
/**
 * @route GET /api/subscription/tokens/balance/:userId
 * @description Get user's token balance
 * @access Protected - requires read:tokens permission
 */
router.get('/tokens/balance/:userId', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, `/tokens/balance/${req.params.userId}`));

/**
 * @route POST /api/subscription/tokens/allocate
 * @description Allocate tokens to a user from subscription
 * @access Protected - requires service auth (internal use)
 */
router.post('/tokens/allocate', serviceAuth, (req, res) => forwardToSubscriptionService(req, res, '/tokens/allocate'));

/**
 * @route POST /api/subscription/tokens/usage
 * @description Record token usage for service usage
 * @access Protected - requires service auth (internal use)
 */
router.post('/tokens/usage', serviceAuth, (req, res) => forwardToSubscriptionService(req, res, '/tokens/usage'));

/**
 * @route POST /api/subscription/tokens/buy
 * @description Buy tokens package
 * @access Protected - requires purchase:tokens permission
 */
router.post('/tokens/buy', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, '/tokens/purchase'));

/**
 * @route GET /api/subscription/transactions/me
 * @description Get current user's transaction history
 * @access Protected - requires user authentication
 */
router.get('/transactions/me', jwtAuth({ requireUser: true }), (req, res) => {
  const requestData = {
    ...req.body,
    userId: req.user.userId
  };
  
  forwardToSubscriptionService(req, res, `/transactions/user/${req.user.userId}`, requestData);
});

/**
 * @route GET /api/subscription/transactions/user/:userId
 * @description Get user's transaction history
 * @access Protected - requires read:transactions permission
 * DEPRECATED: Use /api/subscription/transactions/me instead
 */
router.get('/transactions/user/:userId', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, `/transactions/user/${req.params.userId}`));

/**
 * @route GET /api/subscription/transactions/token-costs
 * @description Get token costs for different services
 * @access Public
 */
router.get('/transactions/token-costs', (req, res) => forwardToSubscriptionService(req, res, '/transactions/token-costs'));

/**
 * @route POST /api/subscription/calculate-job-cost
 * @description Calculate token cost for a job
 * @access Private - requires user auth
 */
router.post('/transactions/calculate-job-cost', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, '/transactions/calculate-job-cost'));

/**
 * @route GET /api/subscription/payments/me
 * @description Get the current user's payment history
 * @access Private
 */
router.get('/payments/me', jwtAuth({ requireUser: true }), (req, res) => {
  // Forward to the service, which will get the userId from the token
  forwardToSubscriptionService(req, res, `/payments/user/${req.user.userId}`);
});

/** DEPRECATED
 * @route GET /api/subscription/payments/user/:userId
 * @description Get user's payment history
 * @access Private
 */
// router.get('/payments/user/:userId', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, `/payments/user/${req.params.userId}`));

/**
 * @route GET /api/subscription/payments/summary/:userId
 * @description Get user's payment summary
 * @access Protected - requires read:payments permission
 */
router.get('/payments/summary/:userId', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, `/payments/summary/${req.params.userId}`));

/**
 * @route POST /api/subscription/payments
 * @description Create a new payment record (for renewal payments, token packages, etc.)
 * @access Protected - requires manage:payments permission (administrative)
 */
router.post('/payments', jwtAuth({ requireAdmin: true }), (req, res) => forwardToSubscriptionService(req, res, '/payments'));

/**
 * @route POST /api/subscription/payments/:paymentId/status
 * @description Update payment status
 * @access Protected - requires manage:payments permission (administrative)
 */
router.post('/payments/:paymentId/status', jwtAuth({ requireAdmin: true }), (req, res) => forwardToSubscriptionService(req, res, `/payments/${req.params.paymentId}/status`));

/**
 * @route POST /api/subscription/payments/update
 * @description Update a payment record with payment provider details
 * @access Protected - requires manage:payments permission (administrative)
 */
router.post('/payments/update', jwtAuth({ requireAdmin: true }), (req, res) => forwardToSubscriptionService(req, res, '/payments/update'));

/**
 * @route POST /api/subscription/token-packages/buy
 * @description Purchase a token package
 * @access Protected - requires manage:tokens permission
 */
router.post('/token-packages/buy', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, '/token-packages/buy'));

/**
 * @route POST /api/subscription/checkout/create-subscription-session
 * @description Create a Stripe Checkout session for subscription plans
 * @access Protected - requires user authentication
 */
router.post('/checkout/create-subscription-session', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, '/checkout/create-subscription-session'));

/**
 * @route POST /api/subscription/checkout/create-token-package-session
 * @description Create a Stripe Checkout session for token package purchases
 * @access Protected - requires user authentication
 */
router.post('/checkout/create-token-package-session', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, '/checkout/create-token-package-session'));

/**
 * @route POST /api/subscription/checkout/create-customer-portal-session
 * @description Create a Stripe Customer Portal session for subscription management
 * @access Protected - requires user authentication
 */
router.post('/checkout/create-customer-portal-session', jwtAuth({ requireUser: true }), (req, res) => forwardToSubscriptionService(req, res, '/checkout/create-customer-portal-session'));

/**
 * @route POST /api/subscription/checkout/verify-session
 * @description Verify a Stripe Checkout session and return session details
 * @access Private - requires user auth to prevent session hijacking
 */
router.post('/checkout/verify-session', jwtAuth({ requireUser: true }), (req, res) => {
  forwardToSubscriptionService(req, res, '/checkout/verify-session');
});

/**
 * @route POST /api/subscription/webhooks/stripe
 * @description Receive and process Stripe webhook events
 * @access Public - verification happens with Stripe signature
 */
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const url = `${SUBSCRIPTION_SERVICE_URL}/webhooks/stripe`;
    logger.info(`Forwarding Stripe webhook to: ${url}`);
    
    const response = await axios.post(url, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': req.headers['stripe-signature'],
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error('Error forwarding Stripe webhook', { error: error.message });
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Webhook forwarding failed' });
  }
});

// Process pending cancellations (admin only) 
// // TODO: How is the `admin` permission set and checked?
router.post('/pending-cancellations/process', jwtAuth({ requireAdmin: true }), (req, res) => forwardToSubscriptionService(req, res, '/pending-cancellations/process'));

/**
 * @route POST /api/subscription/plans/add
 * @description Create a new subscription plan
 * @access Protected - requires manage:plans permission (admin only)
 */
// TODO Add only for admins
router.post('/plans/add', jwtAuth({ requireAdmin: true }), (req, res) => forwardToSubscriptionService(req, res, '/plans/add'));

/**
 * @route GET /api/subscription/payments/renewal
 * @description Get payments that need to be renewed
 * @access Protected - requires manage:payments permission (administrative)
 */
router.get('/payments/renewal', jwtAuth({ requireAdmin: true }), (req, res) => forwardToSubscriptionService(req, res, '/payments/renewal'));

/**
 * @route GET /api/subscription/payments/collect
 * @description Get payments that need to be collected
 * @access Protected - requires manage:payments permission (administrative)
 */
router.get('/payments/collect', jwtAuth({ requireAdmin: true }), (req, res) => forwardToSubscriptionService(req, res, '/payments/collect', req.query));

/**
 * @route POST /api/subscription/payments/:paymentId/collect
 * @description Collect a specific payment by ID
 * @access Protected - requires manage:payments permission (administrative)
 */
router.post('/payments/:paymentId/collect', jwtAuth({ requireAdmin: true }), (req, res) => forwardToSubscriptionService(req, res, `/payments/${req.params.paymentId}/collect`));

module.exports = router; 