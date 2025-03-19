const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const planDataAccess = require('./data/plansDataAccess');
const subscriptionDataAccess = require('./data/subscriptionsDataAccess');
const tokenPackageDataAccess = require('./data/tokenPackagesDataAccess');
const tokenTransactionDataAccess = require('./data/tokenTransactionsDataAccess');
const paymentDataAccess = require('./data/paymentsDataAccess');
const stripeService = require('./utils/stripeService');
const tokenCalculator = require('./utils/tokenCalculator');

class SubscriptionServiceInterface {
  constructor() {
    this.dataAccess = {
      plans: planDataAccess,
      subscriptions: subscriptionDataAccess,
      tokenPackages: tokenPackageDataAccess,
      tokenTransactions: tokenTransactionDataAccess,
      payments: paymentDataAccess
    };
    this.tokenCalculator = tokenCalculator;
  }

  async initialize() {
    logger.info('Initializing Subscription Service...');

    try {
      // Initialize Stripe service
      await stripeService.initialize();
      this.stripeService = stripeService;

      logger.info('Subscription Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Subscription Service:', error);
      throw error;
    }
  }

  /**
   * Plans API Methods
   */
  async getAllPlans(includeInactive = false) {
    try {
      return await this.dataAccess.plans.getAllPlans(includeInactive);
    } catch (error) {
      logger.error('Error in getAllPlans:', error);
      throw error;
    }
  }

  async getPlansByFrequency(billingFrequency, includeInactive = false) {
    try {
      return await this.dataAccess.plans.getPlansByFrequency(billingFrequency, includeInactive);
    } catch (error) {
      logger.error('Error in getPlansByFrequency:', error);
      throw error;
    }
  }

  async getPlanById(planId) {
    try {
      return await this.dataAccess.plans.getPlanById(planId);
    } catch (error) {
      logger.error('Error in getPlanById:', error);
      throw error;
    }
  }

  /**
   * Subscriptions API Methods
   */
  async getUserActiveSubscription(userId) {
    try {
      return await this.dataAccess.subscriptions.getUserActiveSubscription(userId);
    } catch (error) {
      logger.error('Error in getUserActiveSubscription:', error);
      throw error;
    }
  }

  async getUserSubscriptions(userId) {
    try {
      return await this.dataAccess.subscriptions.getUserSubscriptions(userId);
    } catch (error) {
      logger.error('Error in getUserSubscriptions:', error);
      throw error;
    }
  }

  async getSubscriptionById(subscriptionId) {
    try {
      return await this.dataAccess.subscriptions.getSubscriptionById(subscriptionId);
    } catch (error) {
      logger.error('Error in getSubscriptionById:', error);
      throw error;
    }
  }

  async createSubscription(subscriptionData) {
    try {
      // Create the subscription in the database
      const subscription = await this.dataAccess.subscriptions.createSubscription(subscriptionData);
      
      // Create a payment record if this is a paid subscription
      if (subscriptionData.payment_provider && subscriptionData.external_payment_id) {
        await this.dataAccess.payments.createSubscriptionPayment(
          subscriptionData.user_id,
          subscription.subscription_id,
          subscription.plan_id,
          subscriptionData.amount || 0,
          subscriptionData.payment_provider,
          subscriptionData.external_payment_id,
          'subscription_initial',
          {
            startDate: subscription.start_date,
            endDate: subscription.end_date
          }
        );
      }
      
      // Allocate tokens for the subscription
      const plan = await this.dataAccess.plans.getPlanById(subscription.plan_id);
      if (plan && plan.monthly_token_allocation > 0) {
        await this.allocateSubscriptionTokens(
          subscription.user_id,
          subscription.subscription_id,
          plan.monthly_token_allocation,
          'Initial subscription token allocation'
        );
      }
      
      return subscription;
    } catch (error) {
      logger.error('Error in createSubscription:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId, subscriptionData) {
    try {
      // Check if plan is being changed
      const currentSubscription = await this.dataAccess.subscriptions.getSubscriptionById(subscriptionId);
      const updatedSubscription = await this.dataAccess.subscriptions.updateSubscription(subscriptionId, subscriptionData);
      
      // If plan changed and there's a payment, create payment record
      if (
        currentSubscription && 
        updatedSubscription && 
        subscriptionData.plan_id && 
        currentSubscription.plan_id !== subscriptionData.plan_id &&
        subscriptionData.payment_provider && 
        subscriptionData.external_payment_id
      ) {
        await this.dataAccess.payments.createSubscriptionPayment(
          updatedSubscription.user_id,
          subscriptionId,
          subscriptionData.plan_id,
          subscriptionData.amount || 0,
          subscriptionData.payment_provider,
          subscriptionData.external_payment_id,
          'subscription_renewal',
          {
            startDate: updatedSubscription.start_date,
            endDate: updatedSubscription.end_date
          }
        );
        
        // Allocate new plan tokens if applicable
        const newPlan = await this.dataAccess.plans.getPlanById(subscriptionData.plan_id);
        if (newPlan && newPlan.monthly_token_allocation > 0) {
          await this.allocateSubscriptionTokens(
            updatedSubscription.user_id,
            subscriptionId,
            newPlan.monthly_token_allocation,
            'Plan change token allocation'
          );
        }
      }
      
      return updatedSubscription;
    } catch (error) {
      logger.error('Error in updateSubscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId, reason = null) {
    try {
      const cancelledSubscription = await this.dataAccess.subscriptions.cancelSubscription(subscriptionId, reason);
      
      // If the subscription is with Stripe, cancel it there too
      if (cancelledSubscription && cancelledSubscription.external_subscription_id) {
        try {
          await this.stripeService.cancelSubscription(cancelledSubscription.external_subscription_id);
        } catch (stripeError) {
          logger.error('Error cancelling subscription in Stripe:', stripeError);
          // Continue with local cancellation even if Stripe fails
        }
      }
      
      return cancelledSubscription;
    } catch (error) {
      logger.error('Error in cancelSubscription:', error);
      throw error;
    }
  }

  /**
   * Token Package API Methods
   */
  async getAllTokenPackages(includeInactive = false) {
    try {
      return await this.dataAccess.tokenPackages.getAllTokenPackages(includeInactive);
    } catch (error) {
      logger.error('Error in getAllTokenPackages:', error);
      throw error;
    }
  }

  async getTokenPackageById(packageId) {
    try {
      return await this.dataAccess.tokenPackages.getTokenPackageById(packageId);
    } catch (error) {
      logger.error('Error in getTokenPackageById:', error);
      throw error;
    }
  }

  /**
   * Token Transaction API Methods
   */
  async getUserTokenTransactions(userId, limit = 100, offset = 0) {
    try {
      return await this.dataAccess.tokenTransactions.getUserTokenTransactions(userId, limit, offset);
    } catch (error) {
      logger.error('Error in getUserTokenTransactions:', error);
      throw error;
    }
  }

  async getUserTokenBalance(userId) {
    try {
      return await this.dataAccess.tokenTransactions.getUserTokenBalance(userId);
    } catch (error) {
      logger.error('Error in getUserTokenBalance:', error);
      throw error;
    }
  }

  async allocateSubscriptionTokens(userId, subscriptionId, tokenAmount, description) {
    try {
      return await this.dataAccess.tokenTransactions.allocateSubscriptionTokens(
        userId, 
        subscriptionId, 
        tokenAmount, 
        description
      );
    } catch (error) {
      logger.error('Error in allocateSubscriptionTokens:', error);
      throw error;
    }
  }

  async recordTokenUsage(userId, jobId, serviceName, tokenAmount, metadata = {}) {
    try {
      // Check if user has enough tokens
      const balance = await this.dataAccess.tokenTransactions.getUserTokenBalance(userId);
      if (balance < tokenAmount) {
        throw new Error(`Insufficient token balance. Required: ${tokenAmount}, Available: ${balance}`);
      }

      return await this.dataAccess.tokenTransactions.recordTokenUsage(
        userId,
        jobId,
        serviceName,
        tokenAmount,
        metadata
      );
    } catch (error) {
      logger.error('Error in recordTokenUsage:', error);
      throw error;
    }
  }

  /**
   * Calculate token cost for a job
   * @param {Object} jobData - Data about the job and its components
   * @returns {Object} - Breakdown of token costs and total
   */
  calculateJobTokenCost(jobData) {
    try {
      return this.tokenCalculator.calculateJobCost(jobData);
    } catch (error) {
      logger.error('Error in calculateJobTokenCost:', error);
      throw error;
    }
  }

  /**
   * Get token cost for a specific service
   * @param {string} service - Service name
   * @returns {number} - Token cost
   */
  getServiceTokenCost(service) {
    try {
      return this.tokenCalculator.getServiceCost(service);
    } catch (error) {
      logger.error(`Error getting token cost for service ${service}:`, error);
      throw error;
    }
  }

  /**
   * Get all token costs
   * @returns {Object} - All token costs by service
   */
  getAllTokenCosts() {
    try {
      return this.tokenCalculator.getAllCosts();
    } catch (error) {
      logger.error('Error getting all token costs:', error);
      throw error;
    }
  }

  async purchaseTokenPackage(userId, packageId, paymentMethod, paymentDetails) {
    try {
      // Get the token package
      const tokenPackage = await this.dataAccess.tokenPackages.getTokenPackageById(packageId);
      if (!tokenPackage) {
        throw new Error(`Token package with ID ${packageId} not found`);
      }

      // Process payment via Stripe
      const paymentResult = await this.stripeService.createPayment({
        amount: tokenPackage.price,
        currency: 'eur',
        paymentMethod,
        description: `Token Package: ${tokenPackage.package_name}`,
        userId,
        metadata: {
          packageId,
          tokenAllocation: tokenPackage.token_allocation
        }
      });

      // Record payment
      const payment = await this.dataAccess.payments.createTokenPackagePayment(
        userId,
        packageId,
        tokenPackage.price,
        'stripe', // hardcoded for now, will be dynamic in the future
        paymentResult.id
      );

      // Allocate tokens
      const transaction = await this.dataAccess.tokenTransactions.recordTokenPackagePurchase(
        userId,
        packageId,
        tokenPackage.token_allocation,
        payment.payment_id
      );

      return {
        success: true,
        payment,
        transaction,
        tokenPackage
      };
    } catch (error) {
      logger.error('Error in purchaseTokenPackage:', error);
      throw error;
    }
  }

  /**
   * Payment API Methods
   */
  async getUserPayments(userId, limit = 100, offset = 0) {
    try {
      return await this.dataAccess.payments.getUserPayments(userId, limit, offset);
    } catch (error) {
      logger.error('Error in getUserPayments:', error);
      throw error;
    }
  }

  async getUserPaymentSummary(userId) {
    try {
      return await this.dataAccess.payments.getUserPaymentSummary(userId);
    } catch (error) {
      logger.error('Error in getUserPaymentSummary:', error);
      throw error;
    }
  }

  /**
   * Webhook Handling
   */
  async handleStripeWebhook(payload, signature) {
    try {
      const event = await this.stripeService.constructEvent(payload, signature);
      
      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }
      
      return event;
    } catch (error) {
      logger.error('Error in handleStripeWebhook:', error);
      throw error;
    }
  }

  // Webhook event handlers
  async handlePaymentIntentSucceeded(paymentIntent) {
    logger.info('Payment intent succeeded:', paymentIntent.id);
    // Implementation will be added when we set up Stripe
  }

  async handlePaymentIntentFailed(paymentIntent) {
    logger.warn('Payment intent failed:', paymentIntent.id);
    // Implementation will be added when we set up Stripe
  }

  async handleInvoicePaymentSucceeded(invoice) {
    logger.info('Invoice payment succeeded:', invoice.id);
    // Implementation will be added when we set up Stripe
  }

  async handleInvoicePaymentFailed(invoice) {
    logger.warn('Invoice payment failed:', invoice.id);
    // Implementation will be added when we set up Stripe
  }

  async handleSubscriptionUpdated(subscription) {
    logger.info('Subscription updated:', subscription.id);
    // Implementation will be added when we set up Stripe
  }

  async handleSubscriptionDeleted(subscription) {
    logger.info('Subscription deleted:', subscription.id);
    // Implementation will be added when we set up Stripe
  }

  async cleanup() {
    logger.info('Cleaning up Subscription Service...');
    // Add any cleanup logic here
    logger.info('Subscription Service cleanup completed');
  }
}

async function startServer() {
  try {
    logger.info('Starting Subscription Service');
    const subscriptionService = new SubscriptionServiceInterface();
    await subscriptionService.initialize();

    const PORT = process.env.SUBSCRIPTION_SERVICE_PORT || 3010;
    const app = createServer(subscriptionService);

    app.listen(PORT, () => {
      logger.info(`Subscription Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start Subscription Service:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { SubscriptionServiceInterface, startServer }; 