# Stripe Implementation Steps

## Implementation Steps

### Phase 1: Setup and Configuration

1. **Set up Stripe account and configure products/prices**
   - Create products for each subscription tier
   - Create products for token packages
   - Set up prices for different billing frequencies and token packages
   - Configure webhooks

2. **Install necessary dependencies**
   ```bash
   # Backend
   npm install stripe

   # Frontend
   npm install @stripe/stripe-js
   ```

3. **Configure environment variables**
   ```
   # Backend (.env)
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...

   # Frontend (.env.local)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### Phase 2: Backend Implementation

1. **Implement StripeService**
   - Create the service class in `backend/services/subscription-service/services/stripeService.js`
   - Implement methods for:
     - Creating and managing Stripe customers
     - Creating checkout sessions for subscriptions and token packages
     - Creating customer portal sessions
     - Verifying webhook signatures
     - Processing payments and refunds
   - Add error handling and logging
   - Add idempotency keys to prevent duplicate operations

2. **Update PaymentService**
   - Update the existing service in `backend/services/subscription-service/services/paymentService.js`
   - Enhance payment creation logic to work with Stripe
   - Add methods for:
     - Creating payment records from Stripe events
     - Updating payment status based on Stripe events
     - Retrieving payment history
   - Add automatic customer creation and linking
   - Add error handling and logging

3. **Enhance TokenPackageService**
   - Update the existing service in `backend/services/subscription-service/services/tokenPackageService.js`
   - Add methods for:
     - Creating Stripe checkout sessions for token packages
     - Processing successful token package purchases
     - Updating token balances after purchase
     - Retrieving purchase history
   - Add error handling and logging

4. **Enhance PaymentController**
   - Update the existing controller in `backend/services/subscription-service/controllers/paymentController.js`
   - Add methods for:
     - Creating checkout sessions for subscriptions and token packages
     - Creating customer portal sessions
     - Processing webhook events
     - Handling payment status updates
   - Add proper error handling and response formatting

5. **Enhance TokenPackageController**
   - Update the existing controller in `backend/services/subscription-service/controllers/tokenPackageController.js`
   - Add methods for:
     - Initiating token package purchases via Stripe Checkout
     - Retrieving token balance and usage
     - Retrieving purchase history
   - Add proper error handling and response formatting

6. **Implement WebhookController**
   - Create the controller in `backend/services/subscription-service/controllers/webhookController.js`
   - Implement webhook signature verification
   - Implement handlers for all relevant Stripe events:
     - `checkout.session.completed` - Process successful payments
     - `payment_intent.succeeded` - Update payment records
     - `payment_intent.failed` - Handle failed payments
     - `customer.subscription.created` - Create subscription records
     - `customer.subscription.updated` - Update subscription records
     - `customer.subscription.deleted` - Handle subscription cancellations
     - `invoice.paid` - Process successful invoice payments
     - `invoice.payment_failed` - Handle failed invoice payments
   - Add proper error handling and logging


7. **Update Database Access Layer**
   - Update the data access files in `backend/services/subscription-service/data/`
   - Add methods for:
     - Storing Stripe customer IDs
     - Storing Stripe payment IDs
     - Storing Stripe subscription IDs
     - Updating payment statuses
     - Updating subscription statuses
   - Ensure proper transaction handling

8. **Enhance Batch Jobs**
   - Update `backend/batches/batch-jobs/CollectPaymentsBatch.js` to use Stripe
   - Update `backend/batches/batch-jobs/RetryFailedPaymentsBatch.js` to use Stripe
   - Add methods for:
     - Creating payment intents for pending payments
     - Retrying failed payments with Stripe
     - Updating payment records based on Stripe responses
   - Add error handling and retry logic
   - Add idempotency keys to prevent duplicate operations

9. **Update API Routes**
   - Update `backend/services/subscription-service/routes/paymentRoutes.js`
   - Update `backend/services/subscription-service/routes/tokenPackageRoutes.js`
   - Update `backend/services/subscription-service/routes/webhookRoutes.js`
   - Add new endpoints for:
     - Creating checkout sessions
     - Creating customer portal sessions
     - Processing webhooks
   - Ensure proper authentication and validation

### Phase 3: Frontend Implementation

1. **Create CheckoutButton Component**
   - Implement Stripe Checkout integration
   - Handle success and error states

2. **Create PlanSelection Component**
   - Display available plans
   - Show plan details
   - Integrate CheckoutButton component
   - Handle plan selection

3. **Create TokenPackagePurchase Component**
   - Display available token packages
   - Show package details
   - Integrate CheckoutButton component
   - Handle package selection

4. **Create CustomerPortalButton Component**
   - Implement Stripe Customer Portal integration
   - Handle loading states

5. **Create Subscription Management Page**
   - Display current subscription details
   - Integrate CustomerPortalButton component
   - Handle subscription status

6. **Create Token Balance Component**
   - Display current token balance
   - Add link to token package purchase

7. **Update User Dashboard**
   - Integrate TokenBalance component
   - Add links to subscription management and token package purchase

8. **Update Subscription Management UI**
   - Add subscription upgrade/downgrade flows
   - Add payment method management
   - Add subscription cancellation
   - Integrate Stripe Customer Portal
