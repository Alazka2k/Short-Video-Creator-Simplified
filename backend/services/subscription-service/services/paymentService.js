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
      
      // Validate required fields
      if (!paymentData.userId) {
        throw new Error('userId is required');
      }
      
      if (!paymentData.paymentType) {
        throw new Error('paymentType is required');
      }
      
      if (!paymentData.status) {
        throw new Error('status is required');
      }
      
      // Only require paymentProvider for non-renewal payments
      if (paymentData.paymentType !== 'subscription_renewal' && !paymentData.paymentProvider) {
        throw new Error('paymentProvider is required');
      }
      
      // For subscription renewals, we'll get the plan details from the subscription
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
      
      // Convert camelCase to snake_case for database
      const dbPaymentData = {
        user_id: paymentData.userId,
        payment_type: paymentData.paymentType,
        status: paymentData.status,
        amount: paymentData.amount,
        payment_provider: paymentData.paymentProvider,
        external_payment_id: paymentData.externalPaymentId,
        payment_method: paymentData.paymentMethod || 'credit_card',
        currency: paymentData.currency || 'eur',
        plan_id: paymentData.planId,
        subscription_id: paymentData.subscriptionId,
        package_id: paymentData.packageId
      };
      
      // Add billing period if provided
      if (paymentData.billingPeriod) {
        dbPaymentData.billing_period_start = paymentData.billingPeriod.billing_period_start || paymentData.billingPeriod.start;
        dbPaymentData.billing_period_end = paymentData.billingPeriod.billing_period_end || paymentData.billingPeriod.end;
      }
      
      // Create the payment record
      const payment = await this.dataAccess.payments.createPayment(dbPaymentData);
      
      logger.info('Payment record created successfully:', {
        paymentId: payment.payment_id,
        userId: payment.user_id,
        amount: payment.amount,
        status: payment.status
      });
      
      return payment;
    } catch (error) {
      logger.error('Error in createPaymentRecord:', error);
      throw error;
    }
  }

  /**
   * Update a payment record
   * @param {string} paymentId - The payment ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated payment record
   */
  async updatePayment(paymentId, updateData) {
    try {
      logger.info('Updating payment:', { paymentId, updateData });
      
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }
      
      // Get the existing payment
      const existingPayment = await this.dataAccess.payments.getPaymentById(paymentId);
      
      if (!existingPayment) {
        throw new Error(`Payment not found: ${paymentId}`);
      }
      
      // If updating to completed status, require paymentProvider and externalPaymentId
      if (updateData.status === 'completed') {
        if (!updateData.paymentProvider) {
          throw new Error('paymentProvider is required when updating to completed status');
        }
        if (!updateData.externalPaymentId) {
          throw new Error('externalPaymentId is required when updating to completed status');
        }
        
        // Set payment_date to now when completing the payment
        updateData.payment_date = new Date();
      }
      
      // Special handling for token package payments that become completed
      if (existingPayment.payment_type === 'token_package' && 
          existingPayment.status !== 'completed' && 
          updateData.status === 'completed') {
        
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
      
      // Convert camelCase to snake_case for database
      const dbUpdateData = {};
      
      // Map camelCase properties to snake_case
      if (updateData.status !== undefined) dbUpdateData.status = updateData.status;
      if (updateData.paymentProvider !== undefined) dbUpdateData.payment_provider = updateData.paymentProvider;
      if (updateData.externalPaymentId !== undefined) dbUpdateData.external_payment_id = updateData.externalPaymentId;
      if (updateData.paymentMethod !== undefined) dbUpdateData.payment_method = updateData.paymentMethod;
      if (updateData.payment_date !== undefined) dbUpdateData.payment_date = updateData.payment_date;
      if (updateData.amount !== undefined) dbUpdateData.amount = updateData.amount;
      
      // Update the payment
      const updatedPayment = await this.dataAccess.payments.updatePayment(paymentId, dbUpdateData);
      
      logger.info('Payment updated successfully:', {
        paymentId,
        status: updatedPayment.status
      });
      
      return updatedPayment;
    } catch (error) {
      logger.error('Error updating payment:', error);
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

  /**
   * Get payments that need to be renewed
   * @param {boolean} force - Whether to force renewal regardless of billing period
   * @returns {Promise<Array>} - List of payments that need to be renewed
   */
  async getPaymentsForRenewal(force = false) {
    try {
      logger.info('Getting payments for renewal:', { force });
      
      // Get all completed payments that have reached their billing period end
      const payments = await this.dataAccess.payments.getPaymentsWithCompletedBillingPeriod(force);
      
      if (!payments || payments.length === 0) {
        logger.info('No payments found that need renewal');
        return [];
      }
      
      logger.info(`Found ${payments.length} payments that need renewal`);
      
      // For each payment, calculate the next billing period
      const paymentsForRenewal = [];
      
      for (const payment of payments) {
        // Get the plan to determine billing frequency
        const plan = await this.dataAccess.plans.getPlanById(payment.plan_id);
        
        if (!plan) {
          logger.warn(`Plan not found for payment ${payment.payment_id}, skipping`);
          continue;
        }
        
        // Calculate next billing period based on the payment's frequency
        const nextBillingPeriod = this.calculateNextBillingPeriod(
          payment.billing_period_end,
          plan.billing_frequency
        );
        
        // Format dates as YYYY-MM-DD to match database schema
        const formatDate = (date) => {
          if (!date) return null;
          const d = new Date(date);
          return d.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        };
        
        paymentsForRenewal.push({
          payment_id: payment.payment_id,
          user_id: payment.user_id,
          subscription_id: payment.subscription_id,
          plan_id: payment.plan_id,
          amount: payment.amount,
          payment_type: 'subscription_renewal',
          billing_period_start: formatDate(payment.billing_period_start),
          billing_period_end: formatDate(payment.billing_period_end),
          next_billing_period_start: formatDate(nextBillingPeriod.start),
          next_billing_period_end: formatDate(nextBillingPeriod.end)
        });
      }
      
      return paymentsForRenewal;
    } catch (error) {
      logger.error('Error getting payments for renewal:', error);
      throw error;
    }
  }

  /**
   * Calculate the next billing period based on the current end date and billing frequency
   * @param {Date} currentEndDate - The end date of the current billing period
   * @param {string} frequency - The billing frequency ('monthly' or 'yearly')
   * @returns {Object} - Object containing start and end dates for the next billing period
   */
  calculateNextBillingPeriod(currentEndDate, frequency) {
    const startDate = new Date(currentEndDate);
    startDate.setDate(startDate.getDate() + 1); // Start the day after the current period ends
    
    const endDate = new Date(startDate);
    
    if (frequency === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    endDate.setDate(endDate.getDate() - 1); // End the day before the next period starts
    
    return {
      start: startDate,
      end: endDate
    };
  }

  /**
   * Get payments that need to be collected
   * @param {boolean} force - Whether to force collection regardless of billing period
   * @returns {Promise<Array>} - List of payments that need to be collected
   */
  async getPaymentsToCollect(force = false) {
    try {
      logger.info('Getting payments to collect:', { force });
      
      // Get all open payments that need to be collected
      const payments = await this.dataAccess.payments.getPaymentsToCollect(force);
      
      if (!payments || payments.length === 0) {
        logger.info('No payments found that need to be collected');
        return [];
      }
      
      logger.info(`Found ${payments.length} payments that need to be collected`);
      
      return payments;
    } catch (error) {
      logger.error('Error getting payments to collect:', error);
      throw error;
    }
  }

  /**
   * Collect a payment
   * @param {string} paymentId - The payment ID
   * @returns {Promise<Object>} - The updated payment
   */
  async collectPayment(paymentId) {
    try {
      logger.info('Collecting payment:', { paymentId });
      
      // Get the payment
      const payment = await this.dataAccess.payments.getPaymentById(paymentId);
      
      if (!payment) {
        throw new Error(`Payment not found: ${paymentId}`);
      }
      
      // Check if the payment is in the correct status
      if (payment.status !== 'open') {
        throw new Error(`Payment is not in open status: ${payment.status}`);
      }
      
      // Process the payment with the payment provider (e.g., Stripe)
      // This is a placeholder for the actual payment processing logic
      // In a real implementation, this would call the payment provider's API
      const paymentResult = await this.processPaymentWithProvider(payment);
      
      // Update the payment with the result
      const updatedPayment = await this.dataAccess.payments.updatePayment(paymentId, {
        status: paymentResult.success ? 'completed' : 'failed',
        payment_provider: paymentResult.provider,
        external_payment_id: paymentResult.externalId,
        payment_date: paymentResult.success ? new Date() : null
      });
      
      logger.info('Payment collected successfully:', { 
        paymentId, 
        status: updatedPayment.status 
      });
      
      return updatedPayment;
    } catch (error) {
      logger.error('Error collecting payment:', error);
      throw error;
    }
  }

  /**
   * Process a payment with the payment provider
   * @param {Object} payment - The payment to process
   * @returns {Promise<Object>} - The payment result
   */
  async processPaymentWithProvider(payment) {
    // This is a placeholder for the actual payment processing logic
    // In a real implementation, this would call the payment provider's API
    
    // For now, we'll simulate a successful payment
    return {
      success: true,
      provider: 'stripe',
      externalId: `pi_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
  }
}

module.exports = PaymentService;