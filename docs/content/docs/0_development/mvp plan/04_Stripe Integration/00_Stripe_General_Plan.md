# Stripe Integration Plan for Short-Video-Creator-Simplified

## Current System Overview

The application currently has a subscription and payment system with the following components:

### Payment Processing:
- Payment records are stored in the `payments` table
- Payments can be for subscriptions or token packages
- Payment `status` includes: 'open', 'completed', 'failed'
- A mock Stripe service exists but is not fully integrated

### Subscription Management:
- Subscriptions are stored in the `user_subscriptions` table
- Subscriptions have plan_ids 
- Plan Ids are stored in the `plans` table and have different `price` and have `billing_frequency` which can be monthly or yearly
- Subscriptions have payments which are stored in the `payments` table for the initial payment and then for each renewal payment
- Each payment has a billing_period_start and billing_period_end to recognize how long the payment covers, when the billing period ends a new payment is automatically created and collected if the subscription is active
- Subscriptions can be in `status` active, pending_cancellation, or cancelled

### Token Packages:
- Token packages are stored in the `token_packages` table
- Users can purchase token packages to get additional tokens
- The payments for token packages are stored in the `payments` table
- Token transactions are recorded in the `token_transactions` table
- Token balances are tracked in the `tokens` table

### Batch Jobs:
- CreatePaymentsBatch.js creates payment records for active subscriptions when the billing period of the current payment ends
- CollectPaymentsBatch.js processes open payments with the stripe service and sets the payment status to completed or failed
- RetryFailedPaymentsBatch.js retries failed payments with the stripe service and sets the payment status to completed or failed, adds a counter if the payment is still failing, moves the payment to failed after 3 retries
- ProcessPendingCancellationsBatch.js processes pending cancellations and creates a new subscription based on the given `upcoming_plan_id` which stores the information about the new plan.
- SubscriptionRenewalsBatch.js updates subscription periods and allocates tokens for the new period (not billing period)

## Payment Flow with Stripe

The integration with Stripe will follow this secure payment flow:

### 1. Frontend Initiates Payment
- User selects a product (subscription plan or token package)
- Frontend calls our backend API to create a checkout session

### 2. Backend Creates Checkout Session
- Our backend creates a checkout session with Stripe
- This is a server-side operation that requires our Stripe secret key
- The checkout session contains the product, price, and success/cancel URLs

### 3. Frontend Redirects to Stripe Checkout
- Backend returns the checkout session URL to the frontend
- Frontend redirects the user to Stripe's hosted checkout page
- User enters their payment information on Stripe's secure page

### 4. Stripe Processes Payment
- Stripe handles the actual payment processing
- Stripe sends a webhook to our backend with the payment result

### 5. Backend Updates Database
- Our backend receives the webhook
- Updates the payment status in our database
- Activates the subscription or adds tokens to the user's account

### 6. User Returns to Application
- After payment completion, Stripe redirects the user back to our success URL
- Frontend displays a success message and updates the UI accordingly

Using Stripe Checkout provides several advantages:
- It's a pre-built, secure payment flow
- It handles 3D Secure authentication automatically
- It supports various payment methods out of the box
- It's mobile-responsive and optimized for conversion
- It reduces our PCI compliance scope

## Stripe Customers and Storage

Creating and storing Stripe customers is essential for our subscription-based system:

### Why Store Stripe Customer IDs:

1. **Recurring Payments**: 
   - Stripe customers are essential for managing subscriptions
   - They allow us to charge the same card multiple times without collecting it again

2. **Payment Method Management**:
   - Customers can have multiple payment methods
   - We can set a default payment method
   - Users can update their payment methods without changing their subscription

3. **Subscription Management**:
   - Subscriptions are linked to customers
   - We can easily retrieve all subscriptions for a customer
   - We can update subscription details without collecting payment information again

4. **Analytics and Reporting**:
   - Stripe provides customer-specific analytics
   - We can track customer lifetime value
   - We can identify at-risk customers

### Database Storage Requirements:

We need to store the following Stripe-related information in our database:

1. **User Table**:
   - `stripe_customer_id`: The ID of the customer in Stripe

2. **Payment Table**:
   - `stripe_payment_intent_id`: The ID of the payment intent in Stripe
   - `stripe_subscription_id`: The ID of the subscription in Stripe
   - `payment_method`: The type of payment method used
   - `payment_method_details`: JSON details about the payment method
   - `receipt_url`: URL to the payment receipt
   - `idempotency_key`: To prevent duplicate operations
   - `subscription_status`: The status of the subscription
   - `cancel_at_period_end`: Whether the subscription will be canceled at the end of the period

3. **Plans Table**:
   - `stripe_price_id`: The ID of the price in Stripe
   - `stripe_product_id`: The ID of the product in Stripe

4. **Token Packages Table**:
   - `stripe_price_id`: The ID of the price in Stripe
   - `stripe_product_id`: The ID of the product in Stripe

This data creates a link between our application and Stripe, allowing us to:
- Retrieve customer information from Stripe
- Create new checkout sessions without collecting payment information again
- Track payment and subscription status

## Information Needed for Payment Renewal

For recurring payments (subscriptions), we need to store and manage:

1. **Stripe Customer ID**:
   - Links our user to their Stripe customer record
   - Allows us to retrieve payment methods and subscriptions

2. **Stripe Subscription ID**:
   - Identifies the specific subscription in Stripe
   - Allows us to update or cancel the subscription

3. **Subscription Status**:
   - Track whether the subscription is active, past due, canceled, etc.
   - This helps us manage access to premium features

4. **Billing Period**:
   - Store the current billing period start and end dates
   - This helps us track when the next payment is due

Stripe handles most of the complexity of recurring payments. Our application mainly needs to:
1. Create the subscription initially
2. Listen for webhook events about subscription status changes
3. Update our database based on these events

## Stripe Integration Plan

### 1. Stripe Service Enhancement

The existing StripeService class needs to be enhanced to fully support:

#### Customer Management:
- Create and update Stripe customers
- Store Stripe customer IDs in the user profile of users table
- Attach payment methods to customers

#### Checkout Sessions:
- Create checkout sessions for one-time payments (token packages)
- Create checkout sessions for subscriptions
- Handle success and cancel callbacks

#### Customer Portal:
- Create customer portal sessions for subscription management
- Configure portal settings for subscription updates and cancellations

#### Webhook Handling:
- Verify webhook signatures
- Process various webhook events:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
- Update payment and subscription records based on webhook events

### 2. Database Schema Updates

The existing database schema needs to be updated to support Stripe integration:

#### User Table Updates:
- Add `stripe_customer_id` column to store the Stripe customer ID

#### Payment Table Updates:
- Add `stripe_payment_intent_id` column to store the Stripe payment intent ID
- Add `stripe_subscription_id` column to store the Stripe subscription ID
- Add `payment_method` column to store the payment method type
- Add `payment_method_details` column to store payment method details
- Add `receipt_url` column to store the URL to the payment receipt
- Add `idempotency_key` column to prevent duplicate operations
- Add `subscription_status` column to store the Stripe subscription status
- Add `cancel_at_period_end` column to indicate if the subscription will be canceled

#### Plans Table Updates:
- Add `stripe_price_id` column to store the Stripe price ID
- Add `stripe_product_id` column to store the Stripe product ID

#### Token Packages Table Updates:
- Add `stripe_price_id` column to store the Stripe price ID
- Add `stripe_product_id` column to store the Stripe product ID

### 3. API Endpoints

We need to add or enhance the following API endpoints:

#### Payment Endpoints:
- POST /api/subscription/payments/create-checkout-session - Create a checkout session for a token package
- POST /api/subscription/payments/create-customer-portal-session - Create a customer portal session

#### Subscription Endpoints:
- POST /api/subscription/subscriptions/create-checkout-session - Create a checkout session for a subscription
- POST /api/subscription/subscriptions/create-customer-portal-session - Create a customer portal session for subscription management

#### Webhook Endpoint:
- POST /api/subscription/webhooks/stripe - Handle Stripe webhooks

### 4. Batch Job Enhancements

The existing batch jobs need to be enhanced to work with Stripe:

#### CreatePaymentsBatch.js:
- Update to create payment records for active subscriptions
- Include Stripe subscription IDs in the payment records

#### CollectPaymentsBatch.js:
- Update to use Stripe for payment collection
- Handle payment intents and confirmations
- Update payment records with Stripe payment IDs

#### RetryFailedPaymentsBatch.js:
- Update to retry failed payments using Stripe
- Handle payment intent retries
- Update payment records with retry results

#### ProcessPendingCancellationsBatch.js:
- Update to handle subscription cancellations through Stripe
- Create new subscriptions based on upcoming plan IDs

#### SubscriptionRenewalsBatch.js:
- Update to sync with Stripe subscription renewals
- Handle subscription updates and cancellations
- Allocate tokens for the new period

### 5. Frontend Integration

The frontend needs to be updated to support Stripe payment processing:

#### CheckoutButton Component:
- Redirect users to Stripe Checkout
- Handle success and cancel callbacks
- Display loading states and error messages

#### PlanSelection Component:
- Display available subscription plans
- Show pricing, features, and benefits
- Handle plan selection and initiate checkout

#### TokenPackagePurchase Component:
- Display available token packages
- Show pricing and token amounts
- Handle package selection and initiate checkout

#### CustomerPortalButton Component:
- Redirect users to Stripe Customer Portal
- Handle return from the portal
- Update UI based on subscription changes

#### UserDashboard Component:
- Display subscription status
- Show token balance and usage
- Provide links to manage subscription and purchase tokens

## Implementation Timeline

The Stripe integration will be implemented in phases:

### Phase 1: Setup and Configuration (2 days)
- Set up Stripe account and configure products/prices
- Configure webhooks and customer portal
- Update database schema

### Phase 2: Backend Implementation (4 days)
- Implement StripeService
- Enhance PaymentController and TokenPackageController
- Implement WebhookController
- Update data access layer

### Phase 3: Frontend Implementation (3 days)
- Implement CheckoutButton component
- Create PlanSelection component
- Develop TokenPackagePurchase component
- Implement CustomerPortalButton

### Phase 4: Testing and Deployment (2 days)
- Test the integration in development environment
- Deploy to staging for user acceptance testing
- Deploy to production

Total estimated time: 11 days

## Security Considerations

1. **API Key Security**:
   - Store API keys in environment variables
   - Never expose secret keys in client-side code
   - Rotate keys periodically
   - Use different keys for development and production

2. **Webhook Security**:
   - Verify webhook signatures using the webhook secret
   - Use HTTPS for all webhook endpoints
   - Implement idempotency checks to prevent duplicate processing
   - Handle webhook failures with retry logic

3. **Data Protection**:
   - Never store full credit card details
   - Use Stripe's tokenization for payment methods
   - Comply with PCI DSS requirements
   - Encrypt sensitive data in transit and at rest

4. **Error Handling**:
   - Implement comprehensive error handling for all Stripe API calls
   - Log errors with appropriate context
   - Provide user-friendly error messages
   - Implement retry logic for transient failures