/**
 * Stripe Service Utility
 * 
 * This module provides methods for interacting with the Stripe API for payment processing.
 * It handles customer management, payment processing, subscription management, and webhook handling.
 */

const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');
const stripe = require('stripe');

class StripeService {
  constructor() {
    this.stripe = null;
    this.webhookSecret = null;
    this.initialized = false;
  }

  /**
   * Initialize the Stripe service with API keys and settings
   */
  async initialize() {
    try {
      logger.info('Initializing Stripe service');
      
      const apiKey = process.env.STRIPE_API_KEY || (config.stripe && config.stripe.apiKey);
      if (!apiKey) {
        logger.warn('Stripe API key not found. Running in test mode.');
        // Use Stripe's test mode API key for development
        this.stripe = stripe('sk_test_51TestKey');
      } else {
        this.stripe = stripe(apiKey);
      }
      
      this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || (config.stripe && config.stripe.webhookSecret);
      
      // Test the Stripe connection
      await this.stripe.paymentMethods.list({ limit: 1 });
      
      this.initialized = true;
      logger.info('Stripe service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Stripe service:', error);
      // Initialize with a mock if in development mode
      if (process.env.NODE_ENV === 'development') {
        logger.info('Setting up mock Stripe service for development');
        this.setupMockStripe();
        this.initialized = true;
      } else {
        throw error;
      }
    }
  }

  /**
   * Setup a mock Stripe service for development
   */
  setupMockStripe() {
    this.stripe = {
      // Mock implementations of Stripe methods
      customers: {
        create: async (data) => ({ id: `cus_mock_${Date.now()}`, ...data }),
        update: async (id, data) => ({ id, ...data }),
        retrieve: async (id) => ({ id, email: 'mock@example.com' })
      },
      paymentMethods: {
        attach: async (id, data) => ({ id, ...data }),
        list: async (params) => ({ data: [] })
      },
      paymentIntents: {
        create: async (data) => ({ 
          id: `pi_mock_${Date.now()}`, 
          status: 'succeeded',
          ...data 
        }),
        confirm: async (id) => ({ id, status: 'succeeded' }),
        retrieve: async (id) => ({ id, status: 'succeeded' })
      },
      subscriptions: {
        create: async (data) => ({ 
          id: `sub_mock_${Date.now()}`, 
          status: 'active',
          ...data 
        }),
        update: async (id, data) => ({ id, status: 'active', ...data }),
        del: async (id) => ({ id, status: 'canceled' })
      },
      products: {
        create: async (data) => ({ id: `prod_mock_${Date.now()}`, ...data })
      },
      prices: {
        create: async (data) => ({ id: `price_mock_${Date.now()}`, ...data })
      },
      webhooks: {
        constructEvent: (payload, signature, secret) => ({
          type: 'mock.event',
          data: { object: JSON.parse(payload) }
        })
      }
    };
    
    logger.info('Mock Stripe service set up for development');
  }

  /**
   * Create or retrieve a Stripe customer
   * @param {string} userId - The user ID
   * @param {string} email - The user's email
   * @param {string} name - The user's name
   * @returns {Promise<Object>} - The Stripe customer object
   */
  async createOrUpdateCustomer(userId, email, name) {
    try {
      if (!this.initialized) await this.initialize();
      
      // Check if customer already exists in our database
      // This would typically involve a database lookup with the userId
      // For now, we'll just try to create a new customer each time
      
      const customerData = {
        email,
        name,
        metadata: {
          userId
        }
      };
      
      // In a real implementation, we would look up the existing Stripe customer ID first
      // For this MVP, we'll just create a new customer each time
      const customer = await this.stripe.customers.create(customerData);
      
      logger.info(`Customer created/updated: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error(`Error creating/updating customer for userId ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Attach a payment method to a customer
   * @param {string} customerId - The Stripe customer ID
   * @param {string} paymentMethodId - The Stripe payment method ID
   * @returns {Promise<Object>} - The attached payment method
   */
  async attachPaymentMethod(customerId, paymentMethodId) {
    try {
      if (!this.initialized) await this.initialize();
      
      // Attach the payment method to the customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      
      // Set as the default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      logger.info(`Payment method ${paymentMethodId} attached to customer ${customerId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error attaching payment method ${paymentMethodId} to customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Create a one-time payment
   * @param {Object} paymentData - The payment data
   * @returns {Promise<Object>} - The payment result
   */
  async createPayment(paymentData) {
    try {
      if (!this.initialized) await this.initialize();
      
      const { amount, currency, paymentMethod, description, userId, metadata } = paymentData;
      
      // Create a PaymentIntent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe requires amount in cents
        currency: currency || 'eur',
        payment_method: paymentMethod,
        confirmation_method: 'automatic',
        confirm: true,
        description,
        metadata: {
          userId,
          ...metadata
        }
      });
      
      // Check if payment succeeded
      if (paymentIntent.status === 'succeeded') {
        logger.info(`Payment succeeded: ${paymentIntent.id}`);
        return paymentIntent;
      } else {
        throw new Error(`Payment status is ${paymentIntent.status}`);
      }
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Create a subscription
   * @param {Object} subscriptionData - The subscription data
   * @returns {Promise<Object>} - The created subscription
   */
  async createSubscription(subscriptionData) {
    try {
      if (!this.initialized) await this.initialize();
      
      const { 
        customerId, 
        priceId, 
        paymentMethodId,
        userId,
        planId,
        billingFrequency
      } = subscriptionData;
      
      // Make sure the price exists or create it if needed
      // In a production system, you would create products and prices
      // ahead of time through the Stripe dashboard or API
      
      // For the MVP, we'll assume the price exists and is provided
      // or we'll use a mock price
      let stripePriceId = priceId;
      
      if (!stripePriceId && process.env.NODE_ENV === 'development') {
        // Create a mock product and price for development
        const product = await this.stripe.products.create({
          name: `Plan ${planId}`,
          metadata: {
            planId
          }
        });
        
        const price = await this.stripe.prices.create({
          product: product.id,
          unit_amount: subscriptionData.amount ? Math.round(subscriptionData.amount * 100) : 1999,
          currency: 'eur',
          recurring: {
            interval: billingFrequency === 'yearly' ? 'year' : 'month'
          },
          metadata: {
            planId
          }
        });
        
        stripePriceId = price.id;
      }
      
      if (!stripePriceId) {
        throw new Error('Price ID is required for creating a subscription');
      }
      
      // Create the subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: stripePriceId,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          planId
        }
      });
      
      logger.info(`Subscription created: ${subscription.id}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - The Stripe subscription ID
   * @returns {Promise<Object>} - The cancelled subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      if (!this.initialized) await this.initialize();
      
      const subscription = await this.stripe.subscriptions.del(subscriptionId);
      
      logger.info(`Subscription cancelled: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error(`Error cancelling subscription ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Update a subscription
   * @param {string} subscriptionId - The Stripe subscription ID
   * @param {Object} updateData - The update data
   * @returns {Promise<Object>} - The updated subscription
   */
  async updateSubscription(subscriptionId, updateData) {
    try {
      if (!this.initialized) await this.initialize();
      
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        updateData
      );
      
      logger.info(`Subscription updated: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error(`Error updating subscription ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Construct a Stripe event from webhook payload
   * @param {string} payload - The raw request body
   * @param {string} signature - The Stripe signature from request headers
   * @returns {Promise<Object>} - The constructed Stripe event
   */
  async constructEvent(payload, signature) {
    try {
      if (!this.initialized) await this.initialize();
      
      if (!this.webhookSecret) {
        logger.warn('Webhook secret not found. Unable to verify Stripe webhook signature.');
        
        // For development, just parse the payload
        if (process.env.NODE_ENV === 'development') {
          return { 
            type: JSON.parse(payload).type,
            data: { object: JSON.parse(payload).data.object }
          };
        } else {
          throw new Error('Webhook secret not configured');
        }
      }
      
      // Verify and construct the event
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      
      logger.info(`Webhook event verified: ${event.type}`);
      return event;
    } catch (error) {
      logger.error('Error constructing Stripe event:', error);
      throw error;
    }
  }
}

module.exports = new StripeService(); 