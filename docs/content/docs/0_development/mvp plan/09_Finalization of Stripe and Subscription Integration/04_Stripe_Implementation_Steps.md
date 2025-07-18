# Stripe Implementation Steps (Updated)

This document outlines the step-by-step implementation plan for integrating Stripe into our existing comprehensive subscription system. Based on architecture analysis, we will **enhance the current subscription service** with full Stripe integration while preserving existing business logic and data structures.

## Architecture Decision Summary

**✅ Enhance Subscription Service (Not Create Separate Payment Service)**

**Rationale:**
- Existing Stripe utilities already in `subscription-service/utils/stripeService.js`
- Webhook handling already in `subscription-service/controllers/webhookController.js`  
- Payment logic already in `subscription-service/services/paymentService.js`
- Database schema already enhanced with Stripe price IDs
- Tight coupling between payment and subscription logic
- Reduced complexity by avoiding inter-service communication

## Current Status

### ✅ Already Completed:
- Stripe products and prices created manually in dashboard
- Test API keys configured in MCP
- Database migration with Stripe price IDs applied
- Basic Stripe service utilities implemented
- Webhook controller structure exists
- Payment service foundation implemented
- Add additional database fields for Stripe customer/subscription tracking

### 🔄 Next Steps:

- Enhance existing services with full Stripe integration for deductio of tokens.
- Create checkout controller and routes
- Implement frontend Stripe components
- Complete webhook event handling

## Phase 1: Backend Core Enhancement (Days 1-4)

### 1.1 Additional Database Schema Migration

Create `database/migrations/20250620000002_add_stripe_customer_fields.js`:

```javascript
/**
 * Migration: Add Stripe Customer and Subscription Fields
 * Adds tracking fields for Stripe customers, subscriptions, and webhook events
 */

exports.up = async function(knex) {
  console.log('Adding Stripe customer and subscription tracking fields...');
  
  // Add stripe_customer_id to users table
  await knex.schema.alterTable('users', function(table) {
    table.string('stripe_customer_id', 255).nullable()
      .comment('Stripe Customer ID for payment processing');
    table.index('stripe_customer_id', 'idx_users_stripe_customer_id');
  });
  
  // Add Stripe subscription fields to user_subscriptions table
  await knex.schema.alterTable('user_subscriptions', function(table) {
    table.string('stripe_subscription_id', 255).nullable()
      .comment('Stripe Subscription ID for billing management');
    table.string('stripe_status', 50).nullable()
      .comment('Stripe subscription status (active, past_due, canceled, etc.)');
    table.boolean('cancel_at_period_end').defaultTo(false)
      .comment('Whether subscription will cancel at period end');
    table.timestamp('current_period_start').nullable()
      .comment('Current billing period start date from Stripe');
    table.timestamp('current_period_end').nullable()
      .comment('Current billing period end date from Stripe');
    
    table.index('stripe_subscription_id', 'idx_user_subscriptions_stripe_subscription_id');
  });
  
  // Add Stripe payment fields to payments table
  await knex.schema.alterTable('payments', function(table) {
    table.string('stripe_payment_intent_id', 255).nullable()
      .comment('Stripe PaymentIntent ID for one-time payments');
    table.string('stripe_invoice_id', 255).nullable()
      .comment('Stripe Invoice ID for subscription payments');
    table.string('stripe_charge_id', 255).nullable()
      .comment('Stripe Charge ID for completed payments');
    table.jsonb('payment_method_details').nullable()
      .comment('Payment method details (card brand, last4, etc.)');
    table.string('receipt_url', 500).nullable()
      .comment('Stripe receipt URL for customer access');
    
    table.index('stripe_payment_intent_id', 'idx_payments_stripe_payment_intent_id');
    table.index('stripe_invoice_id', 'idx_payments_stripe_invoice_id');
  });
  
  // Create webhook_events table for idempotency
  await knex.schema.createTable('webhook_events', function(table) {
    table.string('event_id', 255).primary()
      .comment('Stripe event ID for idempotency');
    table.string('event_type', 100).notNullable()
      .comment('Type of Stripe event');
    table.timestamp('received_at').defaultTo(knex.fn.now())
      .comment('When the webhook was received');
    table.timestamp('processed_at').nullable()
      .comment('When the webhook was successfully processed');
    table.integer('processing_attempts').defaultTo(0)
      .comment('Number of processing attempts');
    table.text('last_error').nullable()
      .comment('Last error message if processing failed');
    table.jsonb('event_data').nullable()
      .comment('Full event data for debugging');
      
    table.index('event_type', 'idx_webhook_events_event_type');
    table.index('received_at', 'idx_webhook_events_received_at');
  });
};

exports.down = async function(knex) {
  // Rollback in reverse order
  await knex.schema.dropTableIfExists('webhook_events');
  
  await knex.schema.alterTable('payments', function(table) {
    table.dropIndex('stripe_payment_intent_id', 'idx_payments_stripe_payment_intent_id');
    table.dropIndex('stripe_invoice_id', 'idx_payments_stripe_invoice_id');
    table.dropColumn('stripe_payment_intent_id');
    table.dropColumn('stripe_invoice_id');
    table.dropColumn('stripe_charge_id');
    table.dropColumn('payment_method_details');
    table.dropColumn('receipt_url');
  });
  
  await knex.schema.alterTable('user_subscriptions', function(table) {
    table.dropIndex('stripe_subscription_id', 'idx_user_subscriptions_stripe_subscription_id');
    table.dropColumn('stripe_subscription_id');
    table.dropColumn('stripe_status');
    table.dropColumn('cancel_at_period_end');
    table.dropColumn('current_period_start');
    table.dropColumn('current_period_end');
  });
  
  await knex.schema.alterTable('users', function(table) {
    table.dropIndex('stripe_customer_id', 'idx_users_stripe_customer_id');
    table.dropColumn('stripe_customer_id');
  });
};
```

### 1.2 Enhanced StripeService

Update `backend/services/subscription-service/utils/stripeService.js` with additional methods:

```javascript
// Add these methods to the existing StripeService class:

/**
 * Create Stripe Checkout Session
 */
async createCheckoutSession({
  priceId,
  customerId,
  customerEmail,
  mode = 'subscription', // 'subscription' or 'payment'
  successUrl,
  cancelUrl,
  metadata = {}
}) {
  try {
    const sessionConfig = {
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    };

    // Add customer info
    if (customerId) {
      sessionConfig.customer = customerId;
    } else if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    // Add subscription-specific config
    if (mode === 'subscription') {
      sessionConfig.subscription_data = {
        metadata
      };
    }

    const session = await this.stripe.checkout.sessions.create(sessionConfig);
    logger.info('Created checkout session:', { sessionId: session.id, mode, priceId });
    return session;
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create Customer Portal Session
 */
async createCustomerPortalSession(customerId, returnUrl) {
  try {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    logger.info('Created customer portal session:', { customerId, sessionId: session.id });
    return session;
  } catch (error) {
    logger.error('Error creating customer portal session:', error);
    throw error;
  }
}

/**
 * Retrieve Stripe Subscription
 */
async retrieveSubscription(subscriptionId) {
  try {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    logger.error('Error retrieving subscription:', error);
    throw error;
  }
}

/**
 * Retrieve Stripe Invoice
 */
async retrieveInvoice(invoiceId) {
  try {
    return await this.stripe.invoices.retrieve(invoiceId);
  } catch (error) {
    logger.error('Error retrieving invoice:', error);
    throw error;
  }
}

/**
 * Construct webhook event with signature verification
 */
constructEvent(payload, signature) {
  try {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    logger.error('Error constructing webhook event:', error);
    throw error;
  }
}
```

### 1.3 Create CheckoutController

Create `backend/services/subscription-service/controllers/checkoutController.js`:

```javascript
/**
 * Checkout Controller
 * Handles Stripe Checkout session creation and customer portal access
 */
const logger = require('../../../shared/utils/logger');

class CheckoutController {
  constructor(stripeService, subscriptionService, userService) {
    this.stripeService = stripeService;
    this.subscriptionService = subscriptionService;
    this.userService = userService;
  }

  /**
   * Create Stripe Checkout Session
   */
  async createCheckoutSession(req, res) {
    try {
      const { type, priceId, packageId } = req.body;
      const userId = req.user?.userId; // From auth middleware
      
      if (!['subscription', 'token_package'].includes(type)) {
        return res.status(400).json({ error: 'Invalid checkout type' });
      }

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      // Get user details
      const user = await this.userService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create or get Stripe customer
      let customerId = user.stripe_customer_id;
      if (!customerId) {
        const customer = await this.stripeService.createOrUpdateCustomer(
          userId, 
          user.email, 
          user.name || user.username
        );
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await this.userService.updateUserStripeCustomerId(userId, customerId);
      }

      // Create checkout session
      const session = await this.stripeService.createCheckoutSession({
        priceId,
        customerId,
        mode: type === 'subscription' ? 'subscription' : 'payment',
        successUrl: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.FRONTEND_URL}/pricing?cancelled=true`,
        metadata: {
          userId: userId.toString(),
          type,
          ...(packageId && { packageId: packageId.toString() })
        }
      });

      logger.info('Checkout session created:', {
        userId,
        type,
        priceId,
        sessionId: session.id
      });

      res.json({ 
        sessionUrl: session.url,
        sessionId: session.id 
      });
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      res.status(500).json({ 
        error: 'Failed to create checkout session',
        message: error.message 
      });
    }
  }

  /**
   * Create Customer Portal Session
   */
  async createPortalSession(req, res) {
    try {
      const { returnUrl } = req.body;
      const userId = req.user?.userId; // From auth middleware

      const user = await this.userService.getUserById(userId);
      if (!user || !user.stripe_customer_id) {
        return res.status(404).json({ 
          error: 'User not found or no Stripe customer ID' 
        });
      }

      const session = await this.stripeService.createCustomerPortalSession(
        user.stripe_customer_id,
        returnUrl || `${process.env.FRONTEND_URL}/subscription`
      );

      logger.info('Customer portal session created:', {
        userId,
        customerId: user.stripe_customer_id,
        sessionId: session.id
      });

      res.json({ 
        sessionUrl: session.url,
        sessionId: session.id 
      });
    } catch (error) {
      logger.error('Error creating portal session:', error);
      res.status(500).json({ 
        error: 'Failed to create portal session',
        message: error.message 
      });
    }
  }
}

module.exports = CheckoutController;
```

### 1.4 Enhanced WebhookController

Update `backend/services/subscription-service/controllers/webhookController.js` with complete event handling:

```javascript
// Add these methods to the existing WebhookController class:

/**
 * Enhanced webhook handler with idempotency
 */
async handleStripeWebhook(req, res) {
  try {
    const payload = req.body;
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      logger.warn('Missing Stripe signature');
      return res.status(400).json({ error: 'Missing Stripe signature' });
    }
    
    const event = this.stripeService.constructEvent(payload, signature);
    
    // Check if event already processed (idempotency)
    const existingEvent = await this.checkEventIdempotency(event.id);
    if (existingEvent && existingEvent.processed_at) {
      logger.info('Event already processed:', { eventId: event.id });
      return res.json({ 
        received: true, 
        id: event.id, 
        status: 'already_processed' 
      });
    }
    
    // Record event receipt
    await this.recordWebhookEvent(event);
    
    // Process event based on type
    try {
      await this.processWebhookEvent(event);
      
      // Mark as processed
      await this.markEventProcessed(event.id);
      
      logger.info('Processed Stripe webhook event:', { 
        type: event.type, 
        id: event.id 
      });
      
      res.json({ 
        received: true, 
        id: event.id, 
        status: 'processed' 
      });
    } catch (processingError) {
      // Record processing error
      await this.recordEventError(event.id, processingError.message);
      throw processingError;
    }
  } catch (error) {
    logger.error('Error handling Stripe webhook:', error);
    return res.status(400).json({ 
      error: 'Webhook error', 
      details: error.message 
    });
  }
}

/**
 * Process webhook event based on type
 */
async processWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await this.handleCheckoutSessionCompleted(event.data.object);
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
    case 'payment_intent.succeeded':
      await this.handlePaymentIntentSucceeded(event.data.object);
      break;
    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Handle checkout session completed
 */
async handleCheckoutSessionCompleted(session) {
  const { metadata } = session;
  const { userId, type, packageId } = metadata;

  logger.info('Processing checkout session completed:', {
    sessionId: session.id,
    userId,
    type,
    packageId
  });

  if (type === 'subscription') {
    // Handle subscription signup
    const subscription = await this.stripeService.retrieveSubscription(session.subscription);
    await this.subscriptionService.createSubscriptionFromStripe(userId, subscription);
  } else if (type === 'token_package') {
    // Handle token package purchase
    await this.paymentService.handleTokenPackagePurchase(userId, packageId, session);
  }
}

/**
 * Handle invoice payment succeeded
 */
async handleInvoicePaymentSucceeded(invoice) {
  logger.info('Processing invoice payment succeeded:', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    amount: invoice.amount_paid
  });

  // Update payment record and trigger token allocation
  await this.paymentService.handleStripeInvoicePaid(invoice);
}

/**
 * Handle invoice payment failed
 */
async handleInvoicePaymentFailed(invoice) {
  logger.warn('Processing invoice payment failed:', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    attemptCount: invoice.attempt_count
  });

  await this.paymentService.handleStripeInvoicePaymentFailed(invoice);
}

/**
 * Handle subscription updated
 */
async handleSubscriptionUpdated(subscription) {
  logger.info('Processing subscription updated:', {
    subscriptionId: subscription.id,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  });

  await this.subscriptionService.syncSubscriptionFromStripe(subscription);
}

/**
 * Handle subscription deleted
 */
async handleSubscriptionDeleted(subscription) {
  logger.info('Processing subscription deleted:', {
    subscriptionId: subscription.id,
    customerId: subscription.customer
  });

  await this.subscriptionService.handleStripeSubscriptionCancellation(subscription);
}

// Idempotency helper methods
async checkEventIdempotency(eventId) {
  // Implementation depends on your database layer
  // Return existing event record if found
}

async recordWebhookEvent(event) {
  // Record the webhook event for idempotency and debugging
}

async markEventProcessed(eventId) {
  // Mark event as successfully processed
}

async recordEventError(eventId, errorMessage) {
  // Record processing error for retry logic
}
```

### 1.5 Add Checkout Routes

Create `backend/services/subscription-service/routes/checkoutRoutes.js`:

```javascript
/**
 * Checkout Routes
 * Handles Stripe checkout and customer portal endpoints
 */
const express = require('express');
const router = express.Router();

module.exports = (checkoutController, authMiddleware) => {
  /**
   * @route POST /checkout/create-session
   * @description Create Stripe checkout session for subscriptions or token packages
   * @access Private
   */
  router.post('/create-session', 
    authMiddleware,
    checkoutController.createCheckoutSession.bind(checkoutController)
  );

  /**
   * @route POST /portal/create-session  
   * @description Create customer portal session for subscription management
   * @access Private
   */
  router.post('/portal/create-session',
    authMiddleware,
    checkoutController.createPortalSession.bind(checkoutController)
  );

  return router;
};
```

### 1.6 Update Webhook Routes

Update `backend/services/subscription-service/routes/webhookRoutes.js` to use raw body parser:

```javascript
// Update the webhook route to handle raw body for signature verification
const express = require('express');
const router = express.Router();

module.exports = (webhookController) => {
  /**
   * @route POST /webhooks/stripe
   * @description Handle Stripe webhook events
   * @access Public (but signature verified)
   */
  router.post('/stripe',
    express.raw({ type: 'application/json' }), // Raw body for signature verification
    webhookController.handleStripeWebhook.bind(webhookController)
  );

  return router;
};
```

### 1.7 Update Service Server Configuration

Update `backend/services/subscription-service/server.js`:

```javascript
// Add to existing server.js:
const checkoutRoutes = require('./routes/checkoutRoutes');

// In createServer function, add the checkout routes:
function createServer(controllers) {
  const app = express();
  
  // Existing middleware...
  
  // Add checkout routes with authentication
  app.use('/checkout', checkoutRoutes(
    controllers.checkoutController, 
    controllers.authMiddleware
  ));
  
  // Existing routes...
  
  return app;
}
```

### 1.8 Update Service Index

Update `backend/services/subscription-service/index.js`:

```javascript
// Add to existing index.js:
const CheckoutController = require('./controllers/checkoutController');

// In startServer function:
async function startServer() {
  // ... existing initialization
  
  const checkoutController = new CheckoutController(
    stripeService, 
    subscriptionService, 
    userService
  );

  // Add to controllers object:
  const controllers = {
    // ... existing controllers
    checkoutController,
    // ... rest
  };

  const app = server.createServer(controllers);
  
  // ... rest of function
}
```

## Phase 2: Frontend Integration (Days 5-7)

### 2.1 Install Stripe.js

```bash
cd frontend
npm install @stripe/stripe-js
```

### 2.2 Environment Configuration

Add to `frontend/.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 2.3 Create Stripe Checkout Button Component

Create `frontend/src/components/stripe/StripeCheckoutButton.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface StripeCheckoutButtonProps {
  priceId: string;
  type: 'subscription' | 'token_package';
  packageId?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export function StripeCheckoutButton({
  priceId,
  type,
  packageId,
  children,
  className,
  disabled,
  variant = 'default'
}: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/subscription/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          priceId,
          ...(packageId && { packageId })
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const { sessionUrl } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = sessionUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      // TODO: Add toast notification for error
      alert(`Checkout failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={className}
      variant={variant}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
```

### 2.4 Create Customer Portal Button Component

Create `frontend/src/components/stripe/CustomerPortalButton.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Loader2 } from 'lucide-react';

interface CustomerPortalButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export function CustomerPortalButton({ 
  className, 
  children,
  variant = 'outline'
}: CustomerPortalButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePortalAccess = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/subscription/portal/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create portal session');
      }

      const { sessionUrl } = await response.json();
      
      // Redirect to Stripe Customer Portal
      window.location.href = sessionUrl;
    } catch (error) {
      console.error('Portal access error:', error);
      // TODO: Add toast notification for error
      alert(`Portal access failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePortalAccess}
      disabled={loading}
      className={className}
      variant={variant}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Settings className="mr-2 h-4 w-4" />
          {children || 'Manage Billing'}
        </>
      )}
    </Button>
  );
}
```

### 2.5 Update Pricing Page

Update `frontend/src/app/pricing/page.tsx` to integrate Stripe checkout:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { StripeCheckoutButton } from '@/components/stripe/StripeCheckoutButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';

interface Plan {
  plan_id: number;
  plan_name: string;
  billing_frequency: string;
  price: number;
  monthly_token_allocation: number;
  stripe_price_id: string;
  marketing_description: any;
}

interface TokenPackage {
  package_id: number;
  package_name: string;
  token_allocation: number;
  price: number;
  stripe_price_id: string;
  marketing_description: any;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansResponse, packagesResponse] = await Promise.all([
          fetch('/api/subscription/plans'),
          fetch('/api/subscription/token-packages')
        ]);

        if (!plansResponse.ok || !packagesResponse.ok) {
          throw new Error('Failed to fetch pricing data');
        }

        const plansData = await plansResponse.json();
        const packagesData = await packagesResponse.json();

        setPlans(plansData);
        setTokenPackages(packagesData);
      } catch (error) {
        console.error('Error fetching pricing data:', error);
        setError('Failed to load pricing information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading pricing information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  // Group plans by tier and frequency
  const groupedPlans = plans.reduce((acc, plan) => {
    const tier = plan.plan_name;
    if (!acc[tier]) acc[tier] = {};
    acc[tier][plan.billing_frequency] = plan;
    return acc;
  }, {} as Record<string, Record<string, Plan>>);

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start creating amazing content with our AI-powered platform. 
          Choose the plan that fits your needs.
        </p>
      </div>

      {/* Subscription Plans */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {Object.entries(groupedPlans).map(([tierName, frequencies]) => {
          const monthlyPlan = frequencies.monthly;
          const yearlyPlan = frequencies.yearly;
          
          if (!monthlyPlan) return null;

          const isPopular = tierName === 'Creator Tier';
          const yearlyDiscount = yearlyPlan ? 
            Math.round((1 - (yearlyPlan.price / (monthlyPlan.price * 12))) * 100) : 0;

          return (
            <Card key={tierName} className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{tierName}</CardTitle>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">
                    €{monthlyPlan.price}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  {yearlyPlan && yearlyDiscount > 0 && (
                    <div className="text-sm text-green-600">
                      Save {yearlyDiscount}% with yearly billing
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="font-medium">
                      {monthlyPlan.monthly_token_allocation.toLocaleString()} tokens/month
                    </span>
                  </div>
                  
                  {monthlyPlan.marketing_description?.features?.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Buttons */}
                <div className="space-y-3">
                  <StripeCheckoutButton
                    priceId={monthlyPlan.stripe_price_id}
                    type="subscription"
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    Start Monthly Plan
                  </StripeCheckoutButton>
                  
                  {yearlyPlan && (
                    <StripeCheckoutButton
                      priceId={yearlyPlan.stripe_price_id}
                      type="subscription"
                      className="w-full"
                      variant="outline"
                    >
                      Start Yearly Plan (Save {yearlyDiscount}%)
                    </StripeCheckoutButton>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Token Packages */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Need More Tokens?</h2>
        <p className="text-lg text-muted-foreground">
          Purchase additional tokens that never expire. Perfect for occasional use or extra projects.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {tokenPackages.map((pkg) => {
          const pricePerThousand = (pkg.price / pkg.token_allocation * 1000);
          
          return (
            <Card key={pkg.package_id} className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">{pkg.package_name}</CardTitle>
                <div className="text-2xl font-bold text-primary">€{pkg.price}</div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <div className="text-lg font-semibold">
                    {pkg.token_allocation.toLocaleString()} tokens
                  </div>
                  <div className="text-sm text-muted-foreground">
                    €{pricePerThousand.toFixed(2)} per 1,000 tokens
                  </div>
                </div>
                
                {pkg.marketing_description?.features && (
                  <div className="space-y-1">
                    {pkg.marketing_description.features.map((feature: string, index: number) => (
                      <div key={index} className="text-xs text-muted-foreground">
                        {feature}
                      </div>
                    ))}
                  </div>
                )}
                
                <StripeCheckoutButton
                  priceId={pkg.stripe_price_id}
                  type="token_package"
                  packageId={pkg.package_id.toString()}
                  className="w-full"
                >
                  Purchase Tokens
                </StripeCheckoutButton>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          All plans include a 14-day free trial. Cancel anytime. 
          Questions? <a href="/contact" className="text-primary hover:underline">Contact us</a>
        </p>
      </div>
    </div>
  );
}
```

### 2.6 Update Subscription Management Page

Update `frontend/src/app/(dashboard)/subscription/page.tsx`:

```typescript
// Add the CustomerPortalButton to the existing subscription page
import { CustomerPortalButton } from '@/components/stripe/CustomerPortalButton';

// In the subscription management section, add:
<div className="flex gap-4 mt-6">
  <Button className="bg-primary/80 hover:bg-primary">
    Change Plan
  </Button>
  <CustomerPortalButton>
    Manage Billing & Payment Methods
  </CustomerPortalButton>
</div>
```

### 2.7 Create Success/Cancel Pages

Create `frontend/src/app/payment-success/page.tsx`:

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="container mx-auto py-16">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for your payment. Your subscription is now active and tokens 
            will be allocated shortly.
          </p>
          {sessionId && (
            <p className="text-xs text-muted-foreground">
              Session ID: {sessionId}
            </p>
          )}
          <div className="space-y-2">
            <Link href="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
            <Link href="/subscription">
              <Button variant="outline" className="w-full">
                View Subscription Details
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

Create `frontend/src/app/payment-cancelled/page.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelledPage() {
  return (
    <div className="container mx-auto py-16">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-orange-600">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your payment was cancelled. No charges were made to your account.
          </p>
          <div className="space-y-2">
            <Link href="/pricing">
              <Button className="w-full">Back to Pricing</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Phase 3: Batch Job Enhancement (Days 6-7)

### 3.1 Enhanced CreatePaymentsBatch

**Purpose**: Replace local payment creation with Stripe invoice generation while maintaining billing period tracking.

**Current Implementation**: `backend/batches/batch-jobs/CreatePaymentsBatch.js`

**Key Changes (Pseudocode)**:
```javascript
class CreatePaymentsBatch {
  async execute(options = {}) {
    // 1. Fetch subscriptions approaching billing period end (existing logic)
    const subscriptionsForRenewal = await this.fetchSubscriptionsForRenewal();
    
    for (const subscription of subscriptionsForRenewal) {
      // 2. Instead of creating local payment record, create Stripe invoice
      const stripeInvoice = await stripeService.createInvoiceForSubscription({
        customerId: subscription.stripe_customer_id,
        subscriptionId: subscription.stripe_subscription_id,
        billingPeriodStart: subscription.next_billing_period_start,
        billingPeriodEnd: subscription.next_billing_period_end
      });
      
      // 3. Create local payment record linked to Stripe invoice
      await paymentsDataAccess.createPayment({
        user_id: subscription.user_id,
        subscription_id: subscription.subscription_id,
        stripe_invoice_id: stripeInvoice.id,
        status: 'pending', // Will be updated by webhook
        billing_period_start: subscription.next_billing_period_start,
        billing_period_end: subscription.next_billing_period_end
      });
    }
  }
}
```

### 3.2 Enhanced CollectPaymentsBatch

**Purpose**: Monitor Stripe payment status and sync to local database instead of manual collection.

**Current Implementation**: `backend/batches/batch-jobs/CollectPaymentsBatch.js`

**Key Changes (Pseudocode)**:
```javascript
class CollectPaymentsBatch {
  async execute(options = {}) {
    // 1. Fetch payments with Stripe invoice IDs that need status sync
    const paymentsToSync = await this.fetchPaymentsNeedingSync();
    
    for (const payment of paymentsToSync) {
      // 2. Get current status from Stripe
      const stripeInvoice = await stripeService.retrieveInvoice(payment.stripe_invoice_id);
      
      // 3. Update local payment status based on Stripe status
      await paymentsDataAccess.updatePayment(payment.payment_id, {
        status: this.mapStripeStatusToLocal(stripeInvoice.status),
        stripe_charge_id: stripeInvoice.charge,
        payment_date: stripeInvoice.status_transitions.paid_at,
        receipt_url: stripeInvoice.hosted_invoice_url
      });
      
      // 4. If payment succeeded, trigger subscription renewal
      if (stripeInvoice.status === 'paid') {
        await this.triggerSubscriptionRenewal(payment.subscription_id);
      }
    }
  }
}
```

### 3.3 Enhanced SubscriptionRenewalsBatch

**Purpose**: Token allocation triggered by Stripe webhook events instead of local payment completion.

**Current Implementation**: `backend/batches/batch-jobs/SubscriptionRenewalsBatch.js`

**Key Changes (Pseudocode)**:
```javascript
class SubscriptionRenewalsBatch {
  async execute(options = {}) {
    // 1. Fetch subscriptions with successful Stripe payments needing token allocation
    const subscriptionsForRenewal = await this.fetchSubscriptionsWithPaidInvoices();
    
    for (const subscription of subscriptionsForRenewal) {
      // 2. Get Stripe subscription for current period info
      const stripeSubscription = await stripeService.retrieveSubscription(
        subscription.stripe_subscription_id
      );
      
      // 3. Update local subscription periods based on Stripe data
      await subscriptionsDataAccess.updateSubscription(subscription.subscription_id, {
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        stripe_status: stripeSubscription.status
      });
      
      // 4. Allocate tokens (existing business logic preserved)
      await tokenService.allocateMonthlyTokens(subscription.user_id, subscription.plan_id);
    }
  }
}
```

### 3.4 Enhanced ProcessPendingCancellationsBatch

**Purpose**: Coordinate local subscription changes with Stripe subscription management.

**Current Implementation**: `backend/batches/batch-jobs/ProcessPendingCancellationsBatch.js`

**Key Changes (Pseudocode)**:
```javascript
class ProcessPendingCancellationsBatch {
  async execute(options = {}) {
    // 1. Fetch pending cancellations (existing logic)
    const pendingCancellations = await this.fetchPendingCancellations();
    
    for (const cancellation of pendingCancellations) {
      // 2. Handle different cancellation types
      if (cancellation.cancellation_reason === 'CANCEL_PAID_PLAN') {
        // Cancel Stripe subscription at period end
        await stripeService.cancelSubscription(
          cancellation.stripe_subscription_id, 
          { at_period_end: true }
        );
      }
      
      // 3. Process local subscription change (existing logic)
      await this.processLocalCancellation(cancellation);
      
      // 4. If creating new subscription (downgrade/frequency change)
      if (cancellation.upcoming_plan_id && cancellation.upcoming_plan_id !== 1) {
        const newStripePriceId = await this.getStripePriceId(cancellation.upcoming_plan_id);
        
        // Create new Stripe subscription
        const newStripeSubscription = await stripeService.createSubscription({
          customer: cancellation.stripe_customer_id,
          items: [{ price: newStripePriceId }],
          trial_end: cancellation.end_date // Start after current period
        });
        
        // Update local subscription with new Stripe ID
        await subscriptionsDataAccess.updateSubscription(newSubscriptionId, {
          stripe_subscription_id: newStripeSubscription.id
        });
      }
    }
  }
}
```

### 3.5 Modified RetryFailedPaymentsBatch

**Purpose**: Handle final failure outcomes from Stripe's automatic retry system.

**Current Implementation**: `backend/batches/batch-jobs/RetryFailedPaymentsBatch.js`

**Key Changes (Pseudocode)**:
```javascript
class RetryFailedPaymentsBatch {
  async execute(options = {}) {
    // 1. Fetch subscriptions with failed Stripe invoices after all retries
    const finalFailures = await this.fetchFinalStripeFailures();
    
    for (const failure of finalFailures) {
      // 2. Check if Stripe has exhausted all retry attempts
      const stripeInvoice = await stripeService.retrieveInvoice(failure.stripe_invoice_id);
      
      if (stripeInvoice.status === 'uncollectible') {
        // 3. Downgrade subscription to free tier
        await this.downgradeToFreeTier(failure.subscription_id);
        
        // 4. Cancel Stripe subscription
        await stripeService.cancelSubscription(failure.stripe_subscription_id);
        
        // 5. Update local payment status
        await paymentsDataAccess.updatePayment(failure.payment_id, {
          status: 'failed',
          failure_reason: 'stripe_retries_exhausted'
        });
      }
    }
  }
  
  // Note: Most retry logic now handled by Stripe automatically
  // This batch focuses on final failure handling only
}
```

### 3.6 New StripeWebhookProcessingBatch

**Purpose**: Handle webhook processing failures and ensure data consistency.

**New Implementation**: `backend/batches/batch-jobs/StripeWebhookProcessingBatch.js`

**Implementation (Pseudocode)**:
```javascript
class StripeWebhookProcessingBatch {
  async execute(options = {}) {
    // 1. Fetch webhook events that failed processing
    const failedWebhooks = await webhookDataAccess.getFailedWebhooks({
      maxAttempts: 3,
      olderThan: '5 minutes'
    });
    
    for (const webhook of failedWebhooks) {
      try {
        // 2. Retry processing the webhook event
        await webhookController.processWebhookEvent(webhook.event_data);
        
        // 3. Mark as successfully processed
        await webhookDataAccess.markWebhookProcessed(webhook.event_id);
        
      } catch (error) {
        // 4. Increment attempt counter and log error
        await webhookDataAccess.incrementWebhookAttempts(webhook.event_id, error.message);
        
        // 5. If max attempts reached, mark for manual review
        if (webhook.processing_attempts >= 3) {
          await webhookDataAccess.markWebhookForManualReview(webhook.event_id);
        }
      }
    }
  }
}
```

### 3.7 Batch Job Integration Summary

**Key Principles**:
1. **Stripe as Source of Truth**: All payment processing flows through Stripe
2. **Preserve Business Logic**: Token allocation and subscription management logic remains unchanged
3. **Webhook-Driven**: Most updates triggered by Stripe webhook events rather than batch jobs
4. **Reconciliation**: Batch jobs ensure data consistency between Stripe and local database
5. **Billing vs Subscription Periods**: Maintain separation between payment billing periods and business subscription periods

**Data Flow Changes**:
- **Before**: Local payments → Local collection → Token allocation
- **After**: Stripe invoices → Webhook events → Token allocation
- **Preserved**: All business rules for token allocation, plan changes, and cancellations

## Phase 4: Testing & Validation (Days 8-10)

### 4.1 Run Database Migrations

```bash
cd backend
npm run migrate:latest
```

### 3.2 Set Up Webhook Testing

1. **Install Stripe CLI:**
   ```bash
   stripe login
   ```

2. **Forward webhooks to local development:**
   ```bash
   stripe listen --forward-to localhost:3010/api/subscription/webhooks/stripe
   ```

3. **Test webhook events:**
   ```bash
   # Test different event types
   stripe trigger checkout.session.completed
   stripe trigger invoice.payment_succeeded
   stripe trigger customer.subscription.updated
   ```

### 3.3 End-to-End Testing Checklist

#### ✅ **Subscription Sign-up Flow**
- [ ] User can view pricing page with all plans
- [ ] Stripe Checkout session creates successfully
- [ ] User can complete payment in Stripe Checkout
- [ ] Payment completion triggers webhook
- [ ] User subscription is created in database
- [ ] Tokens are allocated correctly
- [ ] User can access subscription dashboard

#### ✅ **Token Package Purchase**
- [ ] User can view token packages
- [ ] One-time payment checkout works
- [ ] Payment completion adds tokens to balance
- [ ] Payment record is created in database

#### ✅ **Customer Portal**
- [ ] User can access Stripe Customer Portal
- [ ] Payment method updates work
- [ ] Subscription cancellations are handled
- [ ] Changes reflect in local database via webhooks

#### ✅ **Webhook Processing**
- [ ] All webhook events process without errors
- [ ] Idempotency prevents duplicate processing
- [ ] Failed webhooks are logged for retry
- [ ] Database stays synchronized with Stripe

### 3.4 Production Deployment Preparation

#### **Environment Configuration**
- [ ] Production Stripe API keys configured
- [ ] Webhook endpoints configured in Stripe dashboard
- [ ] Frontend environment variables updated
- [ ] Database migrations applied to production

#### **Security Verification**
- [ ] Webhook signature verification working
- [ ] API endpoint authentication enforced
- [ ] User data access properly restricted
- [ ] Error handling doesn't expose sensitive data

#### **Monitoring Setup**
- [ ] Webhook processing logs monitored
- [ ] Payment failure alerts configured
- [ ] Stripe dashboard monitoring enabled
- [ ] Application performance monitoring

## Success Criteria

1. **✅ Seamless Payment Flow**: Users can subscribe and purchase tokens through Stripe Checkout
2. **✅ Real-time Synchronization**: Webhook events keep local database in sync with Stripe
3. **✅ Self-Service Management**: Users can manage subscriptions through Stripe Customer Portal
4. **✅ Preserved Business Logic**: All existing subscription and token logic continues to work
5. **✅ Robust Error Handling**: Payment failures and webhook processing errors are handled gracefully
6. **✅ Admin Capabilities**: MCP tools enable easy testing and administration

## Next Steps After Implementation

1. **Enhanced Analytics**: Integrate Stripe data into reporting dashboards
2. **Advanced Features**: Implement usage-based billing and metered subscriptions
3. **Customer Support**: Add tools for customer service team to manage subscriptions
4. **Optimization**: Implement caching and performance optimizations for payment flows
5. **Expansion**: Add support for additional payment methods and currencies

This implementation plan builds on your existing robust infrastructure while adding Stripe capabilities in a way that preserves your current business logic and provides a seamless user experience. 