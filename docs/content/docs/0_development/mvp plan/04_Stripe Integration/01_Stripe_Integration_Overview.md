# Stripe Integration Overview

## Introduction

This document outlines the comprehensive plan for integrating Stripe payment processing into the Short-Video-Creator-Simplified application. It provides a high-level overview of the integration approach, leveraging Stripe Checkout and Customer Portal, and includes a detailed manual for setting up Stripe for our application.

## Integration Approach

Our Stripe integration will utilize Stripe's hosted solutions for a secure and streamlined experience, focusing on two main scenarios:

1.  **One-Time Payments**: For token package purchases or initial plan payments/upgrades, handled via **Stripe Checkout**.
2.  **Recurring Payments**: Automated subscription renewals managed directly by **Stripe's Subscription engine**.

The integration relies heavily on **Stripe Webhooks** to keep our application's database synchronized with events occurring in Stripe (e.g., successful payments, subscription changes, failed renewals). We will implement frontend components to initiate these flows and backend services to handle the Stripe API interactions and webhook processing.

### Key Components

1.  **Backend Components**:
    *   `StripeService`: Core service abstracting Stripe SDK interactions (customer creation, Checkout/Portal session creation, subscription updates/cancellations, webhook verification).
    *   Enhanced Services (`PaymentService`, `TokenPackageService`, `SubscriptionService`): Business logic updated to interact with `StripeService` and handle application state based on Stripe events.
    *   `WebhookController`: **Crucial component** for receiving, verifying, and processing Stripe webhook events, triggering updates in other services and the database.
    *   Controllers (`PaymentController`, `SubscriptionController`, `TokenPackageController`): Handle API requests from the frontend, orchestrate calls to `StripeService` (e.g., to create Checkout/Portal sessions, update/cancel subscriptions), and manage local application state changes.
    *   Database Schema Updates: Incorporate necessary Stripe IDs (`stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `stripe_invoice_id`, etc.) into relevant tables (`users`, `user_subscriptions`, `payments`, `plans`, `token_packages`).
    *   Data Access Layer Updates: Methods to read/write Stripe-related data.
    *   Batch Jobs (Revised Roles):
        *   `SubscriptionRenewalsBatch`: Primarily responsible for **token allocation** triggered by successful payment webhooks (`invoice.paid`).
        *   Other payment/retry batches (`CreatePayments`, `CollectPayments`, `RetryFailedPayments`, `ProcessPendingCancellations`) are largely **eliminated or repurposed**, relying instead on Stripe's automation and webhook handlers. (Optional: `ReconciliationBatch`).
    *   API Endpoints: New endpoints for creating Checkout/Portal sessions; revised endpoints for managing local subscriptions trigger corresponding Stripe actions. Critical webhook endpoint.
    *   API Routes: Updated routes (`paymentRoutes.js`, `subscriptionRoutes.js`, `webhookRoutes.js`, etc.) to reflect the new/revised endpoints.

2.  **Frontend Components**:
    *   `CheckoutButton`: Initiates backend calls to create Checkout sessions and redirects users to Stripe Checkout.
    *   `PlanSelection`: Displays subscription plans and utilizes `CheckoutButton`.
    *   `TokenPackagePurchase`: Displays token packages and utilizes `CheckoutButton`.
    *   `CustomerPortalButton`: Initiates backend calls to create Customer Portal sessions and redirects users to manage subscriptions/billing.
    *   `SubscriptionManagement`, `TokenBalance`, `UserDashboard`: Display user's subscription status, token balance, and provide access points for purchasing or managing subscriptions via `CheckoutButton` or `CustomerPortalButton`. Data displayed is based on backend state synchronized via webhooks.

## Stripe Setup Manual

*(This section remains largely the same as setting up products, keys, webhooks, and the portal is still necessary regardless of the exact integration pattern)*

### 1. Create a Stripe Account

1.  **Sign up for Stripe**: Go to [stripe.com](https://stripe.com), sign up, and verify your email.
2.  **Complete Business Profile**: Provide business details, banking info, and tax ID.
3.  **Verify Identity**: Complete required identity verification steps.

### 2. Configure API Keys

1.  Navigate to Developers → API keys in the Stripe Dashboard.
2.  Note both **Publishable key** (`pk_test_...`/`pk_live_...`) and **Secret key** (`sk_test_...`/`sk_live_...`).
3.  Add keys securely to your backend environment variables (e.g., `.env`):
    ```
    STRIPE_PUBLISHABLE_KEY=pk_test_... # Or pk_live_... for production
    STRIPE_SECRET_KEY=sk_test_...    # Or sk_live_... for production
    ```
4.  Add the Publishable key to your frontend environment variables (e.g., `.env.local`):
    ```
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Or pk_live_...
    ```

### 3. Set Up Products and Prices

1.  **Create Subscription Products**: In Stripe Dashboard (Products → Add product), create a Product for each subscription tier (e.g., "Basic", "Creator").
2.  **Create Recurring Prices**: For each Product, add Prices corresponding to billing frequencies (e.g., "Monthly Basic", "Yearly Basic"). Note the `price_...` IDs.
3.  **Create Token Package Products**: Create a Product for each token package size (e.g., "100 Token Package").
4.  **Create One-Time Prices**: For each token package Product, add a one-time Price. Note the `price_...` IDs.

### 4. Configure Webhooks

1.  Go to Developers → Webhooks in the Stripe Dashboard.
2.  Add an endpoint pointing to your backend webhook handler:
    *   Development (using tunneling like ngrok): `https://<your-ngrok-url>/api/subscription/webhooks/stripe`
    *   Production: `https://<your-production-domain>/api/subscription/webhooks/stripe`
3.  **Listen to necessary events**: Select events crucial for synchronization. A good starting list includes:
    *   `checkout.session.completed`
    *   `invoice.paid` (replaces `payment_intent.succeeded` for subscriptions)
    *   `invoice.payment_failed`
    *   `customer.subscription.created`
    *   `customer.subscription.updated`
    *   `customer.subscription.deleted`
    *   (Optionally: `payment_intent.succeeded` / `failed` if needed for non-subscription flows, `customer.subscription.trial_will_end`)
4.  Note the **Webhook Signing Secret** (`whsec_...`) for each endpoint (dev/prod).
5.  Add the signing secret to your backend environment variables:
    ```
    STRIPE_WEBHOOK_SECRET=whsec_...
    ```

### 5. Set Up Customer Portal

1.  Go to Settings → Customer Portal in the Stripe Dashboard.
2.  Configure settings:
    *   Enable updates for payment methods.
    *   Enable subscription cancellations (usually "At period end").
    *   Configure branding, business information, links to terms/privacy policy.

### 6. Configure Payment Methods

1.  Go to Settings → Payment methods.
2.  Enable desired payment methods (Cards are default; consider others like SEPA, Bancontact, etc., supported by Checkout).
3.  Review 3D Secure settings (usually recommended).

### 7. Test Your Configuration

1.  **Use Test Mode**: Ensure your Stripe Dashboard is in "Test mode".
2.  **Use Test Cards**: Use Stripe's provided test card numbers.
3.  **Test Checkout Flow**: Initiate subscription/token purchase from your frontend, complete the Stripe Checkout flow, verify redirection, check for successful webhook delivery and processing (database updates, token allocation).
4.  **Test Customer Portal**: Initiate portal session from your frontend, redirect, test updating payment methods, cancelling subscriptions, verify webhooks are received and processed.
5.  **Test Subscription Lifecycle**: Simulate renewals (using Stripe CLI or waiting in test mode), upgrades, downgrades, cancellations, and failed payments; verify webhook handling for each case.

### 8. Prepare for Production

1.  **Switch to Live Mode**: Toggle Stripe Dashboard to "Live mode".
2.  **Update Keys/Secrets**: Use live API keys and webhook secrets in your production environment variables.
3.  **Update Webhook Endpoint URL**: Ensure the production webhook endpoint URL is configured in Stripe.
4.  **Monitoring**: Set up Stripe alerts, application-level monitoring for webhook processing, error logging.
5.  **Error Handling**: Ensure graceful handling of payment declines and webhook processing errors.

## Implementation Timeline (Estimate - May need adjustment based on webhook complexity)

1.  **Phase 1: Setup and Configuration (2 days)**: Stripe account setup, Products/Prices, Webhook endpoint creation, Customer Portal config, DB Schema migration script.
2.  **Phase 2: Backend Implementation (5 days)**: Implement `StripeService`, core API endpoints (Checkout/Portal session creation), critical `WebhookController` logic, update data access, implement refined `SubscriptionRenewalsBatch`.
3.  **Phase 3: Frontend Implementation (3 days)**: Implement `CheckoutButton`, `CustomerPortalButton`, integrate into UI flows.
4.  **Phase 4: Testing and Deployment (2+ days)**: **Crucial** end-to-end testing focusing on webhook scenarios, subscription lifecycle, error handling. Staging deployment, UAT, Production deployment.

Total estimated time: ~12 days (flexible based on testing depth).

## Security Considerations (Reiterated)

1.  **API Key Protection**: Secure storage (env vars), no client-side exposure, rotation, distinct keys.
2.  **Webhook Security**: **Signature verification is mandatory**, HTTPS, idempotent handlers, monitoring.
3.  **PCI Compliance**: Leverage Stripe Checkout/Portal to minimize scope. Do not handle/store raw card data.
4.  **Data Protection**: Encrypt sensitive data, follow regulations (GDPR, CCPA), implement access controls.