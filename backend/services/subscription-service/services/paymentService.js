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
  constructor(dataAccess, stripeService, subscriptionService) {
    this.dataAccess = dataAccess;
    this.stripeService = stripeService;
    this.subscriptionService = subscriptionService;
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
        stripe_payment_intent_id: paymentData.stripePaymentIntentId,
        payment_method: paymentData.paymentMethod || 'credit_card',
        currency: paymentData.currency || 'eur',
        plan_id: paymentData.planId,
        subscription_id: paymentData.subscriptionId,
        package_id: paymentData.packageId
      };
      
      // Add billing period if provided
      if (paymentData.billing_period_start && paymentData.billing_period_end) {
        dbPaymentData.billing_period_start = paymentData.billing_period_start;
        dbPaymentData.billing_period_end = paymentData.billing_period_end;
      }
      
      // Create the payment record
      const payment = await this.dataAccess.payments.createPayment(dbPaymentData);
      
      logger.info('Payment record created successfully:', {
        paymentId: payment.payment_id,
        userId: payment.user_id,
        amount: payment.amount,
        status: payment.status,
        billing_period_start: payment.billing_period_start,
        billing_period_end: payment.billing_period_end
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
      
      // If updating to completed status, require paymentProvider and stripePaymentIntentId
      if (updateData.status === 'completed') {
        if (!updateData.paymentProvider) {
          throw new Error('paymentProvider is required when updating to completed status');
        }
        if (!updateData.stripePaymentIntentId) {
          throw new Error('stripePaymentIntentId is required when updating to completed status');
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
      if (updateData.stripePaymentIntentId !== undefined) dbUpdateData.stripe_payment_intent_id = updateData.stripePaymentIntentId;
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
   * @param {string} stripePaymentIntentId - The external payment ID
   * @returns {Promise<Object>} - The payment record
   */
  async purchaseTokenPackage(userId, packageId, paymentProvider, stripePaymentIntentId) {
    try {
      logger.info('Purchasing token package:', { userId, packageId, paymentProvider, stripePaymentIntentId });
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      if (!packageId) {
        throw new Error('Package ID is required');
      }
      
      if (!paymentProvider) {
        throw new Error('Payment provider is required');
      }
      
      if (!stripePaymentIntentId) {
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
        stripePaymentIntentId
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
   * Process a Stripe webhook event after it has been verified and logged.
   * @param {Object} event - The verified Stripe event object.
   * @returns {Promise<void>}
   */
  async processWebhookEvent(event) {
    try {
      logger.info('Processing Stripe webhook event:', { eventId: event.id, eventType: event.type });

      // The temporary error simulation for testing has been removed.

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
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
    } catch (error) {
      logger.error('Error in processWebhookEvent:', error);
      throw error;
    }
  }

  /**
   * Handle Checkout Session Completed event (initial subscription creation or token purchase)
   * @param {Object} session - The checkout session object
   */
  async handleCheckoutSessionCompleted(session) {
    try {
      logger.info('Processing checkout session completed:', session.id);
      
      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;
      const packageId = session.metadata?.packageId;
      
      if (!userId) {
        logger.warn('No userId found in checkout session metadata:', session.id);
        return;
      }
      
      if (session.mode === 'subscription' && planId) {
        // --- DELEGATE TO SUBSCRIPTION SERVICE ---
        const subscriptionData = await this.stripeService.retrieveSubscription(session.subscription);
        
        await this.subscriptionService.createSubscriptionFromStripeEvent({
          userId,
          planId,
          stripeSubscription: subscriptionData,
          stripePaymentIntentId: session.payment_intent || null,
        });

        logger.info(`Delegated subscription creation to SubscriptionService for user ${userId}, plan ${planId}`);

      } else if (session.mode === 'payment' && packageId) {
        // --- DELEGATE TOKEN PACKAGE LOGIC ---
        await this.subscriptionService.purchaseTokenPackageFromStripeEvent({
          userId,
          packageId,
          stripePaymentIntentId: session.payment_intent,
        });
        
        logger.info(`Delegated token package purchase to SubscriptionService for user ${userId}, package ${packageId}`);
      }
      
    } catch (error) {
      logger.error('Error handling checkout session completed:', error);
      throw error;
    }
  }

  /**
   * Handle Payment Intent Succeeded event (for one-time payments like token packages)
   * @param {Object} paymentIntent - The payment intent object
   */
  async handlePaymentIntentSucceeded(paymentIntent) {
    try {
      logger.info('Processing payment intent succeeded:', paymentIntent.id);
      
      const userId = paymentIntent.metadata?.userId;
      const packageId = paymentIntent.metadata?.packageId;
      
      if (!userId) {
        logger.warn('No userId found in payment intent metadata:', paymentIntent.id);
        return;
      }
      
      // Update payment record with Stripe payment intent ID
      const payment = await this.dataAccess.payments.findByStripePaymentIntentId(paymentIntent.id);
      if (payment) {
        await this.updatePayment(payment.payment_id, {
          status: 'completed',
          stripe_payment_intent_id: paymentIntent.id,
          stripe_charge_id: paymentIntent.latest_charge,
          receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url
        });
        
        logger.info(`Updated payment ${payment.payment_id} with successful payment intent`);
      }
      
      // If this is a token package purchase, allocate tokens
      if (packageId) {
        const tokenPackage = await this.dataAccess.tokenPackages.getTokenPackageById(packageId);
        if (tokenPackage) {
          await this.dataAccess.tokens.allocateTokens(userId, tokenPackage.token_amount, 'token_package_purchase', {
            packageId,
            paymentIntentId: paymentIntent.id
          });
          
          logger.info(`Allocated ${tokenPackage.token_amount} tokens to user ${userId} for package purchase`);
        }
      }
      
    } catch (error) {
      logger.error('Error handling payment intent succeeded:', error);
      throw error;
    }
  }

  /**
   * Handle Payment Intent Failed event
   * @param {Object} paymentIntent - The payment intent object
   */
  async handlePaymentIntentFailed(paymentIntent) {
    try {
      logger.info('Processing payment intent failed:', { paymentIntentId: paymentIntent.id });
      // Find the corresponding payment record in our database
      const payment = await this.dataAccess.payments.findByStripePaymentIntentId(paymentIntent.id);

      if (!payment) {
        logger.warn('No corresponding payment found for failed payment intent:', { paymentIntentId: paymentIntent.id });
        return;
      }
      
      // Update payment record to failed status
      await this.updatePayment(payment.payment_id, {
        status: 'failed',
        stripe_payment_intent_id: paymentIntent.id,
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed'
      });
      
      logger.info(`Updated payment ${payment.payment_id} to failed status`);
      
    } catch (error) {
      logger.error('Error handling payment intent failed:', error);
      throw error;
    }
  }

  /**
   * Handle Invoice Payment Succeeded event (for subscription payments)
   * @param {Object} invoice - The invoice object
   */
  async handleInvoicePaymentSucceeded(invoice) {
    try {
      logger.info('Processing invoice payment succeeded:', invoice.id);
      
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;
      
      if (!subscriptionId) {
        logger.warn('No subscription ID found in invoice:', invoice.id);
        return;
      }
      
      // Get subscription details from Stripe
      const subscription = await this.stripeService.retrieveSubscription(subscriptionId);
      const userId = subscription.metadata?.userId;
      
      if (!userId) {
        logger.warn('No userId found in subscription metadata:', subscriptionId);
        return;
      }
      
      // Update payment record
      const payment = await this.dataAccess.payments.findByStripeInvoiceId(invoice.id);
      if (payment) {
        await this.updatePayment(payment.payment_id, {
          status: 'completed',
          stripe_invoice_id: invoice.id,
          stripe_payment_intent_id: invoice.payment_intent,
          stripe_charge_id: invoice.charge,
          receipt_url: invoice.hosted_invoice_url
        });
      }
      
      // Update subscription with Stripe data
      await this.dataAccess.subscriptions.updateSubscriptionStripeData(userId, {
        stripe_subscription_id: subscriptionId,
        stripe_status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end
      });
      
      // Allocate monthly tokens for the subscription
      const planId = subscription.metadata?.planId;
      if (planId) {
        const plan = await this.dataAccess.plans.getPlanById(planId);
        if (plan && plan.monthly_tokens > 0) {
          await this.dataAccess.tokens.allocateTokens(userId, plan.monthly_tokens, 'subscription_renewal', {
            planId,
            subscriptionId,
            invoiceId: invoice.id
          });
          
          logger.info(`Allocated ${plan.monthly_tokens} tokens to user ${userId} for subscription renewal`);
        }
      }
      
      logger.info(`Successfully processed invoice payment for user ${userId}, subscription ${subscriptionId}`);
      
    } catch (error) {
      logger.error('Error handling invoice payment succeeded:', error);
      throw error;
    }
  }

  /**
   * Handle Invoice Payment Failed event
   * @param {Object} invoice - The Stripe invoice object.
   */
  async handleInvoicePaymentFailed(invoice) {
    try {
      logger.info('Processing invoice payment failed:', { invoiceId: invoice.id });
  
      // Find the corresponding payment record in our database
      const payment = await this.dataAccess.payments.findByStripeInvoiceId(invoice.id);
  
      if (!payment) {
        logger.warn('No corresponding payment found for failed invoice:', { invoiceId: invoice.id });
        return;
      }
      
      // Update payment record to failed status
      await this.updatePayment(payment.payment_id, {
        status: 'failed',
        stripe_invoice_id: invoice.id,
        failure_reason: 'Invoice payment failed'
      });
      
      logger.info(`Updated payment ${payment.payment_id} to failed status`);
      
    } catch (error) {
      logger.error('Error handling invoice payment failed:', error);
      throw error;
    }
  }

  /**
   * Handle Subscription Updated event
   * @param {Object} subscription - The subscription object
   */
  async handleSubscriptionUpdated(subscription) {
    try {
      logger.info('Processing subscription updated:', subscription.id);
      
      const userId = subscription.metadata?.userId;
      if (!userId) {
        logger.warn('No userId found in subscription metadata:', subscription.id);
        return;
      }

      await this.subscriptionService.updateSubscriptionFromStripeEvent({
        userId,
        stripeSubscription: subscription,
      });

      logger.info(`Delegated subscription update to SubscriptionService for user ${userId}`);
      
    } catch (error) {
      logger.error('Error handling subscription updated:', error);
      throw error;
    }
  }

  /**
   * Handle Subscription Deleted event
   * @param {Object} subscription - The subscription object
   */
  async handleSubscriptionDeleted(subscription) {
    try {
      logger.info('Processing subscription deleted:', subscription.id);
      
      const userId = subscription.metadata?.userId;
      if (!userId) {
        logger.warn('No userId found in subscription metadata:', subscription.id);
        return;
      }
      
      await this.subscriptionService.cancelSubscriptionFromStripeEvent({
        userId,
        stripeSubscription: subscription,
      });

      logger.info(`Delegated subscription deletion to SubscriptionService for user ${userId}`);
      
    } catch (error) {
      logger.error('Error handling subscription deleted:', error);
      throw error;
    }
  }

  /**
   * Get payments that need to be renewed
   * @param {boolean} force - Whether to force renewal regardless of billing period
   * @returns {Promise<Array>} - List of payments that need to be renewed
   */
  async getPaymentsForRenewal(force = false) {
    try {
      logger.info('Getting payments for renewal:', { force });
      
      // Get all payments that have reached their billing period end
      // This now includes all payment statuses (open, completed, failed)
      // and only returns the most recent payment for each active subscription
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
    // Ensure currentEndDate is a Date object
    const endDate = new Date(currentEndDate);
    
    // Start date is the day after the current period ends
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() + 1);
    
    // End date is calculated based on the billing frequency
    const nextEndDate = new Date(startDate);
    
    if (frequency === 'yearly') {
      nextEndDate.setFullYear(nextEndDate.getFullYear() + 1);
    } else {
      // For monthly billing, add one month and subtract one day
      nextEndDate.setMonth(nextEndDate.getMonth() + 1);
      nextEndDate.setDate(nextEndDate.getDate() - 1);
    }
    
    logger.info(`Calculated next billing period: ${startDate.toISOString().split('T')[0]} to ${nextEndDate.toISOString().split('T')[0]}`);
    
    return {
      start: startDate,
      end: nextEndDate
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
        stripe_payment_intent_id: paymentResult.externalId,
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