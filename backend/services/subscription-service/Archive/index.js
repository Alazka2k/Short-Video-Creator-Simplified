const createServer = require('./server');
const logger = require('../../shared/utils/logger');
const planDataAccess = require('./data/plansDataAccess');
const subscriptionDataAccess = require('./data/subscriptionsDataAccess');
const tokenPackageDataAccess = require('./data/tokenPackagesDataAccess');
const tokenTransactionDataAccess = require('./data/tokenTransactionsDataAccess');
const paymentDataAccess = require('./data/paymentsDataAccess');
const stripeService = require('./utils/stripeService');
const tokenCalculator = require('./utils/tokenCalculator');
const TokenBalanceDataAccess = require('./data/tokenBalanceDataAccess');

class SubscriptionServiceInterface {
  constructor() {
    this.dataAccess = {
      plans: planDataAccess,
      subscriptions: subscriptionDataAccess,
      tokenPackages: tokenPackageDataAccess,
      tokenTransactions: tokenTransactionDataAccess,
      payments: paymentDataAccess,
      tokenBalance: null
    };
    this.tokenCalculator = tokenCalculator;
  }

  async initialize() {
    logger.info('Initializing Subscription Service...');

    try {
      // Initialize Stripe service
      await stripeService.initialize();
      this.stripeService = stripeService;

      // Initialize token balance data access
      this.dataAccess.tokenBalance = new TokenBalanceDataAccess();

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
  async getUserSubscriptions(userId) {
    try {
      logger.info('Getting user subscriptions:', { userId });
      
      if (!userId) {
        logger.warn('Invalid userId provided to getUserSubscriptions');
        throw new Error('User ID is required');
      }
      
      return await this.dataAccess.subscriptions.getUserSubscriptions(userId);
    } catch (error) {
      logger.error('Error in getUserSubscriptions:', error);
      throw error;
    }
  }

  async getUserActiveSubscription(userId) {
    try {
      logger.info('Getting user active subscription:', { userId });
      
      if (!userId) {
        logger.warn('Invalid userId provided to getUserActiveSubscription');
        throw new Error('User ID is required');
      }
      
      return await this.dataAccess.subscriptions.getUserActiveSubscription(userId);
    } catch (error) {
      logger.error('Error in getUserActiveSubscription:', error);
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
      logger.info('Creating new subscription:', subscriptionData);
      
      // Get database connection for transaction
      if (!this.dataAccess.subscriptions.knex) {
        logger.error('Database connection not initialized in subscriptions data access');
        throw new Error('Database connection not initialized');
      }
      
      // Start transaction
      let trx;
      try {
        trx = await this.dataAccess.subscriptions.knex.transaction();
        
        // Check for existing subscription
        const existingSubscription = await this.dataAccess.subscriptions.getUserActiveSubscription(subscriptionData.userId, trx);
        
        // If the user has an active subscription with the same plan, prevent creating a duplicate
        if (existingSubscription && existingSubscription.plan_id === parseInt(subscriptionData.planId)) {
          await trx.rollback();
          logger.warn('User already has an active subscription with this plan:', {
            userId: subscriptionData.userId,
            planId: subscriptionData.planId,
            existingSubscriptionId: existingSubscription.subscription_id
          });
          throw new Error('User already has an active subscription with this plan');
        }
        
        // If the user has an active subscription with a different plan, cancel it
        if (existingSubscription) {
          logger.info('User has an active subscription that will be cancelled before upgrading:', { 
            userId: subscriptionData.userId,
            existingSubscriptionId: existingSubscription.subscription_id,
            existingPlanId: existingSubscription.plan_id,
            newPlanId: subscriptionData.planId
          });
          
          // Cancel existing subscription before creating new one
          await this.dataAccess.subscriptions.cancelSubscription(
            existingSubscription.subscription_id, 
            'Upgraded to new subscription plan',
            trx
          );
        }
        
        // Prepare subscription data
        // Don't set endDate unless it's explicitly provided
        // This is critical for subscriptions that auto-renew and don't have a predetermined end date
        if (!subscriptionData.endDate && !subscriptionData.currentPeriodEnd) {
          try {
            // Get plan details to determine billing frequency
            const plan = await this.dataAccess.plans.getPlanById(subscriptionData.planId);
            if (plan) {
              const startDate = new Date(subscriptionData.startDate || new Date());
              
              // Only set currentPeriodEnd - don't set an endDate for the subscription itself
              let periodEnd;
              
              if (plan.billing_frequency === 'monthly') {
                periodEnd = new Date(startDate);
                periodEnd.setMonth(periodEnd.getMonth() + 1);
              } else if (plan.billing_frequency === 'yearly') {
                periodEnd = new Date(startDate);
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
              }
              
              if (periodEnd) {
                subscriptionData.currentPeriodEnd = periodEnd;
              }
            }
          } catch (error) {
            logger.warn('Error determining billing period from plan:', error);
            // Continue with subscription creation even if this fails
          }
        }
        
        // Create the subscription
        const newSubscription = await this.dataAccess.subscriptions.createSubscription(subscriptionData, trx);
        
        // Create payment record if payment data is provided
        let paymentRecord = null;
        if (subscriptionData.paymentProvider && subscriptionData.externalPaymentId) {
          try {
            // Get plan for correct billing period calculation
            const plan = await this.dataAccess.plans.getPlanById(subscriptionData.planId);
            if (!plan) {
              throw new Error(`Plan not found: ${subscriptionData.planId}`);
            }
            
            // Calculate billing period based on plan frequency
            const startDate = new Date(subscriptionData.startDate || new Date());
            let endDate;
            
            if (plan.billing_frequency === 'monthly') {
              endDate = new Date(startDate);
              endDate.setMonth(endDate.getMonth() + 1);
            } else if (plan.billing_frequency === 'yearly') {
              endDate = new Date(startDate);
              endDate.setFullYear(endDate.getFullYear() + 1);
            }
            
            // Determine payment amount from plan if not explicitly provided
            let paymentAmount = subscriptionData.amount;
            if (paymentAmount === undefined || paymentAmount === null) {
              if (plan.billing_frequency === 'yearly') {
                paymentAmount = plan.annual_price || (plan.monthly_price * 12);
              } else {
                paymentAmount = plan.monthly_price;
              }
              logger.info('Using plan price for payment amount:', {
                planId: plan.plan_id,
                amount: paymentAmount,
                billingFrequency: plan.billing_frequency
              });
            }
            
            // Create the payment record with correct billing period
            paymentRecord = await this.dataAccess.payments.createSubscriptionPayment(
              subscriptionData.userId,
              newSubscription.subscription_id,
              subscriptionData.planId,
              paymentAmount,
              subscriptionData.paymentProvider,
              subscriptionData.externalPaymentId,
              'subscription_initial',
              {
                start: startDate,
                end: endDate
              },
              trx
            );
            
            logger.info('Payment record created for subscription', {
              subscriptionId: newSubscription.subscription_id,
              userId: subscriptionData.userId,
              paymentId: paymentRecord.payment_id
            });
          } catch (paymentError) {
            logger.error('Error creating payment record:', paymentError);
            // Continue with subscription creation even if payment record fails
          }
        }
        
        // Allocate tokens based on the plan - this happens for all subscriptions including free tier
        try {
          // Get plan details
          const plan = await this.dataAccess.plans.getPlanById(subscriptionData.planId);
          if (!plan) {
            throw new Error(`Plan not found: ${subscriptionData.planId}`);
          }
          
          // Allocate tokens based on monthly allocation
          const tokenAmount = plan.monthly_token_allocation;
          if (tokenAmount > 0) {
            await this.dataAccess.tokenTransactions.allocateSubscriptionTokens(
              subscriptionData.userId,
              newSubscription.subscription_id,
              tokenAmount,
              `Initial token allocation for ${plan.plan_name} subscription`,
              paymentRecord ? paymentRecord.payment_id : null,  // Pass payment ID if available
              trx
            );
            
            logger.info('Tokens allocated for new subscription', {
              subscriptionId: newSubscription.subscription_id,
              userId: subscriptionData.userId,
              tokenAmount,
              paymentId: paymentRecord ? paymentRecord.payment_id : null
            });
          }
        } catch (tokenError) {
          logger.error('Error allocating tokens for subscription:', tokenError);
          // Roll back the transaction if token allocation fails
          await trx.rollback();
          throw new Error(`Failed to allocate tokens: ${tokenError.message}`);
        }
        
        // Commit the transaction
        await trx.commit();
        logger.info('Subscription creation transaction committed successfully');
        
        return newSubscription;
      } catch (error) {
        // Roll back the transaction if anything failed
        if (trx) {
          await trx.rollback();
          logger.error('Subscription creation transaction rolled back:', error);
        }
        throw error;
      }
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
        // Get the new plan to determine the correct payment amount
        const newPlan = await this.dataAccess.plans.getPlanById(subscriptionData.plan_id);
        if (!newPlan) {
          throw new Error(`Plan not found: ${subscriptionData.plan_id}`);
        }
        
        // Determine payment amount from plan if not explicitly provided
        let paymentAmount = subscriptionData.amount;
        if (paymentAmount === undefined || paymentAmount === null) {
          if (newPlan.billing_frequency === 'yearly') {
            paymentAmount = newPlan.annual_price || (newPlan.monthly_price * 12);
          } else {
            paymentAmount = newPlan.monthly_price;
          }
          logger.info('Using plan price for update payment amount:', {
            planId: newPlan.plan_id,
            amount: paymentAmount,
            billingFrequency: newPlan.billing_frequency
          });
        }
        
        await this.dataAccess.payments.createSubscriptionPayment(
          updatedSubscription.user_id,
          subscriptionId,
          subscriptionData.plan_id,
          paymentAmount,
          subscriptionData.payment_provider,
          subscriptionData.external_payment_id,
          'subscription_renewal',
          {
            startDate: updatedSubscription.start_date,
            endDate: updatedSubscription.end_date
          }
        );
        
        // Allocate new plan tokens if applicable
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

  /**
   * Get the token balance for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - Token balance information
   */
  async getUserTokenBalance(userId) {
    try {
      // Use the tokenBalance data access instead of tokenTransactions
      return await this.dataAccess.tokenBalance.getUserTokenBalance(userId);
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

  /**
   * Allocate tokens to a user from any source
   * @param {string} userId - User ID to allocate tokens to
   * @param {number} tokenAmount - Amount of tokens to allocate
   * @param {string} relatedEntityType - Source type (subscription, token_package, other)
   * @param {number|string|null} relatedEntityId - ID of the related entity
   * @param {string} description - Description of the allocation
   * @param {number|null} paymentId - Optional payment ID if the allocation is tied to a payment
   * @returns {Promise<Object>} The created token transaction
   */
  async allocateTokens(userId, tokenAmount, relatedEntityType, relatedEntityId, description, paymentId = null) {
    try {
      return await this.dataAccess.tokenTransactions.allocateTokens(
        userId,
        tokenAmount,
        relatedEntityType,
        relatedEntityId,
        description,
        paymentId
      );
    } catch (error) {
      logger.error('Error in allocateTokens:', error);
      throw error;
    }
  }

  /**
   * Record token usage for a service
   * @param {string} userId - The user ID
   * @param {string} jobId - The job ID (optional)
   * @param {string} serviceName - The service name
   * @param {number} tokenAmount - The token amount to deduct
   * @param {Object} metadata - Additional metadata about the usage
   * @param {string} description - Description of the usage
   * @param {string} relatedEntityType - The type of entity related to the usage
   * @param {string} relatedEntityId - The ID of the related entity
   * @param {string} externalServiceName - The name of the external service used
   * @returns {Promise<Object>} - The updated token balance
   */
  async recordTokenUsage(userId, jobId, serviceName, tokenAmount, metadata = {}, description = null, relatedEntityType = null, relatedEntityId = null, externalServiceName = null) {
    try {
      // Ensure positive token amount
      const amount = Math.abs(tokenAmount);
      
      logger.info('Recording token usage:', {
        userId, 
        jobId, 
        serviceName, 
        amount, 
        metadata,
        description,
        relatedEntityType,
        relatedEntityId,
        externalServiceName
      });
      
      // Check if user has sufficient tokens
      const tokenBalance = await this.dataAccess.tokenBalance.getUserTokenBalance(userId);
      
      if (tokenBalance.balance < amount) {
        throw new Error(`Insufficient token balance. Required: ${amount}, Available: ${tokenBalance.balance}`);
      }
      
      // Use provided entity type/id if available, otherwise default to job
      const entityType = relatedEntityType || 'job';
      const entityId = relatedEntityId || jobId;
      const serviceDescription = description || `Used ${amount} tokens for ${serviceName}`;
      
      // Record the usage transaction using generalized schema
      await this.dataAccess.tokenTransactions.createTransaction({
        userId: userId,
        transactionType: 'deduction',
        tokenAmount: -amount, // Negative amount for deduction
        description: serviceDescription,
        externalServiceName: externalServiceName || serviceName,
        relatedEntityType: entityType,
        relatedEntityId: entityId,
        metadata: metadata // Preserve original metadata
      });
      
      // Get updated token balance - using the new method, not the deprecated one
      return await this.dataAccess.tokenBalance.getUserTokenBalance(userId);
    } catch (error) {
      logger.error('Error recording token usage:', error);
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
   * Create a payment record with flexible options for different use cases
   * @param {Object} paymentData - Payment data object
   * @param {string} paymentData.userId - User ID
   * @param {string} paymentData.paymentType - Payment type (subscription_initial, subscription_renewal, token_package)
   * @param {string} paymentData.status - Payment status (completed, open, failed)
   * @param {string} paymentData.paymentProvider - Payment provider (stripe, paypal)
   * @param {string} paymentData.externalPaymentId - External payment ID from provider
   * @param {number} [paymentData.planId] - Plan ID (required for subscription payments)
   * @param {number} [paymentData.subscriptionId] - Subscription ID (required for subscription payments)
   * @param {number} [paymentData.packageId] - Package ID (required for token_package payments)
   * @param {number} [paymentData.amount] - Optional explicit amount (if not provided, fetched from plan/package)
   * @param {Object} [paymentData.billingPeriod] - Billing period for subscription payments
   * @returns {Promise<Object>} - Created payment record
   */
  async createPaymentRecord(paymentData) {
    try {
      logger.info('Creating payment record:', paymentData);
      
      // Validate required fields
      if (!paymentData.userId) {
        throw new Error('userId is required');
      }
      
      if (!paymentData.paymentType) {
        throw new Error('paymentType is required');
      }
      
      if (!paymentData.paymentProvider) {
        throw new Error('paymentProvider is required');
      }
      
      if (!paymentData.externalPaymentId) {
        throw new Error('externalPaymentId is required');
      }
      
      // Set default status if not provided
      if (!paymentData.status) {
        paymentData.status = 'completed';
      }
      
      let amount = paymentData.amount;
      
      // For subscription payments, ensure plan and subscription IDs are present
      if (paymentData.paymentType === 'subscription_initial' || paymentData.paymentType === 'subscription_renewal') {
        if (!paymentData.subscriptionId) {
          throw new Error('subscriptionId is required for subscription payments');
        }
        
        // For renewal payments, we can fetch plan details from the subscription if planId is not provided
        if (!paymentData.planId && paymentData.paymentType === 'subscription_renewal') {
          // Fetch subscription details
          const subscription = await this.dataAccess.subscriptions.getSubscriptionById(paymentData.subscriptionId);
          
          if (!subscription) {
            throw new Error(`Subscription not found: ${paymentData.subscriptionId}`);
          }
          
          // Validate that the subscription is active
          if (subscription.status !== 'active') {
            throw new Error(`Cannot create payment for inactive subscription: ${paymentData.subscriptionId}, status: ${subscription.status}`);
          }
          
          // Check if there's already an open payment for this subscription
          const existingPayments = await this.dataAccess.payments.getSubscriptionPayments(paymentData.subscriptionId);
          const openPayment = existingPayments.find(payment => payment.status === 'open');
          
          if (openPayment) {
            throw new Error(`An open payment already exists for subscription: ${paymentData.subscriptionId}, payment ID: ${openPayment.payment_id}`);
          }
          
          // Use the plan ID from the subscription
          paymentData.planId = subscription.plan_id;
          logger.info(`Using plan ID ${paymentData.planId} from subscription ${paymentData.subscriptionId}`);
        } else if (!paymentData.planId) {
          throw new Error('planId is required for subscription payments');
        }
        
        // If amount not provided, get it from the plan
        if (!amount) {
          const plan = await this.dataAccess.plans.getPlanById(paymentData.planId);
          if (!plan) {
            throw new Error(`Plan not found: ${paymentData.planId}`);
          }
          
          // Use monthly or annual price based on plan frequency
          if (plan.billing_frequency === 'yearly') {
            amount = plan.annual_price || plan.monthly_price * 12;
          } else {
            amount = plan.monthly_price;
          }
        }
        
        // If billing period not provided for a renewal, calculate it based on the subscription
        if (paymentData.paymentType === 'subscription_renewal' && !paymentData.billingPeriod) {
          const subscription = await this.dataAccess.subscriptions.getSubscriptionById(paymentData.subscriptionId);
          if (subscription) {
            const plan = await this.dataAccess.plans.getPlanById(subscription.plan_id);
            if (plan) {
              // Calculate next billing period based on current period end date
              const startDate = subscription.current_period_end || new Date();
              let endDate;
              
              if (plan.billing_frequency === 'monthly') {
                endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + 1);
              } else if (plan.billing_frequency === 'yearly') {
                endDate = new Date(startDate);
                endDate.setFullYear(endDate.getFullYear() + 1);
              }
              
              paymentData.billingPeriod = {
                start: startDate,
                end: endDate
              };
              
              logger.info(`Calculated billing period for renewal:`, {
                subscriptionId: subscription.subscription_id,
                start: startDate,
                end: endDate
              });
            }
          }
        }
        
        // Create subscription payment
        return await this.dataAccess.payments.createSubscriptionPayment(
          paymentData.userId,
          paymentData.subscriptionId,
          paymentData.planId,
          amount,
          paymentData.paymentProvider,
          paymentData.externalPaymentId,
          paymentData.paymentType,
          paymentData.billingPeriod || {},
          null, // No transaction
          paymentData.status
        );
      } 
      // For token package payments
      else if (paymentData.paymentType === 'token_package') {
        if (!paymentData.packageId) {
          throw new Error('packageId is required for token package payments');
        }
        
        // If amount not provided, get it from the package
        if (!amount) {
          const tokenPackage = await this.dataAccess.tokenPackages.getTokenPackageById(paymentData.packageId);
          if (!tokenPackage) {
            throw new Error(`Token package not found: ${paymentData.packageId}`);
          }
          amount = tokenPackage.price;
        }
        
        // Create custom payment data
        const customPaymentData = {
          user_id: paymentData.userId,
          amount,
          payment_provider: paymentData.paymentProvider,
          payment_method: paymentData.paymentMethod || 'credit_card',
          currency: paymentData.currency || 'eur',
          external_payment_id: paymentData.externalPaymentId,
          payment_type: 'token_package',
          status: paymentData.status,
          package_id: paymentData.packageId
        };
        
        // Create payment directly
        return await this.dataAccess.payments.createPayment(customPaymentData);
      }
      
      // For other payment types
      throw new Error(`Unsupported payment type: ${paymentData.paymentType}`);
    } catch (error) {
      logger.error('Error in createPaymentRecord:', error);
      throw error;
    }
  }
  
  /**
   * Update payment status
   * @param {number} paymentId - Payment ID to update
   * @param {string} status - New status (completed, open, failed)
   * @returns {Promise<Object|null>} - Updated payment or null if not found
   */
  async updatePaymentStatus(paymentId, status) {
    try {
      logger.info('Updating payment status:', { paymentId, status });
      
      // Validate status value
      const validStatuses = ['completed', 'open', 'failed'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Check if payment exists
      const payment = await this.dataAccess.payments.getPaymentById(paymentId);
      if (!payment) {
        logger.warn('Payment not found for status update:', { paymentId });
        return null;
      }
      
      // Update the payment status
      const updatedPayment = await this.dataAccess.payments.updatePayment(paymentId, { status });
      
      // If status changed to completed and it's a token package payment, allocate tokens
      if (status === 'completed' && payment.status !== 'completed' && payment.payment_type === 'token_package') {
        try {
          // Get token package
          const tokenPackage = await this.dataAccess.tokenPackages.getTokenPackageById(payment.package_id);
          if (tokenPackage) {
            // Allocate tokens
            await this.dataAccess.tokenTransactions.recordTokenPackagePurchase(
              payment.user_id,
              payment.package_id,
              tokenPackage.token_allocation,
              payment.payment_id
            );
            
            logger.info('Tokens allocated after payment completed:', {
              userId: payment.user_id,
              packageId: payment.package_id,
              tokenAmount: tokenPackage.token_allocation,
              paymentId: payment.payment_id
            });
          }
        } catch (tokenError) {
          logger.error('Error allocating tokens after payment completion:', tokenError);
          // Continue despite error, to at least update the payment status
        }
      }
      
      return updatedPayment;
    } catch (error) {
      logger.error('Error in updatePaymentStatus:', error);
      throw error;
    }
  }
  
  /**
   * Purchase a token package with integrated payment creation
   * @param {string} userId - User ID
   * @param {number} packageId - Token package ID
   * @param {string} paymentProvider - Payment provider (e.g., 'stripe')
   * @param {string} externalPaymentId - External payment ID from provider
   * @returns {Promise<Object>} - Result containing payment, transaction, and package details
   */
  async purchaseTokenPackage(userId, packageId, paymentProvider, externalPaymentId) {
    try {
      logger.info('Processing token package purchase:', {
        userId, packageId, paymentProvider, externalPaymentId
      });
      
      // Get the token package
      const tokenPackage = await this.dataAccess.tokenPackages.getTokenPackageById(packageId);
      if (!tokenPackage) {
        throw new Error(`Token package with ID ${packageId} not found`);
      }
      
      // Create payment record
      const payment = await this.createPaymentRecord({
        userId,
        paymentType: 'token_package',
        paymentProvider,
        externalPaymentId,
        packageId,
        amount: tokenPackage.price,
        status: 'completed'
      });
      
      // Allocate tokens
      const transaction = await this.dataAccess.tokenTransactions.recordTokenPackagePurchase(
        userId,
        packageId,
        tokenPackage.token_allocation,
        payment.payment_id
      );
      
      // Return complete result
      return {
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