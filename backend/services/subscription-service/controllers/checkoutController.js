/**
 * Checkout Controller
 * 
 * Handles Stripe Checkout session creation for subscriptions and token package purchases.
 * This controller manages the integration between our subscription system and Stripe Checkout.
 */

const logger = require('../../../shared/utils/logger');
const stripeService = require('../utils/stripeService');
const subscriptionsDataAccess = require('../data/subscriptionsDataAccess');
const plansDataAccess = require('../data/plansDataAccess');
const tokenPackagesDataAccess = require('../data/tokenPackagesDataAccess');
const userDataAccess = require('../data/userDataAccess');

class CheckoutController {
  /**
   * Create a Stripe Checkout session for subscription plans
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createSubscriptionCheckout(req, res) {
    try {
      const { planId, successUrl, cancelUrl, userId } = req.body;
      
      logger.info('Creating subscription checkout session:', { userId, planId });
      
      // Validate required fields
      if (!userId || !planId || !successUrl || !cancelUrl) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'userId, planId, successUrl, and cancelUrl are required'
        });
      }
      
      // Get plan details with Stripe price ID
      const plan = await plansDataAccess.getPlanById(planId);
      if (!plan) {
        return res.status(404).json({
          error: 'Plan not found',
          message: `Plan with ID ${planId} does not exist`
        });
      }
      
      if (!plan.stripe_price_id) {
        return res.status(400).json({
          error: 'Plan not configured for Stripe',
          message: `Plan ${planId} does not have a Stripe price ID configured`
        });
      }
      
      // Get user details
      const user = await userDataAccess.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: `User with ID ${userId} does not exist`
        });
      }
      
      // Check if user already has an active subscription with the same plan
      const existingSubscription = await subscriptionsDataAccess.getUserActiveSubscription(userId);
      if (existingSubscription && existingSubscription.plan_id === parseInt(planId)) {
        return res.status(400).json({
          error: 'Duplicate subscription not allowed',
          message: `User already has an active subscription for plan ${planId}. Please cancel the existing subscription before purchasing a new one.`,
          details: {
            currentPlan: existingSubscription.plan_id,
            requestedPlan: parseInt(planId),
            subscriptionId: existingSubscription.subscription_id
          }
        });
      }
      
      // Create or get Stripe customer
      let stripeCustomerId = user.stripe_customer_id;
      if (!stripeCustomerId) {
        const customer = await stripeService.createOrUpdateCustomer(
          userId, 
          user.email, 
          user.name || user.email
        );
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await userDataAccess.updateUser(userId, { stripe_customer_id: stripeCustomerId });
        logger.info(`Created Stripe customer ${stripeCustomerId} for user ${userId}`);
      }
      
      // Create Stripe Checkout session
      const session = await stripeService.createCheckoutSession({
        customerId: stripeCustomerId,
        priceId: plan.stripe_price_id,
        successUrl,
        cancelUrl,
        mode: 'subscription',
        userId,
        planId,
        metadata: {
          planName: plan.name,
          billingFrequency: plan.billing_frequency
        }
      });
      
      logger.info(`Checkout session created: ${session.id} for user ${userId}, plan ${planId}`);
      
      res.json({
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url,
        customerId: stripeCustomerId
      });
      
    } catch (error) {
      logger.error('Error creating subscription checkout session:', {
        error: error.message,
        stack: error.stack,
        userId: req.body.userId,
        planId: req.body.planId
      });
      
      res.status(500).json({
        error: 'Failed to create checkout session',
        message: error.message
      });
    }
  }
  
  /**
   * Create a Stripe Checkout session for token package purchases
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createTokenPackageCheckout(req, res) {
    try {
      const { packageId, successUrl, cancelUrl, userId } = req.body;
      
      logger.info('Creating token package checkout session:', { userId, packageId });
      
      // Validate required fields
      if (!userId || !packageId || !successUrl || !cancelUrl) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'userId, packageId, successUrl, and cancelUrl are required'
        });
      }
      
      // Get token package details with Stripe price ID
      const tokenPackage = await tokenPackagesDataAccess.getTokenPackageById(packageId);
      if (!tokenPackage) {
        return res.status(404).json({
          error: 'Token package not found',
          message: `Token package with ID ${packageId} does not exist`
        });
      }
      
      if (!tokenPackage.stripe_price_id) {
        return res.status(400).json({
          error: 'Token package not configured for Stripe',
          message: `Token package ${packageId} does not have a Stripe price ID configured`
        });
      }
      
      // Get user details
      const user = await userDataAccess.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: `User with ID ${userId} does not exist`
        });
      }
      
      // Create or get Stripe customer
      let stripeCustomerId = user.stripe_customer_id;
      if (!stripeCustomerId) {
        const customer = await stripeService.createOrUpdateCustomer(
          userId, 
          user.email, 
          user.name || user.email
        );
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await userDataAccess.updateUser(userId, { stripe_customer_id: stripeCustomerId });
        logger.info(`Created Stripe customer ${stripeCustomerId} for user ${userId}`);
      }
      
      // Create Stripe Checkout session for one-time payment
      const session = await stripeService.createCheckoutSession({
        customerId: stripeCustomerId,
        priceId: tokenPackage.stripe_price_id,
        successUrl,
        cancelUrl,
        mode: 'payment', // One-time payment for token packages
        userId,
        packageId,
        metadata: {
          packageName: tokenPackage.name,
          tokenAmount: tokenPackage.token_amount
        }
      });
      
      logger.info(`Token package checkout session created: ${session.id} for user ${userId}, package ${packageId}`);
      
      res.json({
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url,
        customerId: stripeCustomerId
      });
      
    } catch (error) {
      logger.error('Error creating token package checkout session:', {
        error: error.message,
        stack: error.stack,
        userId: req.body.userId,
        packageId: req.body.packageId
      });
      
      res.status(500).json({
        error: 'Failed to create token package checkout session',
        message: error.message
      });
    }
  }
  
  /**
   * Create a Stripe Customer Portal session for subscription management
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createCustomerPortalSession(req, res) {
    try {
      const { returnUrl, userId } = req.body;
      
      logger.info('Creating customer portal session:', { userId });
      
      // Validate required fields
      if (!userId || !returnUrl) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'userId and returnUrl are required'
        });
      }
      
      // Get user details
      const user = await userDataAccess.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: `User with ID ${userId} does not exist`
        });
      }
      
      if (!user.stripe_customer_id) {
        return res.status(400).json({
          error: 'User is not a Stripe customer',
          message: `User ${userId} does not have a Stripe customer ID`
        });
      }
      
      const session = await stripeService.createCustomerPortalSession(
        user.stripe_customer_id,
        returnUrl
      );
      
      res.json({
        success: true,
        sessionId: session.id,
        portalUrl: session.url
      });
      
    } catch (error) {
      logger.error('Error creating customer portal session:', {
        error: error.message,
        stack: error.stack,
        userId: req.body.userId
      });
      
      res.status(500).json({
        error: 'Failed to create customer portal session',
        message: error.message
      });
    }
  }
  
  /**
   * Verify a Stripe Checkout session after successful payment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyCheckoutSession(req, res) {
    try {
      const { sessionId } = req.body;
      const { userId } = req.body; // Injected by API Gateway's jwtAuth middleware
      
      logger.info('Verifying checkout session:', { userId, sessionId });
      
      if (!sessionId || !userId) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'sessionId and userId are required'
        });
      }
      
      const session = await stripeService.verifyCheckoutSession(sessionId);
      
      // Security check: Verify the session belongs to the authenticated user
      const sessionUserId = session.metadata?.userId?.toString();
      if (sessionUserId !== userId.toString()) {
        logger.warn('Session userId mismatch', { sessionUserId, requestUserId: userId });
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Checkout session does not belong to the authenticated user'
        });
      }
      
      // Determine purchase type and format a clean response for the frontend
      let purchaseDetails = {};
      const amountPaid = session.amount_total ? `€${(session.amount_total / 100).toFixed(2)}` : 'N/A';

      if (session.mode === 'payment' && session.metadata.packageId) {
        // It's a token package purchase
        const tokenPackage = await tokenPackagesDataAccess.getTokenPackageById(session.metadata.packageId);
        purchaseDetails = {
          type: 'TOKEN_PACKAGE_PURCHASE',
          itemName: tokenPackage?.package_name || 'Token Package',
          amountPaid,
          billingInfo: 'One-time purchase'
        };
      } else if (session.mode === 'subscription' && session.metadata.planId) {
        // It's a subscription purchase. Determine if it was a new sub or an upgrade.
        const plan = await plansDataAccess.getPlanById(session.metadata.planId);
        // A simple heuristic: if the user had a previous subscription, it was likely an upgrade.
        // A more robust check might involve looking at the number of user subscriptions.
        const userSubscriptions = await subscriptionsDataAccess.getUserSubscriptions(userId);
        const purchaseType = userSubscriptions.length > 1 ? 'SUBSCRIPTION_UPGRADE' : 'NEW_SUBSCRIPTION';

        purchaseDetails = {
          type: purchaseType,
          itemName: plan?.plan_name || 'Subscription Plan',
          amountPaid,
          billingInfo: plan?.billing_frequency ? `Billed ${plan.billing_frequency}` : 'Recurring billing'
        };
      } else {
        logger.warn('Could not determine purchase type from session', { sessionId });
        return res.status(400).json({ error: 'Invalid session type' });
      }
      
      res.json({
        success: true,
        purchaseDetails
      });
      
    } catch (error) {
      logger.error('Error verifying checkout session:', {
        error: error.message,
        stack: error.stack,
        userId: req.body.userId,
        sessionId: req.body.sessionId
      });
      
      res.status(500).json({
        error: 'Failed to verify checkout session',
        message: error.message
      });
    }
  }
}

module.exports = new CheckoutController(); 