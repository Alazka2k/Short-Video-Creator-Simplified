/**
 * Stripe Service Utility
 * 
 * This module provides methods for interacting with the Stripe API for payment processing.
 * It handles customer management, payment processing, subscription management, and webhook handling.
 * 
 * Is this files used for the subscription service or only mock prototype?
 */

const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');
const stripe = require('stripe');

class StripeService {
  constructor() {
    this.stripe = null;
    this.webhookSecret = null;
    this.initialized = false;
    this.initialize(); // Initialize on creation
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
      // Initialize with a mock if in development mode
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Using mock Stripe service because: ' + error.message);
        this.setupMockStripe();
        this.initialized = true;
      } else {
        logger.error('Failed to initialize Stripe service:', error);
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
      checkout: {
        sessions: {
          create: async (data) => ({ 
            id: `cs_mock_${Date.now()}`, 
            url: 'https://checkout.stripe.com/mock',
            ...data 
          })
        }
      },
      billingPortal: {
        sessions: {
          create: async (data) => ({ 
            id: `bps_mock_${Date.now()}`, 
            url: 'https://billing.stripe.com/mock',
            ...data 
          })
        }
      },
      invoices: {
        create: async (data) => ({ 
          id: `in_mock_${Date.now()}`, 
          status: 'draft',
          ...data 
        }),
        retrieve: async (id) => ({ 
          id, 
          status: 'paid',
          payment_intent: `pi_mock_${Date.now()}`
        }),
        finalizeInvoice: async (id) => ({ 
          id, 
          status: 'open' 
        })
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
   * Immediately cancels a subscription in Stripe.
   * @param {string} stripeSubscriptionId - The ID of the Stripe subscription to cancel.
   * @returns {Promise<Object>} - The canceled Stripe subscription object.
   */
  async cancelSubscription(stripeSubscriptionId) {
    try {
      logger.info('Canceling Stripe subscription:', { stripeSubscriptionId });
      const cancelledSubscription = await this.stripe.subscriptions.cancel(
        stripeSubscriptionId
      );
      logger.info('Successfully canceled Stripe subscription:', { stripeSubscriptionId });
      return cancelledSubscription;
    } catch (error) {
      logger.error('Error canceling Stripe subscription:', { stripeSubscriptionId, error: error.message });
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
   * Create a Stripe Checkout session for subscriptions or one-time payments
   * @param {Object} sessionData - The checkout session data
   * @returns {Promise<Object>} - The created checkout session
   */
  async createCheckoutSession(sessionData) {
    try {
      if (!this.initialized) await this.initialize();
      
      const {
        customerId,
        priceId,
        successUrl,
        cancelUrl,
        mode = 'subscription', // 'subscription' or 'payment'
        userId,
        planId,
        packageId,
        metadata = {}
      } = sessionData;
      
      const sessionConfig = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planId,
          packageId,
          ...metadata
        }
      };
      
      // Add subscription-specific configuration
      if (mode === 'subscription') {
        sessionConfig.subscription_data = {
          metadata: {
            userId,
            planId
          }
        };
      }
      
      const session = await this.stripe.checkout.sessions.create(sessionConfig);
      
      logger.info(`Checkout session created: ${session.id} for user ${userId}`);
      return session;
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create a Stripe Customer Portal session
   * @param {string} customerId - The Stripe customer ID
   * @param {string} returnUrl - The URL to return to after portal session
   * @returns {Promise<Object>} - The created customer portal session
   */
  async createCustomerPortalSession(customerId, returnUrl) {
    try {
      if (!this.initialized) await this.initialize();
      
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      
      logger.info(`Customer portal session created for customer: ${customerId}`);
      return session;
    } catch (error) {
      logger.error(`Error creating customer portal session for ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve and verify a checkout session from Stripe.
   * @param {string} sessionId - The ID of the Stripe Checkout Session.
   * @returns {Promise<Object>} The Stripe session object with expanded details.
   */
  async verifyCheckoutSession(sessionId) {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required to verify the session.');
      }
      logger.info('Verifying Stripe checkout session:', { sessionId });

      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'payment_intent', 'subscription', 'customer'],
      });

      logger.info('Successfully verified and retrieved Stripe checkout session.', { sessionId });
      return session;
    } catch (error) {
      logger.error('Error verifying Stripe checkout session:', {
        error: error.message,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Retrieve a subscription from Stripe
   * @param {string} subscriptionId - The Stripe subscription ID
   * @returns {Promise<Object>} - The subscription object
   */
  async retrieveSubscription(subscriptionId) {
    try {
      if (!this.initialized) await this.initialize();
      
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice', 'customer', 'items.data.price']
      });
      
      logger.info(`Subscription retrieved: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error(`Error retrieving subscription ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve an invoice from Stripe
   * @param {string} invoiceId - The Stripe invoice ID
   * @returns {Promise<Object>} - The invoice object
   */
  async retrieveInvoice(invoiceId) {
    try {
      if (!this.initialized) await this.initialize();
      
      const invoice = await this.stripe.invoices.retrieve(invoiceId, {
        expand: ['payment_intent', 'subscription', 'customer']
      });
      
      logger.info(`Invoice retrieved: ${invoiceId}`);
      return invoice;
    } catch (error) {
      logger.error(`Error retrieving invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * List customers from Stripe
   * @param {Object} options - Query options (limit, starting_after, etc.)
   * @returns {Promise<Object>} - The list of customers
   */
  async listCustomers(options = {}) {
    try {
      if (!this.initialized) await this.initialize();
      
      const customers = await this.stripe.customers.list({
        limit: options.limit || 100,
        starting_after: options.starting_after,
        ending_before: options.ending_before,
        email: options.email
      });
      
      logger.info(`Listed ${customers.data.length} customers`);
      return customers;
    } catch (error) {
      logger.error('Error listing customers:', error);
      throw error;
    }
  }

  /**
   * Retrieve a customer from Stripe
   * @param {string} customerId - The Stripe customer ID
   * @returns {Promise<Object>} - The customer object
   */
  async retrieveCustomer(customerId) {
    try {
      if (!this.initialized) await this.initialize();
      
      const customer = await this.stripe.customers.retrieve(customerId);
      
      logger.info(`Customer retrieved: ${customerId}`);
      return customer;
    } catch (error) {
      logger.error(`Error retrieving customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Create an invoice for a customer
   * @param {Object} invoiceData - The invoice data
   * @returns {Promise<Object>} - The created invoice
   */
  async createInvoice(invoiceData) {
    try {
      if (!this.initialized) await this.initialize();
      
      const {
        customerId,
        subscriptionId,
        description,
        metadata = {},
        autoAdvance = true
      } = invoiceData;
      
      const invoice = await this.stripe.invoices.create({
        customer: customerId,
        subscription: subscriptionId,
        description,
        metadata,
        auto_advance: autoAdvance
      });
      
      logger.info(`Invoice created: ${invoice.id}`);
      return invoice;
    } catch (error) {
      logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Finalize an invoice (make it payable)
   * @param {string} invoiceId - The Stripe invoice ID
   * @returns {Promise<Object>} - The finalized invoice
   */
  async finalizeInvoice(invoiceId) {
    try {
      if (!this.initialized) await this.initialize();
      
      const invoice = await this.stripe.invoices.finalizeInvoice(invoiceId);
      
      logger.info(`Invoice finalized: ${invoiceId}`);
      return invoice;
    } catch (error) {
      logger.error(`Error finalizing invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * Construct a Stripe event from webhook payload
   * @param {Buffer} payload - The raw request body buffer
   * @param {string} signature - The Stripe signature from request headers
   * @returns {Object} - The constructed Stripe event
   */
  constructEvent(payload, signature) {
    try {
      if (!this.initialized) {
        throw new Error('Stripe service not initialized');
      }
      
      if (!this.webhookSecret) {
        // Enforce webhook secret existence in all environments for security.
        logger.error('Stripe webhook secret is not set.');
        throw new Error('Webhook secret is not configured. Cannot verify webhook signature.');
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

const stripeService = new StripeService();
module.exports = stripeService; 