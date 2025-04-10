# Stripe Implementation Steps (Revised)

This document outlines the step-by-step implementation plan for integrating Stripe, focusing on Stripe Checkout, Customer Portal, and Webhook-driven synchronization.

## Phase 1: Setup and Configuration (Backend & Stripe Dashboard)

### 1.1 Stripe Account Setup
- Create/configure your Stripe account ([stripe.com](https://stripe.com))
- Complete business profile and identity verification
- Obtain API Keys (Publishable and Secret) for both test and live modes
- Obtain Webhook Signing Secret for test and live environments

### 1.2 Stripe Product & Price Configuration
- Log in to Stripe Dashboard
- Create Stripe Products for each subscription tier (e.g., "Basic", "Creator")
- For each subscription Product, create recurring Prices for each billing frequency (e.g., monthly Price ID `price_abc...`, yearly Price ID `price_def...`). Record these Price IDs
- Create Stripe Products for each token package (e.g., "100 Tokens")
- For each token package Product, create a one-time Price. Record these Price IDs

### 1.3 Stripe Webhook Configuration
- In Stripe Dashboard (Developers → Webhooks), create an endpoint for your backend webhook handler (`/api/subscription/webhooks/stripe`)
- Configure separate endpoints for development (using ngrok or similar) and production
- Subscribe the endpoint to essential events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 1.4 Stripe Customer Portal Configuration
- In Stripe Dashboard (Settings → Customer Portal), configure settings: allowed actions (update payment methods, cancel subscriptions), branding, return URL, terms/privacy links

### 1.5 Backend Environment Configuration
- Install Stripe Node.js library: `npm install stripe`
- Add Stripe keys/secrets to your backend `.env` file:
  ```
  STRIPE_SECRET_KEY=sk_test_... # Or sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_... # Or live whsec_...
  ```

### 1.6 Frontend Environment Configuration
- Install Stripe.js library: `npm install @stripe/stripe-js`
- Add Stripe Publishable Key to your frontend `.env.local` file:
  ```
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Or pk_live_...
  ```

### 1.7 Database Migration
- Create and run the database migration script (`YYYYMMDDHHMMSS_add_stripe_integration_fields.js`) to add the necessary Stripe-related columns to `users`, `user_subscriptions`, `payments`, `plans`, and `token_packages` tables as defined in the revised Development Plan

## Phase 2: Backend Implementation (Core Logic & Synchronization)

### 2.1 Implement `StripeService` (`utils/stripeService.js`)
- Create the service class
- Initialize the Stripe client using `STRIPE_SECRET_KEY`
- Implement core methods: `createCustomer`, `createCheckoutSession`, `createCustomerPortalSession`, `updateSubscription`, `cancelSubscription`, `constructWebhookEvent`. Include error handling and support for idempotency keys

### 2.2 Update Data Access Layer (`data/`)
- Modify existing DAOs (`userDataAccess`, `subscriptionDataAccess`, `paymentDataAccess`, etc.) or create new methods to handle reading/writing the new Stripe ID fields added in Phase 1
- Implement lookup methods like `findSubscriptionByStripeId`, `findUserByStripeCustomerId`

### 2.3 Implement `WebhookController` (`controllers/webhookController.js`)
- Create the controller class
- Implement the main `handleStripeWebhook` method:
  - Verify signature using `StripeService.constructWebhookEvent`
  - Implement idempotency check (using event IDs)
  - Implement `switch` statement for event types
- Implement specific handler methods for key events (`handleCheckoutSessionCompleted`, `handleInvoicePaid`, `handleInvoicePaymentFailed`, `handleSubscriptionUpdated`, `handleSubscriptionDeleted`)
- Ensure handlers correctly parse event data and call appropriate service/DAO methods to update the local database state (e.g., update subscription status/periods, create payment records, trigger token allocation). Include robust logging

### 2.4 Update `PaymentService`, `SubscriptionService`, `TokenService`
- Modify these services to use the new DAO methods
- `PaymentService`: Add methods like `createOrUpdatePaymentFromInvoice`, `createOrUpdatePaymentFromCheckout` to be called by webhook handlers
- `SubscriptionService`: Add methods like `findSubscriptionByStripeId`, `syncSubscriptionFromStripe`, `handleStripeSubscriptionCancellation`, `updateUserStripeCustomerId`, `updateSubscriptionBillingPeriod` to be called by webhook handlers or controllers
- `TokenService`: Ensure `allocateTokensForSubscriptionPeriod` can be triggered correctly (likely after `invoice.paid`)

### 2.5 Implement/Update API Endpoints & Routes (`controllers/`, `routes/`)
- Create the new route for `POST /api/subscription/webhooks/stripe` pointing to `WebhookController.handleStripeWebhook`. Ensure it uses `express.raw({type: 'application/json'})` middleware to get the raw body for signature verification
- Implement `POST /api/subscription/checkout/create-session` endpoint (e.g., in `PaymentController` or `SubscriptionController`). Logic should get user details, determine `stripe_price_id`, potentially create Stripe customer via `StripeService` if needed, and call `StripeService.createCheckoutSession`
- Implement `POST /api/subscription/portal/create-session` endpoint (e.g., in `SubscriptionController`). Logic should get user's `stripe_customer_id` and call `StripeService.createCustomerPortalSession`
- Modify `PUT /api/subscription/subscriptions/:subscriptionId` endpoint handler (in `SubscriptionController`) to call `StripeService.updateSubscription`
- Modify `POST /api/subscription/subscriptions/:subscriptionId/cancel` endpoint handler (in `SubscriptionController`) to call `StripeService.cancelSubscription`
- Ensure authentication middleware is applied correctly to protected endpoints

### 2.6 Refine `SubscriptionRenewalsBatch`
- Modify the batch job's logic to focus solely on token allocation
- Change its data retrieval method to find subscriptions confirmed to need allocation for the current period (e.g., based on flags or dates updated by the `invoice.paid` webhook handler)
- Remove logic related to payment collection or period date updates

### 2.7 Remove Deprecated Batch Jobs
- Delete or comment out `CreatePaymentsBatch`, `CollectPaymentsBatch`, `RetryFailedPaymentsBatch`
- Review `ProcessPendingCancellationsBatch` - if subscription updates/cancellations are handled directly via Stripe API + webhooks, this batch may no longer be needed

## Phase 3: Frontend Implementation

### 3.1 Implement `CheckoutButton` Component
- Create the React component
- Implement `handleCheckout` function to call the backend `/checkout/create-session` API
- Handle the response, redirecting `window.location.href` to the Stripe Checkout URL
- Include loading state and basic error handling/display

### 3.2 Implement `CustomerPortalButton` Component
- Create the React component
- Implement `handlePortalRedirect` function to call the backend `/portal/create-session` API
- Handle the response, redirecting `window.location.href` to the Stripe Customer Portal URL
- Include loading state and basic error handling

### 3.3 Integrate Buttons into UI
- Update `PlanSelection` component: Fetch plans with `stripe_price_id`, integrate `CheckoutButton` passing the correct `priceId` and `type='subscription'`
- Update `TokenPackagePurchase` component: Fetch packages with `stripe_price_id`, integrate `CheckoutButton` passing the correct `priceId`, `type='token_package'`, and `packageId`
- Update `SubscriptionManagement` / `Account Settings` page: Integrate `CustomerPortalButton`

### 3.4 Handle Redirections
- Create simple frontend pages/routes for the `successUrl` and `cancelUrl` specified during Checkout session creation (e.g., `/payment-success`, `/payment-cancelled`). The success page should inform the user payment was successful but activation might take a moment (due to webhook processing)
- Ensure the `returnUrl` used for the Customer Portal brings the user back to an appropriate page (e.g., `/account-settings`)

### 3.5 Update Data Displays
- Ensure `UserDashboard`, `SubscriptionManagement`, `TokenBalance` components fetch the latest data from the backend API. The backend data should reflect the state updated by Stripe webhooks. UI updates might require a page refresh or implementing polling/websockets if real-time updates post-webhook are critical

## Phase 4: Testing and Deployment

### 4.1 Webhook Testing (Local)
- Use Stripe CLI (`stripe listen --forward-to localhost:<your_port>/api/subscription/webhooks/stripe`) or ngrok to forward test events from Stripe Dashboard to your local development server
- Trigger events using Stripe Dashboard (e.g., create test subscriptions, invoices, payments) or Stripe CLI (`stripe trigger <event_name>`)
- Verify signature verification works
- Verify webhook handlers process events correctly and update the local database as expected
- Test idempotency by sending the same event multiple times

### 4.2 End-to-End Flow Testing
- Checkout: Test subscribing to different plans (monthly/yearly), purchasing token packages. Verify redirection, payment completion, webhook processing, database updates, and token allocation. Test both success and cancellation flows
- Customer Portal: Test accessing the portal, updating payment methods, cancelling subscriptions (at period end). Verify changes are reflected in Stripe and subsequently in the local DB via webhooks
- Subscription Lifecycle: Simulate renewals (using Stripe CLI `stripe fixtures` or waiting in test mode), failed renewals (using test cards), and final cancellations after retries. Verify local state updates correctly via webhooks
- Plan Changes: Test upgrades, downgrades, frequency changes initiated via application UI. Verify `updateSubscription` API calls and subsequent webhook processing

### 4.3 Staging Deployment & UAT
- Deploy the integrated application to a staging environment using Stripe test keys
- Configure the staging webhook endpoint in Stripe
- Perform User Acceptance Testing covering all payment and subscription management flows

### 4.4 Production Deployment
- Switch to Stripe live API keys and webhook secret in production environment variables
- Configure the production webhook endpoint in Stripe and ensure it's active
- Monitor closely after launch for any issues, especially around webhook processing and subscription state synchronization