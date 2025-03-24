/**
 * Subscription Routes
 * 
 * Defines routes for subscription-related endpoints:
 * - GET /subscriptions/user/:userId - Get user's subscriptions
 * - GET /subscriptions/user/:userId/active - Get user's active subscription
 * - GET /subscriptions/:subscriptionId - Get subscription by ID
 * - POST /subscriptions - Create a new subscription
 * - PUT /subscriptions/:subscriptionId - Update a subscription
 * - POST /subscriptions/:subscriptionId/cancel - Cancel a subscription
 * - POST /subscriptions/user/:userId/renew - Renew a subscription period and allocate tokens
 */

const express = require('express');
const router = express.Router();

module.exports = (subscriptionController) => {
  /**
   * @route GET /api/subscription/subscriptions/user/:userId
   * @description Get all subscriptions for a user
   * @access Private
   */
  router.get('/user/:userId', subscriptionController.getUserSubscriptions.bind(subscriptionController));

  /**
   * @route GET /api/subscription/subscriptions/user/:userId/active
   * @description Get active subscription for a user
   * @access Private
   */
  router.get('/user/:userId/active', subscriptionController.getUserActiveSubscription.bind(subscriptionController));

  /**
   * @route POST /api/subscription/subscriptions/user/:userId/renew
   * @description Renew a subscription period and allocate tokens
   * @access Private
   */
  router.post('/user/:userId/renew', subscriptionController.renewSubscription.bind(subscriptionController));

  /**
   * @route GET /api/subscription/subscriptions/:subscriptionId
   * @description Get subscription by ID
   * @access Private
   */
  router.get('/:subscriptionId', subscriptionController.getSubscriptionById.bind(subscriptionController));

  /**
   * @route POST /api/subscription/subscriptions
   * @description Create a new subscription
   * @access Private
   */
  router.post('/', subscriptionController.createSubscription.bind(subscriptionController));

  /**
   * @route PUT /api/subscription/subscriptions/:subscriptionId
   * @description Update a subscription
   * @access Private
   */
  router.put('/:subscriptionId', subscriptionController.updateSubscription.bind(subscriptionController));

  /**
   * @route POST /api/subscription/subscriptions/:subscriptionId/cancel
   * @description Cancel a subscription
   * @access Private
   */
  router.post('/:subscriptionId/cancel', subscriptionController.cancelSubscription.bind(subscriptionController));

  return router;
}; 