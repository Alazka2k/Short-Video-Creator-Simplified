const express = require('express');
const cors = require('cors');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

function createServer(subscriptionService) {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cors());

  // Request logging middleware
  app.use((req, res, next) => {
    logger.info(`Subscription Service: Received ${req.method} request for ${req.url}`);
    logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'Subscription Service is healthy' });
  });

  // Plans endpoints
  app.get('/plans', async (req, res) => {
    try {
      const { billingFrequency, includeInactive } = req.query;
      let plans;
      
      if (billingFrequency) {
        plans = await subscriptionService.getPlansByFrequency(billingFrequency, includeInactive === 'true');
      } else {
        plans = await subscriptionService.getAllPlans(includeInactive === 'true');
      }
      
      res.json(plans);
    } catch (error) {
      logger.error('Error fetching plans:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  app.get('/plans/:planId', async (req, res) => {
    try {
      const { planId } = req.params;
      const plan = await subscriptionService.getPlanById(planId);
      
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }
      
      res.json(plan);
    } catch (error) {
      logger.error('Error fetching plan:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Subscriptions endpoints
  app.get('/subscriptions/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const subscription = await subscriptionService.getUserActiveSubscription(userId);
      
      if (!subscription) {
        return res.status(404).json({ error: 'No active subscription found' });
      }
      
      res.json(subscription);
    } catch (error) {
      logger.error('Error fetching user subscription:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  app.post('/subscriptions', async (req, res) => {
    try {
      const subscriptionData = req.body;
      const newSubscription = await subscriptionService.createSubscription(subscriptionData);
      res.status(201).json({
        success: true,
        data: newSubscription
      });
    } catch (error) {
      logger.error('Error creating subscription:', error);
      
      // Check for specific error types
      if (error.message && error.message.includes('already has an active subscription with this plan')) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate Subscription',
          details: error.message,
          code: 'DUPLICATE_SUBSCRIPTION'
        });
      }
      
      // Check for validation errors
      if (error.message && (
        error.message.includes('is required') ||
        error.message.includes('Invalid') ||
        error.message.includes('must be a valid')
      )) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }
      
      // For all other errors
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        details: error.message
      });
    }
  });

  app.put('/subscriptions/:subscriptionId', async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const subscriptionData = req.body;
      
      // First check if the subscription exists
      const existingSubscription = await subscriptionService.dataAccess.subscriptions.getSubscriptionById(subscriptionId);
      
      if (!existingSubscription) {
        logger.error(`Subscription not found with ID: ${subscriptionId}`);
        return res.status(404).json({ 
          success: false,
          error: 'Subscription not found',
          message: `No subscription exists with ID: ${subscriptionId}`
        });
      }
      
      const updatedSubscription = await subscriptionService.updateSubscription(subscriptionId, subscriptionData);
      
      if (!updatedSubscription) {
        return res.status(500).json({ 
          success: false,
          error: 'Failed to update subscription',
          message: 'An error occurred while updating the subscription' 
        });
      }
      
      res.json({
        success: true,
        data: updatedSubscription
      });
    } catch (error) {
      logger.error('Error updating subscription:', error);
      
      // Handle validation errors specifically 
      if (error.message && (
          error.message.includes('Invalid startDate') ||
          error.message.includes('Invalid endDate') ||
          error.message.includes('Invalid currentPeriodStart') ||
          error.message.includes('Invalid currentPeriodEnd') ||
          error.message.includes('Invalid canceledAt') ||
          error.message.includes('Invalid endedAt')
      )) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid date format',
          message: error.message
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Internal server error', 
        message: error.message 
      });
    }
  });

  app.post('/subscriptions/:subscriptionId/cancel', async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const { reason } = req.body;
      const cancelledSubscription = await subscriptionService.cancelSubscription(subscriptionId, reason);
      
      if (!cancelledSubscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      
      res.json(cancelledSubscription);
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Token packages endpoints
  app.get('/token-packages', async (req, res) => {
    try {
      const { includeInactive } = req.query;
      const packages = await subscriptionService.getAllTokenPackages(includeInactive === 'true');
      res.json(packages);
    } catch (error) {
      logger.error('Error fetching token packages:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  app.get('/token-packages/:packageId', async (req, res) => {
    try {
      const { packageId } = req.params;
      const tokenPackage = await subscriptionService.getTokenPackageById(packageId);
      
      if (!tokenPackage) {
        return res.status(404).json({ error: 'Token package not found' });
      }
      
      res.json(tokenPackage);
    } catch (error) {
      logger.error('Error fetching token package:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Create a new token package
  app.post('/token-packages', async (req, res) => {
    try {
      const packageData = req.body;
      
      // Validate required fields
      if (!packageData.packageName) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          details: 'Package name is required'
        });
      }
      
      if (!packageData.tokenAllocation || typeof packageData.tokenAllocation !== 'number' || packageData.tokenAllocation <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          details: 'Token allocation must be a positive number'
        });
      }
      
      if (!packageData.price || typeof packageData.price !== 'number' || packageData.price < 0) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          details: 'Price must be a non-negative number'
        });
      }
      
      logger.info('Creating new token package:', packageData);
      
      const newPackage = await subscriptionService.dataAccess.tokenPackages.createTokenPackage(packageData);
      
      res.status(201).json({
        success: true,
        data: newPackage
      });
    } catch (error) {
      logger.error('Error creating token package:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      });
    }
  });

  // Tokens and transactions endpoints
  app.get('/tokens/balance/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      logger.info('Handling token balance request for user:', { userId });
      
      const balance = await subscriptionService.getUserTokenBalance(userId);
      
      res.json({
        success: true,
        data: {
          user_id: userId,
          balance: balance.balance,
          last_updated: balance.lastUpdated
        }
      });
    } catch (error) {
      logger.error('Error fetching token balance:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      });
    }
  });

  app.post('/tokens/allocate', async (req, res) => {
    try {
      const { userId, tokenAmount, description, relatedEntityType, relatedEntityId, paymentId } = req.body;
      
      // Validate required fields
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          details: 'userId is required'
        });
      }
      
      if (!tokenAmount || typeof tokenAmount !== 'number' || tokenAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          details: 'tokenAmount must be a positive number'
        });
      }
      
      // Validate entity relationships based on type
      if (!relatedEntityType) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          details: 'relatedEntityType is required'
        });
      }
      
      // For subscription and token_package types, relatedEntityId is required
      if ((relatedEntityType === 'subscription' || relatedEntityType === 'token_package') && !relatedEntityId) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          details: `relatedEntityId is required for ${relatedEntityType} allocations`
        });
      }
      
      // For the 'other' type, relatedEntityId is optional
      if (relatedEntityType !== 'subscription' && 
          relatedEntityType !== 'token_package' && 
          relatedEntityType !== 'other') {
        return res.status(400).json({
          success: false, 
          error: 'Bad Request', 
          details: 'relatedEntityType must be one of: subscription, token_package, other' 
        });
      }
      
      logger.info('Allocating tokens to user:', { 
        userId, 
        tokenAmount, 
        relatedEntityType,
        relatedEntityId: relatedEntityId || 'none',
        description 
      });
      
      // Use the appropriate service method
      let transaction;
      if (relatedEntityType === 'subscription') {
        transaction = await subscriptionService.allocateSubscriptionTokens(
          userId, 
          relatedEntityId, 
          tokenAmount, 
          description
        );
      } else {
        transaction = await subscriptionService.allocateTokens(
          userId,
          tokenAmount,
          relatedEntityType,
          relatedEntityId,
          description,
          paymentId
        );
      }
      
      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Error allocating tokens:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error', 
        details: error.message 
      });
    }
  });

  app.post('/tokens/deduct', async (req, res) => {
    try {
      const { 
        userId, 
        jobId, 
        serviceName, 
        tokenAmount, 
        metadata,
        description,
        relatedEntityType,
        relatedEntityId,
        externalServiceName
      } = req.body;
      
      // Validate required fields
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          details: 'userId is required'
        });
      }
      
      if (!tokenAmount || typeof tokenAmount !== 'number' || tokenAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          details: 'tokenAmount must be a positive number'
        });
      }
      
      logger.info('Deducting tokens from user:', { 
        userId, 
        tokenAmount,
        serviceName: serviceName || 'N/A',
        relatedEntityType: relatedEntityType || 'N/A',
        relatedEntityId: relatedEntityId || 'N/A' 
      });
      
      const transaction = await subscriptionService.recordTokenUsage(
        userId, 
        jobId, 
        serviceName, 
        tokenAmount, 
        metadata || {}, 
        description,
        relatedEntityType,
        relatedEntityId,
        externalServiceName
      );
      
      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Error deducting tokens:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error', 
        details: error.message 
      });
    }
  });

  app.post('/tokens/purchase', async (req, res) => {
    try {
      const { userId, packageId, paymentMethod, paymentDetails } = req.body;
      const result = await subscriptionService.purchaseTokenPackage(userId, packageId, paymentMethod, paymentDetails);
      res.status(201).json(result);
    } catch (error) {
      logger.error('Error purchasing token package:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  app.get('/transactions/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit, offset } = req.query;
      const transactions = await subscriptionService.getUserTokenTransactions(
        userId,
        parseInt(limit) || 100,
        parseInt(offset) || 0
      );
      res.json(transactions);
    } catch (error) {
      logger.error('Error fetching token transactions:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Get token costs for services
  app.get('/token-costs', async (req, res) => {
    try {
      const costs = await subscriptionService.getAllTokenCosts();
      res.json(costs);
    } catch (error) {
      logger.error('Error fetching token costs:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Calculate job token cost
  app.post('/calculate-job-cost', async (req, res) => {
    try {
      const jobData = req.body;
      const cost = await subscriptionService.calculateJobTokenCost(jobData);
      res.json(cost);
    } catch (error) {
      logger.error('Error calculating job token cost:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Payments endpoints
  app.get('/payments/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit, offset } = req.query;
      const payments = await subscriptionService.getUserPayments(
        userId,
        parseInt(limit) || 100,
        parseInt(offset) || 0
      );
      res.json(payments);
    } catch (error) {
      logger.error('Error fetching payments:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  app.get('/payments/summary/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const summary = await subscriptionService.getUserPaymentSummary(userId);
      res.json(summary);
    } catch (error) {
      logger.error('Error fetching payment summary:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Stripe webhook handler
  app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      const event = await subscriptionService.handleStripeWebhook(req.body, signature);
      res.json({ received: true, type: event.type });
    } catch (error) {
      logger.error('Error handling Stripe webhook:', error);
      res.status(400).json({ error: 'Webhook Error', details: error.message });
    }
  });

  // Catch-all route for unhandled requests
  app.use('*', (req, res) => {
    logger.warn(`Subscription Service: Received unhandled request: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist.' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error(`Subscription Service: Unhandled error: ${err.stack}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });

  return app;
}

module.exports = createServer; 