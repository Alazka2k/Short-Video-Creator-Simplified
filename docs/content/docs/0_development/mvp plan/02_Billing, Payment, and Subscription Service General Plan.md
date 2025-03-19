Step 1: Database Schema Updates
First, we need to enhance our database schema to support all required functionality:

1.Update plans table:

ALTER TABLE plans ADD COLUMN features JSONB;  // Store available features
ALTER TABLE plans ADD COLUMN restrictions JSONB;  // Store plan restrictions
ALTER TABLE plans ADD COLUMN billing_frequency VARCHAR(10);  // 'monthly' or 'yearly'
ALTER TABLE plans ADD COLUMN annual_price DECIMAL;  // Price for annual billing

2.Update token_transactions table:

ALTER TABLE token_transactions ADD COLUMN service_type VARCHAR(20);  // Type of service used
ALTER TABLE token_transactions ADD COLUMN service_id UUID;  // Generic ID for any service
ALTER TABLE token_transactions ADD COLUMN metadata JSONB;  // Additional transaction data

Step 2: Create Billing Service Architecture
Following the existing service pattern, we'll create:

backend/
  services/
    billing-service/
      data/
        paymentDataAccess.js            // Database operations for payments table
        planDataAccess.js               // Plan-specific operations for plans table
        subscriptionDataAccess.js       // Subscription operations for user_subscriptions table
        tokenTransactionDataAccess.js   // Token transaction operations for token_transactions table
        tokenPackageDataAccess.js       // Token package operations for token_packages table
      middleware/
        stripeWebhook.js                // Stripe webhook handler
      utils/
        stripeHelper.js                 // Stripe API wrapper
        tokenCalculator.js              // Token usage calculations
      billing-subscription-service.js                // Main service logic
      server.js                         // Express server setup
      index.js                          // Service entry point

- Explain and integrate the sripte payment service
- Adapt existing services to use the new billing-subscription-service.js logic for token transactions and plan management.
- Add restrictions and limitation logic as defined in the plans table to the billing-subscription-service.js logic.

Step 3: API Gateway Integration
Add new routes in the API Gateway:

backend/
  api-gateway/
    routes/
      billing.js     // New billing routes
      subscription.js // New subscription routes


Step 4: API Endpoints Implementation

Let's implement these endpoints in phases:

Phase 1 - Core Billing Endpoints:

GET /api/billing/plans
- List available plans with features
- Filter by billing frequency
- Include pricing details

POST /api/billing/subscribe
- Subscribe to a plan
- Handle Stripe payment setup
- Create subscription record

GET /api/billing/subscription
- Get current subscription details
- Include usage statistics
- Show renewal date

Phase 2 - Token Management:

GET /api/billing/usage
- Current token balance
- Usage history
- Service-wise breakdown

POST /api/billing/tokens/purchase
- Purchase additional tokens
- Handle one-time payments
- Update token balance

GET /api/billing/transactions
- List all token transactions
- Filter by service type
- Include metadata

Phase 3 - Subscription Management:
PUT /api/billing/subscription
- Change subscription plan
- Handle prorated charges
- Update token allocations

POST /api/billing/subscription/cancel
- Cancel subscription
- Handle remaining period
- Process refunds if needed

Step 5: Frontend Implementation


