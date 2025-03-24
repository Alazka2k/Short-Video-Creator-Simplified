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
      // Extract reason from request body, checking both possible field names
      const reason = req.body.reason || req.body.cancellationReason || '';
      
      // Validation and logging
      if (!subscriptionId) {
        return res.status(400).json({ 
          success: false,
          error: 'Bad Request', 
          message: 'Subscription ID is required' 
        });
      }
      
      this.logger.info('Processing subscription cancellation request:', {
        subscriptionId,
        reason: reason || 'No reason provided',
        requestBody: req.body // Log the full request body for debugging
      });
      
      // First, check if this is a free plan that shouldn't be cancelled
      const subscription = await this.subscriptionService.getSubscriptionById(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ 
          success: false,
          error: 'Not Found', 
          message: 'Subscription not found'
        });
      }
      
      // Check if this is a free tier (plan_id 1) and block cancellation
      if (subscription.plan_id === 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Operation',
          message: 'Free tier plans cannot be cancelled. You can upgrade to a paid plan instead.'
        });
      }
      
      // Proceed with cancellation for paid plans
      const cancelledSubscription = await this.subscriptionService.cancelSubscription(
        subscriptionId, 
        reason
      );
      
      // Verify cancellation reason was saved
      this.logger.info('Subscription cancelled successfully with details:', {
        subscriptionId,
        savedReason: cancelledSubscription.cancellation_reason,
        endDate: cancelledSubscription.end_date
      });
      
      const endDateMessage = cancelledSubscription.end_date 
        ? `Access will remain until ${new Date(cancelledSubscription.end_date).toISOString().split('T')[0]}.`
        : 'Access has been revoked.';
        
      res.json({
        success: true,
        data: cancelledSubscription,
        message: `Subscription cancelled successfully. ${endDateMessage}`
      });
    } catch (error) {
      this.logger.error('Error cancelling subscription:', error);
      
      // Specific error handling with user-friendly messages
      if (error.message && (
          error.message.includes('No payment with billing period end found') ||
          error.message.includes('payments')
      )) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot Cancel Subscription', 
          message: 'Problem determining subscription end date: ' + error.message,
          details: 'A payment-related issue prevented the cancellation. Please contact support.'
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
}

module.exports = SubscriptionController; 