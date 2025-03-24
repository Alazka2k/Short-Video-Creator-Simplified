/**
 * Payment Service
 * 
 * This service handles payment-related functionality including:
 * - Creating payment records
 * - Updating payment status
 * - Retrieving payment information
 * - Processing token package purchases
 * - Stripe webhook handling
 */

const logger = require('../../../shared/utils/logger');

class PaymentService {
  constructor(dataAccess, stripeService) {
    this.dataAccess = dataAccess;
    this.stripeService = stripeService;
    logger.info('PaymentService initialized');
  }

  /**
   * Get a user's payment history
   * @param {string} userId - The user ID
   * @param {number} limit - The maximum number of payments to return
   * @param {number} offset - The offset for pagination
   * @returns {Promise<Array>} - List of payment records
   */
  async getUserPayments(userId, limit = 100, offset = 0) {
    try {
      logger.info('Getting payments for user:', { userId, limit, offset });
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      return await this.dataAccess.payments.getUserPayments(userId, limit, offset);
    } catch (error) {
      logger.error('Error in getUserPayments:', error);
      throw error;
    }
  }

  /**
   * Get a payment summary for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - Payment summary
   */
  async getUserPaymentSummary(userId) {
    try {
      logger.info('Getting payment summary for user:', { userId });
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      return await this.dataAccess.payments.getUserPaymentSummary(userId);
    } catch (error) {
      logger.error('Error in getUserPaymentSummary:', error);
      throw error;
    }
  }

  /**
   * Create a payment record
   * @param {Object} paymentData - The payment data
   * @returns {Promise<Object>} - The created payment record
   */
  async createPaymentRecord(paymentData) {
    try {
      logger.info('Creating payment record:', paymentData);
      
      // Validate payment data
      if (!paymentData.userId) {
        throw new Error('userId is required');
      }
      
      if (!paymentData.paymentProvider) {
        throw new Error('paymentProvider is required');
      }
      
      if (!paymentData.externalPaymentId) {
        throw new Error('externalPaymentId is required');
      }
      
      if (!paymentData.paymentType) {
        throw new Error('paymentType is required');
      }
      
      if (!['subscription_initial', 'subscription_renewal', 'token_package'].includes(paymentData.paymentType)) {
        throw new Error('paymentType must be one of: subscription_initial, subscription_renewal, token_package');
      }
      
      // For subscription_renewal type, check if subscriptionId is provided
      if (paymentData.paymentType === 'subscription_renewal' && !paymentData.subscriptionId) {
        throw new Error('subscriptionId is required for subscription renewal payments');
      }

      // For token_package type, check if packageId is provided
      if (paymentData.paymentType === 'token_package' && !paymentData.packageId) {
        throw new Error('packageId is required for token package payments');
      }

      // For subscription types, validate that either planId or subscriptionId is provided
      if ((paymentData.paymentType === 'subscription_initial' || paymentData.paymentType === 'subscription_renewal')) {
        if (!paymentData.planId && !paymentData.subscriptionId) {
          throw new Error('Either planId or subscriptionId is required for subscription payments');
        }
      }
      
      // If it's a subscription_renewal and has subscriptionId but no planId, try to get it from the subscription
      if (paymentData.paymentType === 'subscription_renewal' && paymentData.subscriptionId && !paymentData.planId) {
        const subscription = await this.dataAccess.subscriptions.getSubscriptionById(paymentData.subscriptionId);
        
        if (!subscription) {
          throw new Error(`Subscription not found: ${paymentData.subscriptionId}`);
        }
        
        // Ensure the subscription is still active
        if (subscription.status !== 'active') {
          throw new Error(`Cannot create payment for inactive subscription. Status: ${subscription.status}`);
        }
        
        // Check if there are any existing open payments for this subscription
        const payments = await this.dataAccess.payments.getSubscriptionPayments(paymentData.subscriptionId);
        const openPayments = payments.filter(payment => payment.status === 'open');
        
        if (openPayments.length > 0) {
          throw new Error(`There is already an open payment for this subscription: ${openPayments[0].payment_id}`);
        }
        
        // Use the plan details from the subscription
        paymentData.planId = subscription.plan_id;
        
        // Get plan details to determine amount if not provided
        if (!paymentData.amount) {
          const plan = await this.dataAccess.plans.getPlanById(subscription.plan_id);
          
          if (!plan) {
            throw new Error(`Plan not found: ${subscription.plan_id}`);
          }
          
          if (subscription.billing_frequency === 'yearly') {
            paymentData.amount = plan.annual_price || (plan.monthly_price * 12);
          } else {
            paymentData.amount = plan.monthly_price;
          }
          
          logger.info('Using plan price for payment amount:', {
            planId: plan.plan_id,
            amount: paymentData.amount,
            billingFrequency: subscription.billing_frequency
          });
        }
        
        // Calculate billing period for renewals
        if (!paymentData.billingPeriod) {
          // Use the subscription's current period end date as the start date for the new billing period
          const startDate = new Date(subscription.current_period_end);
          let endDate;
          
          if (subscription.billing_frequency === 'monthly') {
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
          } else if (subscription.billing_frequency === 'yearly') {
            endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
          }
          
          paymentData.billingPeriod = {
            billing_period_start: startDate,
            billing_period_end: endDate
          };
        }
      }

      // For token_package type, get the package details if not provided
      if (paymentData.paymentType === 'token_package' && paymentData.packageId && !paymentData.amount) {
        const tokenPackage = await this.dataAccess.tokenPackages.getTokenPackageById(paymentData.packageId);
        
        if (!tokenPackage) {
          throw new Error(`Token package not found: ${paymentData.packageId}`);
        }
        
        paymentData.amount = tokenPackage.price;
        
        logger.info('Using token package price for payment amount:', {
          packageId: tokenPackage.package_id,
          amount: paymentData.amount
        });
      }
      
      // Final validation of amount
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new Error('amount must be a positive number');
      }
      
      // Create the payment record
      let paymentRecord;
      
      if (paymentData.paymentType === 'subscription_initial' || paymentData.paymentType === 'subscription_renewal') {
        // For subscription payments, use createSubscriptionPayment
        paymentRecord = await this.dataAccess.payments.createSubscriptionPayment(
          paymentData.userId,
          paymentData.subscriptionId,
          paymentData.planId,
          paymentData.amount,
          paymentData.paymentProvider,
          paymentData.externalPaymentId,
          paymentData.paymentType,
          paymentData.billingPeriod || {},
          undefined, // No transaction
          paymentData.status || 'completed'
        );
      } else if (paymentData.paymentType === 'token_package') {
        // For token package payments, use createTokenPackagePayment
        paymentRecord = await this.dataAccess.payments.createTokenPackagePayment(
          paymentData.userId,
          paymentData.packageId,
          paymentData.amount,
          paymentData.paymentProvider,
          paymentData.externalPaymentId,
          paymentData.status || 'completed'
        );
        
        // If the payment is completed, allocate tokens to the user
        if (paymentData.status === 'completed') {
          const tokenPackage = await this.dataAccess.tokenPackages.getTokenPackageById(paymentData.packageId);
          
          if (tokenPackage) {
            await this.dataAccess.tokenTransactions.recordTokenPackagePurchase(
              paymentData.userId,
              paymentData.packageId,
              tokenPackage.token_allocation,
              paymentRecord.payment_id
            );
            
            logger.info('Tokens allocated for token package purchase:', {
              userId: paymentData.userId,
              packageId: paymentData.packageId,
              tokenAmount: tokenPackage.token_allocation,
              paymentId: paymentRecord.payment_id
            });
          }
        }
      }
      
      logger.info('Payment record created:', {
        paymentId: paymentRecord.payment_id,
        amount: paymentRecord.amount,
        paymentType: paymentRecord.payment_type,
        status: paymentRecord.status
      });
      
      return paymentRecord;
    } catch (error) {
      logger.error('Error in createPaymentRecord:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   * @param {string} paymentId - The payment ID
   * @param {string} status - The new status (pending, completed, failed, open)
   * @returns {Promise<Object>} - The updated payment record
   */
  async updatePaymentStatus(paymentId, status) {
    try {
      logger.info('Updating payment status:', { paymentId, status });
      
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }
      
      if (!status) {
        throw new Error('Status is required');
      }
      
      if (!['pending', 'completed', 'failed', 'open'].includes(status)) {
        throw new Error('Status must be one of: pending, completed, failed, open');
      }
      
      // Get the existing payment
      const existingPayment = await this.dataAccess.payments.getPaymentById(paymentId);
      
      if (!existingPayment) {
        throw new Error(`Payment not found: ${paymentId}`);
      }
      
      // Check if status is already set to the same value
      if (existingPayment.status === status) {
        logger.info(`Payment ${paymentId} status is already ${status}`);
        return existingPayment;
      }

      // Special handling for token package payments that become completed
      if (existingPayment.payment_type === 'token_package' && 
          existingPayment.status !== 'completed' && 
          status === 'completed') {
        
        // Get the token package
        const tokenPackage = await this.dataAccess.tokenPackages.getTokenPackageById(existingPayment.package_id);
        
        if (tokenPackage) {
          // Allocate tokens for the package
          await this.dataAccess.tokenTransactions.recordTokenPackagePurchase(
            existingPayment.user_id,
            existingPayment.package_id,
            tokenPackage.token_allocation,
            existingPayment.payment_id
          );
          
          logger.info('Tokens allocated for token package purchase:', {
            userId: existingPayment.user_id,
            packageId: existingPayment.package_id,
            tokenAmount: tokenPackage.token_allocation,
            paymentId: existingPayment.payment_id
          });
        }
      }
      
      // Update the payment status
      const updatedPayment = await this.dataAccess.payments.updatePayment(paymentId, {
        status,
        payment_date: status === 'completed' ? new Date() : existingPayment.payment_date
      });
      
      logger.info('Payment status updated:', {
        paymentId,
        oldStatus: existingPayment.status,
        newStatus: status
      });
      
      return updatedPayment;
    } catch (error) {
      logger.error('Error in updatePaymentStatus:', error);
      throw error;
    }
  }

  /**
   * Purchase a token package
   * @param {string} userId - The user ID
   * @param {string} packageId - The token package ID
   * @param {string} paymentProvider - The payment provider
   * @param {string} externalPaymentId - The external payment ID
   * @returns {Promise<Object>} - The payment record
   */
  async purchaseTokenPackage(userId, packageId, paymentProvider, externalPaymentId) {
    try {
      logger.info('Purchasing token package:', { userId, packageId, paymentProvider, externalPaymentId });
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      if (!packageId) {
        throw new Error('Package ID is required');
      }
      
      if (!paymentProvider) {
        throw new Error('Payment provider is required');
      }
      
      if (!externalPaymentId) {
        throw new Error('External payment ID is required');
      }
      
      // Get the token package
      const tokenPackage = await this.dataAccess.tokenPackages.getTokenPackageById(packageId);
      
      if (!tokenPackage) {
        throw new Error(`Token package not found: ${packageId}`);
      }
      
      // Check if the package is active
      if (!tokenPackage.active) {
        throw new Error(`Token package is not active: ${packageId}`);
      }
      
      // Create the payment record
      const paymentRecord = await this.dataAccess.payments.createTokenPackagePayment(
        userId,
        packageId,
        tokenPackage.price,
        paymentProvider,
        externalPaymentId
      );
      
      logger.info('Payment record created for token package purchase:', {
        paymentId: paymentRecord.payment_id,
        amount: paymentRecord.amount
      });
      
      // Allocate tokens to the user
      await this.dataAccess.tokenTransactions.recordTokenPackagePurchase(
        userId,
        packageId,
        tokenPackage.token_allocation,
        paymentRecord.payment_id
      );
      
      logger.info('Tokens allocated for token package purchase:', {
        userId,
        packageId,
        tokenAmount: tokenPackage.token_allocation,
        paymentId: paymentRecord.payment_id
      });
      
      return {
        success: true,
        paymentId: paymentRecord.payment_id,
        amount: paymentRecord.amount,
        tokens: tokenPackage.token_allocation
      };
    } catch (error) {
      logger.error('Error in purchaseTokenPackage:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhooks
   * @param {Object} payload - The webhook payload
   * @param {string} signature - The webhook signature
   * @returns {Promise<Object>} - The processed event
   */
  async handleStripeWebhook(payload, signature) {
    try {
      logger.info('Handling Stripe webhook:', { signatureLength: signature ? signature.length : 0 });
      
      // Verify the webhook signature and parse the event
      const event = await this.stripeService.constructEvent(payload, signature);
      
      logger.info('Stripe webhook event verified:', {
        eventId: event.id,
        eventType: event.type
      });
      
      // Handle the event based on its type
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

  /**
   * Handle Payment Intent Succeeded event
   * @param {Object} paymentIntent - The payment intent object
   */
  async handlePaymentIntentSucceeded(paymentIntent) {
    // Implementation to be added
    logger.info('Payment intent succeeded:', paymentIntent.id);
  }

  /**
   * Handle Payment Intent Failed event
   * @param {Object} paymentIntent - The payment intent object
   */
  async handlePaymentIntentFailed(paymentIntent) {
    // Implementation to be added
    logger.info('Payment intent failed:', paymentIntent.id);
  }

  /**
   * Handle Invoice Payment Succeeded event
   * @param {Object} invoice - The invoice object
   */
  async handleInvoicePaymentSucceeded(invoice) {
    // Implementation to be added
    logger.info('Invoice payment succeeded:', invoice.id);
  }

  /**
   * Handle Invoice Payment Failed event
   * @param {Object} invoice - The invoice object
   */
  async handleInvoicePaymentFailed(invoice) {
    // Implementation to be added
    logger.info('Invoice payment failed:', invoice.id);
  }

  /**
   * Handle Subscription Updated event
   * @param {Object} subscription - The subscription object
   */
  async handleSubscriptionUpdated(subscription) {
    // Implementation to be added
    logger.info('Subscription updated:', subscription.id);
  }

  /**
   * Handle Subscription Deleted event
   * @param {Object} subscription - The subscription object
   */
  async handleSubscriptionDeleted(subscription) {
    // Implementation to be added
    logger.info('Subscription deleted:', subscription.id);
  }
}

module.exports = PaymentService;