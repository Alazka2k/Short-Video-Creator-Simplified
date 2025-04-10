# Stripe Integration Overview

## Introduction

This document outlines the comprehensive plan for integrating Stripe payment processing into the Short-Video-Creator-Simplified application. It provides a high-level overview of the integration approach and includes a detailed manual for setting up Stripe for our application.

## Integration Approach

Our Stripe integration will support two main payment scenarios:

1. **Direct Payments**: One-time payments for plan upgrades or token package purchases
2. **Recurring Payments**: Automated subscription renewals for existing customers

The integration leverages Stripe's robust API to handle payment processing, subscription management, and webhook notifications. We'll implement both frontend and backend components to create a seamless payment experience.

### Key Components

1. **Backend Components**:
   - `StripeService`: Core service for interacting with Stripe API
   - Existing services need to be enhanced to support the new Stripe-related data
        - Enhanced `PaymentService`: Handles payment processing
        - Enhanced `TokenPackageService`: Manages token package purchases
    - `WebhookController`: Processes Stripe webhook events
   - Controller classes need to be enhanced to support the new Stripe-related data
        - Enhanced `PaymentController`: Handles checkout sessions and payment processing
        - Enhanced `TokenPackageController`: Manages token package purchases
   - Database schema updates to store Stripe-related data
   - Data access layers need to be enhanced to support the new Stripe-related data
   - Batch jobs need to be enhanced to support the new Stripe-related data
   - New endpoints need to be added to the API
   - Existing routes need to be updated to support the new Stripe-related data
        - Enhance `paymentRoutes.js`
        - Enhance `tokenPackageRoutes.js`


2. **Frontend Components**:
   - `CheckoutButton`: Redirects users to Stripe Checkout
   - `PlanSelection`: Displays subscription plans
   - `TokenPackagePurchase`: Handles token package purchases
   - `CustomerPortalButton`: Manages subscriptions and payment methods

   Additional components:
   - `SubscriptionManagement`: Information page for user about the subscription, upgrade and downgrade options, cancel subscription
   - `TokenBalance`: Displays token balance information
   - `UserDashboard`: Main dashboard for user to see their subscription and token balance



## Stripe Setup Manual

### 1. Create a Stripe Account

1. **Sign up for Stripe**
   - Go to [stripe.com](https://stripe.com) and click "Start now"
   - Enter your email, full name, and password
   - Verify your email address

2. **Complete your business profile**
   - Provide your business name, website, and industry
   - Enter your business address and contact information
   - Add your bank account details for receiving payments
   - Provide your tax ID (EIN or SSN for US businesses)

3. **Verify your identity**
   - Upload government-issued ID
   - Provide your date of birth and SSN (for US accounts)
   - Complete any additional verification steps required for your region

### 2. Configure API Keys

1. Navigate to the Stripe Dashboard
2. Go to Developers → API keys
3. Note down both the **Publishable key** and **Secret key**
4. For development, use the test keys (starting with `pk_test_` and `sk_test_`)
5. For production, use the live keys (starting with `pk_live_` and `sk_live_`)
6. Add these keys to your environment variables:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

### 3. Set Up Products and Prices

1. **Create subscription products**
   - Go to Products → Add product
   - For each subscription tier (e.g., Free, Basic, Pro, Enterprise):
     - Enter a product name (e.g., "Basic Plan")
     - Add a description (e.g., "Basic subscription with 100 tokens per month")
     - Upload an image (optional)
     - Click "Save product"

2. **Create prices for each product**
   - After creating a product, click "Add pricing"
   - Select "Recurring" for subscription pricing
   - Choose the billing period (monthly, yearly, etc.)
   - Enter the price amount and currency
   - Set the billing interval (month, year, etc.)
   - Add a price nickname (e.g., "Monthly Basic")
   - Click "Add price"
   - Repeat for each billing frequency (e.g., monthly and yearly options)

3. **Create token package products**
   - Go to Products → Add product
   - For each token package (e.g., Small, Medium, Large):
     - Enter a product name (e.g., "100 Token Package")
     - Add a description (e.g., "One-time purchase of 100 tokens")
     - Upload an image (optional)
     - Click "Save product"

4. **Create one-time prices for token packages**
   - After creating a product, click "Add pricing"
   - Select "One-time" for token package pricing
   - Enter the price amount and currency
   - Add a price nickname (e.g., "100 Tokens")
   - Click "Add price"
   - Repeat for each token package size

### 4. Configure Webhooks

1. Go to Developers → Webhooks
2. Add an endpoint for your application:
   - Development: `https://your-dev-domain.com/api/subscription/webhooks/stripe`
   - Production: `https://your-production-domain.com/api/subscription/webhooks/stripe`
3. Select the following events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.failed`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
4. Note down the Webhook Signing Secret for each environment
5. Add the webhook secret to your environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 5. Set Up Customer Portal

1. Go to Settings → Customer Portal
2. Configure the following settings:
   - Enable "Allow customers to update their payment methods"
   - Enable "Allow customers to cancel subscriptions"
   - Set the cancellation behavior to "At period end"
   - Configure branding settings to match your application
3. Add your business information:
   - Business name
   - Support email
   - Support phone

### 6. Configure Payment Methods

1. Go to Settings → Payment methods
2. Enable the payment methods you want to support:
   - Credit cards
   - Bank transfers (if applicable)
   - Other payment methods as needed
3. Configure 3D Secure settings for enhanced security

### 7. Test Your Configuration

1. **Use test mode**
   - Ensure you're in test mode (toggle in the dashboard)
   - Use Stripe's test card numbers for testing:
     - `4242 4242 4242 4242` (successful payment)
     - `4000 0000 0000 9995` (declined payment)

2. **Test the checkout flow**
   - Use your frontend to initiate a checkout session
   - Complete a test purchase
   - Verify the webhook events are received
   - Check that the customer is created
   - Verify the subscription or one-time payment is recorded

3. **Test the customer portal**
   - Create a test customer
   - Generate a customer portal session
   - Test subscription management
   - Test payment method updates

### 8. Prepare for Production

1. **Switch to live mode**
   - When ready to accept real payments, switch to live mode
   - Update your API keys in your application
   - Update your webhook endpoints to production URLs

2. **Set up monitoring**
   - Configure Stripe's dashboard alerts
   - Set up error notifications
   - Monitor webhook delivery and failures

3. **Implement proper error handling**
   - Handle declined payments gracefully
   - Implement retry logic for failed webhooks
   - Set up logging for payment-related events

## Implementation Timeline

The Stripe integration will be implemented in phases:

1. **Phase 1: Setup and Configuration** (2 days)
   - Set up Stripe account and configure products/prices
   - Configure webhooks and customer portal
   - Update database schema

2. **Phase 2: Backend Implementation** (4 days)
   - Implement StripeService
   - Enhance PaymentController and TokenPackageController
   - Implement WebhookController
   - Update data access layer

3. **Phase 3: Frontend Implementation** (3 days)
   - Implement CheckoutButton component
   - Create PlanSelection component
   - Develop TokenPackagePurchase component
   - Implement CustomerPortalButton

4. **Phase 4: Testing and Deployment** (2 days)
   - Test the integration in development environment
   - Deploy to staging for user acceptance testing
   - Deploy to production

Total estimated time: 11 days

1. **API Key Protection**
   - Never expose the Stripe secret key in client-side code
   - Use environment variables for all sensitive keys
   - Rotate keys periodically

2. **Webhook Security**
   - Verify webhook signatures to prevent unauthorized requests
   - Use idempotency keys to prevent duplicate processing
   - Implement proper error handling for webhook failures

3. **PCI Compliance**
   - Use Stripe Elements or Checkout to avoid handling raw card data
   - Never store raw credit card information
   - Follow Stripe's security best practices

4. **Data Protection**
   - Encrypt sensitive data in transit and at rest
   - Implement proper access controls for payment data
   - Follow data protection regulations (GDPR, CCPA, etc.)