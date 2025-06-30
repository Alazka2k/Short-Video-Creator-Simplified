# Stripe Integration Overview (Updated)

## Introduction

This document outlines the comprehensive plan for integrating Stripe payment processing into the Short-Video-Creator-Simplified application. Building on our existing robust subscription and payment infrastructure, this integration leverages Stripe Checkout and Customer Portal while preserving our current architecture and business logic.

## Integration Approach

Our Stripe integration builds upon the existing comprehensive subscription system, adding Stripe connectivity while preserving current business logic and data structures:

### Current System Strengths:
- **Complete Payment Infrastructure**: 7-tier subscription plans, token packages, payment tracking
- **Robust Database Schema**: Well-designed tables for subscriptions, payments, tokens, and transactions
- **Comprehensive API Layer**: Full subscription service with authentication and business logic
- **Working Batch Processing**: Established workflows for payment creation, collection, and renewals

### Integration Strategy:
1. **Additive Approach**: Enhance existing tables with Stripe IDs (no structural changes)
2. **Preserve Business Logic**: Maintain current subscription and token management workflows
3. **Stripe MCP Integration**: Leverage MCP tools for development, testing, and administration
4. **Phased Implementation**: Gradual rollout to minimize disruption

### Payment Scenarios:
1. **One-Time Payments**: Token package purchases via **Stripe Checkout**
2. **Subscription Payments**: New subscriptions and plan changes via **Stripe Checkout**
3. **Recurring Payments**: Automated renewals via **Stripe Subscription engine**
4. **Customer Management**: Self-service via **Stripe Customer Portal**

The integration uses **Stripe Webhooks** to synchronize with existing database tables and trigger current business logic workflows.

### Key Components

1.  **Backend Components**:
    *   `StripeService`: New core service in subscription-service for Stripe SDK interactions
    *   **Enhanced Existing Services**: Subscription, Payment, and Token services gain Stripe integration
    *   `WebhookController`: New component for processing Stripe events and updating existing database tables
    *   **Preserved Controllers**: Existing API controllers enhanced with Stripe capabilities
    *   **Minimal Database Changes**: Add Stripe ID columns to existing tables (no structural changes)
    *   **Enhanced Data Access**: Existing DAOs updated to handle Stripe references
    *   **Refined Batch Jobs**: Current batch processing enhanced with Stripe integration:
        *   `CreatePaymentsBatch`: Enhanced for Stripe payment creation
        *   `CollectPaymentsBatch`: Refactored to use Stripe payment collection
        *   `SubscriptionRenewalsBatch`: Enhanced with webhook triggers for token allocation
        *   `ProcessPendingCancellationsBatch`: Integrated with Stripe cancellation workflows
    *   **New API Endpoints**: Stripe-specific endpoints while preserving existing API structure
    *   **Enhanced Routes**: Current routes extended with Stripe functionality

2.  **Frontend Components**:
    *   `CheckoutButton`: New component for Stripe Checkout initiation
    *   **Enhanced Pricing Page**: Integration with existing plan selection UI
    *   `CustomerPortalButton`: New component for subscription self-service
    *   **Enhanced Dashboard**: Existing subscription management enhanced with Stripe features
    *   **Preserved Components**: Current billing and token usage components enhanced with Stripe data
    *   **Payment Flow Enhancement**: Success/failure handling for Stripe transactions

3.  **Stripe MCP Integration**:
    *   **Development Tools**: Real-time Stripe API interaction during development
    *   **Testing Support**: Easy customer and subscription management for testing
    *   **Debugging**: Payment and webhook debugging capabilities
    *   **Administration**: Simplified Stripe resource management

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

## Implementation Timeline (Updated Based on System Analysis)

### Phase 1: Foundation & Setup (3 days)
- Stripe account configuration and product setup
- Database migration for Stripe ID fields
- Environment configuration and MCP integration
- StripeService implementation

### Phase 2: Backend Integration (4 days)
- Webhook handler implementation
- Enhanced batch job integration with Stripe
- API endpoint enhancements
- Customer management integration

### Phase 3: Frontend Integration (3 days)
- Stripe Checkout component implementation
- Customer Portal integration
- Enhanced pricing page and subscription dashboard
- Payment flow UI updates

### Phase 4: Testing & Validation (3 days)
- End-to-end payment flow testing
- Webhook processing validation
- Subscription lifecycle testing
- Integration with existing batch processes

### Phase 5: Production Deployment (2 days)
- Production Stripe configuration
- Live webhook setup and monitoring
- Production deployment and validation

**Total Estimated Time: ~15 days** (includes buffer for thorough testing)

## Security Considerations (Reiterated)

1.  **API Key Protection**: Secure storage (env vars), no client-side exposure, rotation, distinct keys.
2.  **Webhook Security**: **Signature verification is mandatory**, HTTPS, idempotent handlers, monitoring.
3.  **PCI Compliance**: Leverage Stripe Checkout/Portal to minimize scope. Do not handle/store raw card data.
4.  **Data Protection**: Encrypt sensitive data, follow regulations (GDPR, CCPA), implement access controls.