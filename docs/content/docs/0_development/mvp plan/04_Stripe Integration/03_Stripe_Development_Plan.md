# Stripe Integration Development Plan

## Overview

This document outlines the development plan for implementing Stripe payment processing in the Short-Video-Creator-Simplified application. It covers all necessary components, code changes, and implementation steps for both subscription-based payments and one-time token package purchases.

## Components to Develop

### 1. Stripe Service

A dedicated class inside the subscription service to handle all Stripe-related operations:

```javascript
// backend/services/subscription-service/utils/stripeService.js
class StripeService {
  constructor(config) {
    // Initialize Stripe client with secret key
    // Set webhook secret
  }

  // Create a checkout session for direct payments
  async createCheckoutSession(params) {
    // Create a Stripe checkout session with:
    // - Customer ID
    // - Price ID
    // - Success/cancel URLs
    // - Mode (payment/subscription)
    // - Metadata
    // - Idempotency key
    // Return the session
  }

  // Create a customer in Stripe
  async createCustomer(email, name, metadata) {
    // Create a Stripe customer with:
    // - Email
    // - Name
    // - Metadata
    // - Idempotency key
    // Return the customer
  }

  // Create a customer portal session
  async createCustomerPortalSession(customerId, returnUrl) {
    // Create a Stripe customer portal session with:
    // - Customer ID
    // - Return URL
    // - Idempotency key
    // Return the session
  }

  // Create a subscription
  async createSubscription(customerId, priceId, metadata) {
    // Create a Stripe subscription with:
    // - Customer ID
    // - Price ID
    // - Metadata
    // - Idempotency key
    // Return the subscription
  }

  // Update a subscription
  async updateSubscription(subscriptionId, updates) {
    // Update a Stripe subscription with:
    // - Subscription ID
    // - Updates
    // - Idempotency key
    // Return the updated subscription
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd) {
    // Cancel a Stripe subscription with:
    // - Subscription ID
    // - Cancel at period end flag
    // - Idempotency key
    // Return the canceled subscription
  }

  // Create a product
  async createProduct(name, description, metadata) {
    // Create a Stripe product with:
    // - Name
    // - Description
    // - Metadata
    // - Idempotency key
    // Return the product
  }

  // Create a price
  async createPrice(productId, amount, currency, interval, metadata) {
    // Create a Stripe price with:
    // - Product ID
    // - Amount
    // - Currency
    // - Interval (for recurring)
    // - Metadata
    // - Idempotency key
    // Return the price
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    // Verify the webhook signature using:
    // - Payload
    // - Signature
    // - Webhook secret
    // Return the event or throw an error
  }
}
```

### 2. Frontend Integration

#### Checkout Button Component

Instead of a custom payment form, we'll use a simple button that redirects to Stripe Checkout:

```jsx
// frontend/src/components/subscription/CheckoutButton.jsx
const CheckoutButton = ({ planId, packageId, onSuccess, onError }) => {
  // State for loading
  const [loading, setLoading] = useState(false);

  // Handle checkout button click
  const handleCheckout = async () => {
    // Set loading state
    // Try to create checkout session
    // Redirect to Stripe Checkout
    // Handle success/error
  };

  // Render button
  return (
    <button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Processing...' : 'Proceed to Checkout'}
    </button>
  );
};
```

#### Plan Selection Component

```jsx
// frontend/src/components/subscription/PlanSelection.jsx
const PlanSelection = ({ currentPlan, onPlanSelected }) => {
  // State for plans, selected plan, loading
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch plans on component mount
  useEffect(() => {
    // Fetch available plans
    // Set plans state
    // Set loading state
  }, []);

  // Handle plan selection
  const handlePlanSelect = (plan) => {
    // Set selected plan
    // Call onPlanSelected callback
  };

  // Handle checkout success/error
  const handleCheckoutSuccess = () => {
    // Handle successful checkout
  };

  const handleCheckoutError = (error) => {
    // Handle checkout error
  };

  // Render loading state
  if (loading) {
    return <div>Loading plans...</div>;
  }

  // Render plan selection UI
  return (
    <div className="plan-selection">
      <h2>Select a Plan</h2>
      <div className="plans-grid">
        {/* Render plan cards */}
        {/* Show checkout button for selected plan */}
      </div>
    </div>
  );
};
```

#### Token Package Purchase Component

```jsx
// frontend/src/components/tokens/TokenPackagePurchase.jsx
const TokenPackagePurchase = () => {
  // State for packages, selected package, loading
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch packages on component mount
  useEffect(() => {
    // Fetch available token packages
    // Set packages state
    // Set loading state
  }, []);

  // Handle package selection
  const handlePackageSelect = (pkg) => {
    // Set selected package
  };

  // Handle checkout success/error
  const handleCheckoutSuccess = () => {
    // Handle successful checkout
  };

  const handleCheckoutError = (error) => {
    // Handle checkout error
  };

  // Render loading state
  if (loading) {
    return <div>Loading token packages...</div>;
  }

  // Render token package purchase UI
  return (
    <div className="token-package-purchase">
      <h2>Purchase Token Packages</h2>
      <div className="packages-grid">
        {/* Render package cards */}
        {/* Show checkout button for selected package */}
      </div>
    </div>
  );
};
```

#### Customer Portal Button Component

```jsx
// frontend/src/components/subscription/CustomerPortalButton.jsx
const CustomerPortalButton = () => {
  // State for loading
  const [loading, setLoading] = useState(false);

  // Handle portal redirect
  const handlePortalRedirect = async () => {
    // Set loading state
    // Try to create customer portal session
    // Redirect to Stripe Customer Portal
    // Handle error
  };

  // Render button
  return (
    <button onClick={handlePortalRedirect} disabled={loading}>
      {loading ? 'Loading...' : 'Manage Subscription'}
    </button>
  );
};
```

### 3. Backend Integration

#### Webhook Handler

```javascript
// backend/services/subscription-service/controllers/webhookController.js
class WebhookController {
  constructor(paymentService, stripeService, tokenPackageService) {
    // Initialize services
  }

  // Handle Stripe webhook
  async handleStripeWebhook(req, res) {
    // Get signature and payload
    // Verify webhook signature
    // Handle different event types:
    // - checkout.session.completed
    // - invoice.payment_succeeded
    // - invoice.payment_failed
    // - customer.subscription.created
    // - customer.subscription.updated
    // - customer.subscription.deleted
    // Return success response
  }

  // Handle checkout session completed
  async handleCheckoutSessionCompleted(session) {
    // Get customer and metadata
    // If token package purchase:
    //   Process token package purchase
    // If subscription purchase:
    //   Process subscription purchase
  }

  // Handle invoice payment succeeded
  async handleInvoicePaymentSucceeded(invoice) {
    // Process invoice payment
  }

  // Handle invoice payment failed
  async handleInvoicePaymentFailed(invoice) {
    // Process invoice payment failure
  }

  // Handle subscription created
  async handleSubscriptionCreated(subscription) {
    // Process subscription creation
  }

  // Handle subscription updated
  async handleSubscriptionUpdated(subscription) {
    // Process subscription update
  }

  // Handle subscription deleted
  async handleSubscriptionDeleted(subscription) {
    // Process subscription deletion
  }
}
```

#### Payment Controller Enhancements

```javascript
// backend/services/subscription-service/controllers/paymentController.js
class PaymentController {
  constructor(paymentService, stripeService) {
    // Initialize services
  }

  // Create a checkout session
  async createCheckoutSession(req, res) {
    // Get plan ID or package ID from request
    // Get user ID from request
    // Get or create Stripe customer
    // Get price ID based on plan or package
    // Create checkout session
    // Return session ID
  }

  // Create a customer portal session
  async createCustomerPortalSession(req, res) {
    // Get user ID from request
    // Get Stripe customer
    // Create customer portal session
    // Return portal URL
  }
}
```

#### Token Package Controller

```javascript
// backend/services/subscription-service/controllers/tokenPackageController.js
class TokenPackageController {
  constructor(tokenPackageService) {
    // Initialize service
  }

  // Get token packages
  async getTokenPackages(req, res) {
    // Get all token packages
    // Return packages
  }

  // Get token balance
  async getTokenBalance(req, res) {
    // Get user ID from request
    // Get token balance
    // Return balance
  }

  // Get purchase history
  async getPurchaseHistory(req, res) {
    // Get user ID from request
    // Get purchase history
    // Return history
  }
}
```

### 4. Batch Job Enhancements

#### Collect Payments Batch

```javascript
// backend/batches/batch-jobs/CollectPaymentsBatch.js
class CollectPaymentsBatch {
  constructor(paymentService, stripeService) {
    // Initialize services
  }

  // Collect payment
  async collectPayment(payment, authorization) {
    // Get Stripe customer
    // Create payment intent
    // Update payment record
    // Confirm payment
    // Update payment status
    // Return result
  }
}
```

#### Retry Failed Payments Batch

```javascript
// backend/batches/batch-jobs/RetryFailedPaymentsBatch.js
class RetryFailedPaymentsBatch {
  constructor(paymentService, stripeService) {
    // Initialize services
  }

  // Retry payment
  async retryPayment(payment, authorization) {
    // Get payment intent
    // If payment intent exists and not succeeded:
    //   Confirm payment intent
    //   Update payment status
    // Return result
  }
}
```


## Database Schema Updates

Based on our application's architecture, we need to make the following schema updates to support Stripe integration:

### Required Schema Changes

1. **`users` Table Updates**
   - Add `stripe_customer_id` (VARCHAR) - To store Stripe's customer ID for the user

2. **`payments` Table Updates**
   - Add `stripe_payment_intent_id` (VARCHAR) - To store Stripe's payment intent ID
   - Add `stripe_subscription_id` (VARCHAR) - To store Stripe's subscription ID
   - Add `payment_method` (VARCHAR) - To store the payment method type (card, etc.)
   - Add `payment_method_details` (JSONB) - To store payment method details
   - Add `receipt_url` (VARCHAR) - To store the URL to the payment receipt
   - Add `idempotency_key` (VARCHAR) - To prevent duplicate operations
   - Add `subscription_status` (VARCHAR) - To store Stripe's subscription status
   - Add `cancel_at_period_end` (BOOLEAN) - To indicate if the subscription will be canceled at the end of the period

3. **`plans` Table Updates**
   - Add `stripe_price_id` (VARCHAR) - To store Stripe's price ID
   - Add `stripe_product_id` (VARCHAR) - To store Stripe's product ID

4. **`token_packages` Table Updates**
   - Add `stripe_price_id` (VARCHAR) - To store Stripe's price ID
   - Add `stripe_product_id` (VARCHAR) - To store Stripe's product ID

### Migration Script

Create a new migration file `20240408000000_add_stripe_fields.js`:

```javascript
exports.up = function(knex) {
  return knex.schema
    .alterTable('users', table => {
      table.string('stripe_customer_id').nullable();
    })
    .alterTable('payments', table => {
      table.string('stripe_payment_intent_id').nullable();
      table.string('stripe_subscription_id').nullable();
      table.string('payment_method').nullable();
      table.jsonb('payment_method_details').nullable();
      table.string('receipt_url').nullable();
      table.string('idempotency_key').nullable();
      table.string('subscription_status').nullable();
      table.boolean('cancel_at_period_end').defaultTo(false);
    })
    .alterTable('plans', table => {
      table.string('stripe_price_id').nullable();
      table.string('stripe_product_id').nullable();
    })
    .alterTable('token_packages', table => {
      table.string('stripe_price_id').nullable();
      table.string('stripe_product_id').nullable();
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('users', table => {
      table.dropColumn('stripe_customer_id');
    })
    .alterTable('payments', table => {
      table.dropColumn('stripe_payment_intent_id');
      table.dropColumn('stripe_subscription_id');
      table.dropColumn('payment_method');
      table.dropColumn('payment_method_details');
      table.dropColumn('receipt_url');
      table.dropColumn('idempotency_key');
      table.dropColumn('subscription_status');
      table.dropColumn('cancel_at_period_end');
    })
    .alterTable('plans', table => {
      table.dropColumn('stripe_price_id');
      table.dropColumn('stripe_product_id');
    })
    .alterTable('token_packages', table => {
      table.dropColumn('stripe_price_id');
      table.dropColumn('stripe_product_id');
    });
};
```

### Data Access Layer Updates

Update the data access files in `backend/services/subscription-service/data/` to include methods for:

1. **`userDataAccess.js`**
   - `updateUserWithStripeCustomerId(userId, stripeCustomerId)`
   - `getUserByStripeCustomerId(stripeCustomerId)`

2. **`paymentDataAccess.js`**
   - `updatePaymentWithStripeData(paymentId, stripeData)`
   - `getPaymentByStripePaymentIntentId(stripePaymentIntentId)`
   - `getPaymentsByStripeSubscriptionId(stripeSubscriptionId)`

3. **`planDataAccess.js`**
   - `updatePlanWithStripeData(planId, stripeData)`
   - `getPlanByStripePriceId(stripePriceId)`

4. **`tokenPackageDataAccess.js`**
   - `updateTokenPackageWithStripeData(packageId, stripeData)`
   - `getTokenPackageByStripePriceId(stripePriceId)`

## API Endpoints

### New Required Endpoints

1. **Create Checkout Session**
   ```
   POST /api/subscription/payments/create-checkout-session
   ```
   
   **Use Case**: Creates a Stripe Checkout session for subscription or token package purchase
   
   **Request Body**:
   ```json
   {
     "type": "subscription" | "token_package",
     "priceId": "price_xyz123", // Stripe price ID
     "packageId": 123, // Required for token packages
     "successUrl": "https://example.com/success",
     "cancelUrl": "https://example.com/cancel"
   }
   ```
   
   **Response Example**:
   ```json
   {
     "success": true,
     "data": {
       "sessionId": "cs_test_xyz123",
       "url": "https://checkout.stripe.com/xyz123"
     }
   }
   ```
   
   **Notes**:
   - Requires authentication
   - Automatically creates or retrieves Stripe customer
   - Handles both subscription and token package purchases
   - Returns session URL for redirect

2. **Create Customer Portal Session**
   ```
   POST /api/subscription/customer-portal
   ```
   
   **Use Case**: Creates a Stripe Customer Portal session for managing subscriptions and payment methods
   
   **Request Body**:
   ```json
   {
     "returnUrl": "https://example.com/account"
   }
   ```
   
   **Response Example**:
   ```json
   {
     "success": true,
     "data": {
       "url": "https://billing.stripe.com/xyz123"
     }
   }
   ```
   
   **Notes**:
   - Requires authentication
   - Automatically retrieves existing Stripe customer
   - Returns portal URL for redirect

3. **Webhook Handler**
   ```
   POST /api/subscription/webhook
   ```
   
   **Use Case**: Handles Stripe webhook events for payment and subscription status updates
   
   **Headers**:
   ```
   Stripe-Signature: t=timestamp,v1=signature
   ```
   
   **Request Body**: Raw Stripe event payload
   
   **Response**:
   ```
   HTTP 200 OK
   ```
   
   **Notes**:
   - No authentication required (verified via Stripe signature)
   - Handles events: payment_intent.succeeded, payment_intent.failed, customer.subscription.created, etc.
   - Updates local database based on event type
   - Returns 200 quickly to acknowledge receipt

### Enhanced Existing Endpoints

1. **Get Token Packages** (Enhanced)
   ```
   GET /api/tokens/packages
   ```
   
   **Use Case**: Lists available token packages with Stripe price information
   
   **Query Parameters**:
   - `status` (optional): Filter by package status
   
   **Response Example**:
   ```json
   {
     "success": true,
     "data": [
       {
         "package_id": 1,
         "name": "Basic Package",
         "token_amount": 1000,
         "price": 9.99,
         "stripe_price_id": "price_xyz123",
         "status": "active"
       }
     ]
   }
   ```
   
   **Notes**:
   - Now includes Stripe price IDs
   - Used by frontend to display package options

2. **Buy Token Package** (Enhanced)
   ```
   POST /api/tokens/packages/buy
   ```
   
   **Use Case**: Initiates a token package purchase using Stripe Checkout
   
   **Request Body**:
   ```json
   {
     "packageId": 1
   }
   ```
   
   **Response Example**:
   ```json
   {
     "success": true,
     "data": {
       "sessionId": "cs_test_xyz123",
       "url": "https://checkout.stripe.com/xyz123"
     }
   }
   ```
   
   **Notes**:
   - Now creates Stripe Checkout session instead of direct payment
   - Returns session URL for redirect
   - Tokens are allocated after successful payment via webhook

3. **Collect Payment** (Enhanced)
   ```
   POST /api/subscription/payments/:paymentId/collect
   ```
   
   **Use Case**: Processes a payment through Stripe
   
   **URL Parameters**:
   - `paymentId`: The ID of the payment to collect
   
   **Response Example**:
   ```json
   {
     "success": true,
     "data": {
       "payment_id": 123,
       "status": "completed",
       "external_payment_id": "pi_xyz123",
       "amount": 9.99,
       "currency": "usd"
     }
   }
   ```
   
   **Notes**:
   - Now uses Stripe PaymentIntent for processing
   - Updates payment record with Stripe payment ID
   - Handles various payment statuses

4. **Retry Payment** (Enhanced)
   ```
   POST /api/subscription/payments/:paymentId/retry
   ```
   
   **Use Case**: Retries a failed payment using Stripe
   
   **URL Parameters**:
   - `paymentId`: The ID of the payment to retry
   
   **Response Example**:
   ```json
   {
     "success": true,
     "data": {
       "payment_id": 123,
       "status": "completed",
       "external_payment_id": "pi_xyz123",
       "amount": 9.99,
       "currency": "usd"
     }
   }
   ```
   
   **Notes**:
   - Now uses Stripe PaymentIntent for retry
   - Maintains retry count and downgrade logic
   - Updates payment record with new status

### Additional Existing Endpoints

1. **Get Token Balance**
   ```
   GET /api/tokens/balance
   ```
   
   **Use Case**: Retrieves user's current token balance and usage
   
   **Response Example**:
   ```json
   {
     "success": true,
     "data": {
       "balance": 5000,
       "used_this_month": 1500,
       "monthly_allocation": 6500
     }
   }
   ```
   
   **Notes**:
   - Requires authentication
   - Used by frontend to display token information

2. **Get Purchase History**
   ```
   GET /api/tokens/purchases
   ```
   
   **Use Case**: Retrieves user's token package purchase history
   
   **Query Parameters**:
   - `limit` (optional): Number of records to return
   - `offset` (optional): Number of records to skip
   
   **Response Example**:
   ```json
   {
     "success": true,
     "data": [
       {
         "purchase_id": 1,
         "package_id": 1,
         "token_amount": 1000,
         "amount_paid": 9.99,
         "purchase_date": "2024-01-01T00:00:00.000Z",
         "status": "completed"
       }
     ]
   }
   ```
   
   **Notes**:
   - Requires authentication
   - Used by frontend to display purchase history

## Error Handling

1. **Payment Processing Errors**
   - Handle insufficient funds
   - Handle declined cards
   - Handle network errors
   - Handle validation errors
   - Handle token balance update errors

2. **Webhook Errors**
   - Handle signature verification failures
   - Handle duplicate events
   - Handle processing errors
   - Handle token balance update failures

3. **Batch Job Errors**
   - Handle API errors
   - Handle database errors
   - Implement retry logic

## Monitoring and Logging

1. **Payment Processing Logs**
   - Log all payment attempts
   - Log successful payments
   - Log failed payments with error details

2. **Token Package Purchase Logs**
   - Log all purchase attempts
   - Log successful purchases
   - Log failed purchases with error details
   - Log token balance updates

3. **Webhook Logs**
   - Log all received webhooks
   - Log webhook processing results
   - Log webhook errors
   - Log token balance update results

4. **Batch Job Logs**
   - Log batch job execution
   - Log payment collection results
   - Log payment retry results

## Idempotency Implementation

To prevent duplicate operations, we'll implement idempotency keys for all Stripe API calls:

1. **Checkout Sessions**
   ```javascript
   const session = await this.stripeService.createCheckoutSession({
     // ... other parameters
     idempotency_key: `checkout_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
   });
   ```

2. **Customer Creation**
   ```javascript
   const customer = await this.stripeService.createCustomer(
     email,
     name,
     metadata,
     `customer_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
   );
   ```

3. **Subscription Creation**
   ```javascript
   const subscription = await this.stripeService.createSubscription(
     customerId,
     priceId,
     metadata,
     `subscription_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
   );
   ```

4. **Payment Processing**
   ```javascript
   const paymentIntent = await this.stripeService.createPaymentIntent({
     // ... other parameters
     idempotency_key: `payment_${paymentId}_${Date.now()}`,
   });
   ```

