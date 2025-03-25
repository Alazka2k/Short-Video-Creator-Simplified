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
      const newSubscription = await this.subscriptionService.createSubscription(subscriptionData);
      
      res.status(201).json({
        success: true,
        data: newSubscription
      });
    } catch (error) {
      this.logger.error('Error creating subscription:', error);
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

      const subscription = await this.subscriptionService.cancelSubscription(subscriptionId, reason);
      
      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }

      return res.status(200).json({
        message: subscription.status === 'pending_cancellation' 
          ? 'Subscription scheduled for cancellation at the end of billing period' 
          : 'Subscription cancelled successfully',
        subscription
      });
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
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
   * Upgrade a subscription to a higher-tier plan
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async upgradeSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { newPlanId, paymentProvider, externalPaymentId, externalSubscriptionId } = req.body;

      if (!newPlanId) {
        return res.status(400).json({ message: 'New plan ID is required' });
      }

      logger.info(`Subscription upgrade request received`, {
        subscriptionId,
        newPlanId,
        paymentProvider,
        hasExternalPaymentId: !!externalPaymentId,
        hasExternalSubscriptionId: !!externalSubscriptionId
      });

      const options = {
        paymentProvider,
        externalPaymentId,
        externalSubscriptionId
      };

      const newSubscription = await this.subscriptionService.upgradeSubscription(
        subscriptionId,
        newPlanId, 
        options
      );

      return res.status(200).json({
        message: 'Subscription upgraded successfully',
        subscription: newSubscription
      });
    } catch (error) {
      logger.error('Error upgrading subscription:', error);
      return res.status(500).json({ message: 'Failed to upgrade subscription', error: error.message });
    }
  }

  /**
   * Downgrade a subscription to a lower-tier plan
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async downgradeSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { newPlanId } = req.body;

      if (!newPlanId) {
        return res.status(400).json({ message: 'New plan ID is required' });
      }

      logger.info(`Subscription downgrade request received`, {
        subscriptionId,
        newPlanId
      });

      const updatedSubscription = await this.subscriptionService.downgradeSubscription(
        subscriptionId,
        newPlanId
      );

      return res.status(200).json({
        message: 'Subscription scheduled for downgrade at the end of billing period',
        subscription: updatedSubscription
      });
    } catch (error) {
      logger.error('Error downgrading subscription:', error);
      return res.status(500).json({ message: 'Failed to downgrade subscription', error: error.message });
    }
  }

  /**
   * Cancel a paid plan and downgrade to free tier
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async cancelPaidPlan(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { reason } = req.body || {};

      logger.info(`Cancel paid plan request received`, {
        subscriptionId,
        reason
      });

      const updatedSubscription = await this.subscriptionService.cancelPaidPlan(subscriptionId, reason);

      return res.status(200).json({
        message: 'Paid plan scheduled for cancellation at the end of billing period',
        subscription: updatedSubscription
      });
    } catch (error) {
      logger.error('Error cancelling paid plan:', error);
      return res.status(500).json({ message: 'Failed to cancel paid plan', error: error.message });
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
}

module.exports = SubscriptionController; 