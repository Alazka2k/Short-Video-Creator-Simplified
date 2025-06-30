/**
 * Subscription Controller
 * 
 * This controller handles HTTP requests for subscription-related endpoints:
 * - GET /subscriptions/user/:userId - Get user's subscriptions
 * - GET /subscriptions/user/:userId/active - Get user's active subscription
 * - GET /subscriptions/:subscriptionId - Get subscription by ID
 * - POST /subscriptions - Create a new subscription
 * - PUT /subscriptions/:subscriptionId - Update a subscription
 * - POST /subscriptions/:subscriptionId/cancel - Cancel a subscription
 */

const logger = require('../../../shared/utils/logger');

class SubscriptionController {
  constructor(subscriptionService) {
    this.subscriptionService = subscriptionService;
    this.logger = logger;
    logger.info('SubscriptionController initialized');
  }

  /**
   * Get all subscriptions for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserSubscriptions(req, res) {
    try {
      const { userId } = req.params;
      const { status } = req.query;
      
      this.logger.info('Getting user subscriptions with filters:', { userId, status });
      
      const subscriptions = await this.subscriptionService.getUserSubscriptions(userId, status);
      res.json(subscriptions);
    } catch (error) {
      this.logger.error('Error fetching user subscriptions:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Get active subscription for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserActiveSubscription(req, res) {
    try {
      const { userId } = req.params;
      const subscription = await this.subscriptionService.getUserActiveSubscription(userId);
      
      if (!subscription) {
        return res.status(404).json({ error: 'No active subscription found for this user' });
      }
      
      res.json(subscription);
    } catch (error) {
      this.logger.error('Error fetching user active subscription:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Get subscription by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSubscriptionById(req, res) {
    try {
      const { subscriptionId } = req.params;
      const subscription = await this.subscriptionService.getSubscriptionById(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      
      res.json(subscription);
    } catch (error) {
      this.logger.error('Error fetching subscription by ID:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Create a new subscription
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createSubscription(req, res) {
    try {
      const subscriptionData = req.body;
      
      // Validate required fields
      if (!subscriptionData.userId) {
        return res.status(400).json({ error: 'Bad Request', message: 'userId is required' });
      }
      
      if (!subscriptionData.planId) {
        return res.status(400).json({ error: 'Bad Request', message: 'planId is required' });
      }

      // Log the request with more context
      logger.info('Subscription creation/change request received:', {
        userId: subscriptionData.userId,
        planId: subscriptionData.planId,
        hasPaymentDetails: !!(subscriptionData.paymentProvider && subscriptionData.stripePaymentIntentId)
      });
      
      const newSubscription = await this.subscriptionService.createSubscription(subscriptionData);
      
      // Check if this was a plan change indicated by a message in the response
      if (newSubscription.message && newSubscription.message.includes('scheduled')) {
        // This was a plan change that was scheduled for the end of the billing period
        return res.status(200).json({
          success: true,
          message: newSubscription.message,
          data: newSubscription
        });
      }
      
      // Standard new subscription creation response
      res.status(201).json({
        success: true,
        data: newSubscription
      });
    } catch (error) {
      this.logger.error('Error creating/changing subscription:', error);
      
      // Special error handling for specific cases
      if (error.message.includes('Free tier') && error.message.includes('downgraded')) {
        return res.status(400).json({ 
          error: 'Invalid Operation', 
          message: error.message 
        });
      }
      
      if (error.message.includes('already has an active subscription with this plan')) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Update an existing subscription
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      const subscriptionData = req.body;
      
      const updatedSubscription = await this.subscriptionService.updateSubscription(
        subscriptionId, 
        subscriptionData
      );
      
      if (!updatedSubscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      
      res.json({
        success: true,
        data: updatedSubscription
      });
    } catch (error) {
      this.logger.error('Error updating subscription:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Cancel a subscription
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async cancelSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { reason } = req.body || {};

      logger.info(`Cancel subscription request received for subscription ${subscriptionId}`, { 
        reason 
      });

      // Get the subscription first to check if it's a free tier subscription
      const existingSubscription = await this.subscriptionService.getSubscriptionById(subscriptionId);
      
      if (!existingSubscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      // Check if this is a free tier subscription (plan_id = 1)
      if (existingSubscription.plan_id === 1) {
        logger.warn(`Attempt to cancel free tier subscription rejected: ${subscriptionId}`);
        return res.status(400).json({ 
          error: 'Invalid Operation', 
          message: 'Free tier subscriptions cannot be cancelled' 
        });
      }

      const subscription = await this.subscriptionService.cancelSubscription(subscriptionId, reason);

      return res.status(200).json({
        message: subscription.status === 'pending_cancellation' 
          ? 'Subscription scheduled for cancellation at the end of billing period' 
          : 'Subscription cancelled successfully',
        subscription
      });
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      
      // Special error handling for free tier cancellation attempts that somehow bypassed our check
      if (error.message && error.message.includes('Free tier')) {
        return res.status(400).json({ 
          error: 'Invalid Operation', 
          message: error.message
        });
      }
      
      return res.status(500).json({ message: 'Failed to cancel subscription', error: error.message });
    }
  }

  /**
   * Renew a subscription's token allocation period
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async renewSubscription(req, res) {
    try {
      const { userId } = req.params;
      const { forceRenew } = req.body;
      
      this.logger.info('Renewing subscription period and allocating tokens for user:', { 
        userId, 
        forceRenew: !!forceRenew 
      });
      
      const result = await this.subscriptionService.renewSubscription(userId, !!forceRenew);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      this.logger.error('Error renewing subscription:', error);
      
      if (error.message.includes('not ended yet') || error.message.includes('No active subscription')) {
        return res.status(400).json({ 
          success: false, 
          error: 'Bad Request', 
          message: error.message
        });
      }
      
      res.status(500).json({ 
        success: false, 
        error: 'Internal Server Error', 
        message: error.message 
      });
    }
  }

  /**
   * Process all pending cancellations that have reached their end date
   * Admin-only endpoint, typically called by a scheduled job
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processPendingCancellations(req, res) {
    try {
      logger.info('Process pending cancellations request received');
      
      const results = await this.subscriptionService.processPendingCancellations();
      
      return res.status(200).json({
        message: 'Pending cancellations processed successfully',
        results
      });
    } catch (error) {
      logger.error('Error processing pending cancellations:', error);
      return res.status(500).json({ 
        message: 'Failed to process pending cancellations', 
        error: error.message 
      });
    }
  }

  /**
   * Get subscriptions that are pending cancellation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPendingCancellations(req, res) {
    try {
      const { force } = req.query;
      
      const subscriptions = await this.subscriptionService.getPendingCancellations(force === 'true');
      
      res.json({
        success: true,
        data: subscriptions
      });
    } catch (error) {
      logger.error('Error fetching pending cancellations:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Get subscriptions that need to be renewed
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSubscriptionsToRenew(req, res) {
    try {
      const { force } = req.query;
      
      const subscriptions = await this.subscriptionService.getSubscriptionsToRenew(force === 'true');
      
      res.json({
        success: true,
        data: subscriptions
      });
    } catch (error) {
      logger.error('Error fetching subscriptions to renew:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}

module.exports = SubscriptionController; 