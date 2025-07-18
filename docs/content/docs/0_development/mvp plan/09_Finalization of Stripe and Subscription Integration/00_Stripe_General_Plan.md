# Stripe Integration Plan for Short-Video-Creator-Simplified (Updated)

## Current System Analysis & Status

### Existing Infrastructure
The application has a robust subscription and payment foundation:

**Payment Processing:**
- Complete `payments` table with proper status tracking ('open', 'completed', 'failed')
- Payment records for both subscriptions and token packages
- Comprehensive payment history and transaction tracking

**Subscription Management:**
- Well-structured `user_subscriptions` table with plan associations
- 7-tier plan system (Free, Basic Monthly/Yearly, Creator Monthly/Yearly, Professional Monthly/Yearly)
- Complete `plans` table with pricing, billing frequency, and feature definitions
- Subscription status tracking: `active`, `pending_cancellation`, `cancelled`

**Token System:**
- Complete token allocation and transaction tracking
- `token_packages` table for one-time purchases
- `token_transactions` for usage history
- `tokens` table for current balances

**Batch Processing Infrastructure:**
- Existing batch jobs that need review refactoring
- Strong foundation for payment processing workflows

**API Layer:**
- Comprehensive subscription service with all necessary endpoints
- Proper authentication and authorization
- Service-to-service communication infrastructure

### What Needs Reviewed and Refactored 🔄
1. **Stripe Integration**: Old auth integration
2. **Payment Collection**: Batch jobs need Stripe integration (if required?)
3. **Frontend Payment Flow**: Needs Stripe Checkout integration
4. **Webhook Handling**: Needs implementation for Stripe event processing
5. **Customer Management**: Needs Stripe Customer creation and management
6. **Service Token Deductio Handling for each service**: Not yet implemented.

## Refined Integration Strategy

### Core Principles
1. **Preserve Existing Architecture**: Build on current robust foundation
2. **Selective Refactoring**: Only change what's necessary for Stripe integration
3. **Gradual Implementation**: Phase implementation to minimize disruption
4. **Leverage Stripe MCP**: Use available MCP tools for development and testing

### Payment Flow with Stripe (Using Stripe Checkout)

#### 1. Frontend Initiates Payment
- User selects product (subscription plan or token package)
- Frontend calls backend API (`POST /api/subscription/checkout/create-session`)

#### 2. Backend Creates Checkout Session
- Backend uses `StripeService` to create checkout session
- Session contains product (`priceId`), customer info, success/cancel URLs
- Leverages existing plan/package data with added Stripe IDs

#### 3. Stripe Processes Payment
- User completes payment on Stripe's secure page
- Stripe handles payment processing and subscription creation
- Stripe sends webhook events to backend

#### 4. Backend Updates via Webhooks
- Webhook handler processes events and updates existing database tables
- Maintains current data structure with added Stripe references
- Triggers existing token allocation and subscription management logic

#### 5. User Returns to Application
- Stripe redirects to success URL
- Frontend displays confirmation
- Existing dashboard shows updated subscription status

## Database Schema Enhancements ✅ Already implemented   

### Required Additions: ✅ Already implemented

1. **`users` Table:**
   - ADD: `stripe_customer_id` (VARCHAR, Nullable, Indexed)

2. **`user_subscriptions` Table:**
   - ADD: `stripe_subscription_id` (VARCHAR, Nullable, Indexed)
   - ADD: `stripe_price_id` (VARCHAR, Nullable)
   - ADD: `stripe_status` (VARCHAR, Nullable) - mirrors Stripe status
   - ADD: `cancel_at_period_end` (BOOLEAN, Default: false)
   - ADD: `current_period_start` (TIMESTAMP, Nullable) - synced from Stripe
   - ADD: `current_period_end` (TIMESTAMP, Nullable) - synced from Stripe

3. **`payments` Table:**
   - ADD: `stripe_payment_intent_id` (VARCHAR, Nullable, Indexed)
   - ADD: `stripe_invoice_id` (VARCHAR, Nullable, Indexed)
   - ADD: `stripe_charge_id` (VARCHAR, Nullable, Indexed)
   - ADD: `payment_method_details` (JSONB, Nullable)
   - ADD: `receipt_url` (VARCHAR, Nullable)

4. **`plans` Table:**
   - ADD: `stripe_product_id` (VARCHAR, Nullable)
   - ADD: `stripe_price_id` (VARCHAR, Nullable, Indexed)

5. **`token_packages` Table:**
   - ADD: `stripe_product_id` (VARCHAR, Nullable)
   - ADD: `stripe_price_id` (VARCHAR, Nullable, Indexed)

## Stripe Integration Components

### 1. StripeService (`backend/services/subscription-service/utils/stripeService.js`) 🔄 Needs review
- Stripe client initialization and configuration
- Customer management: `createCustomer`, `getCustomer`
- Checkout Sessions: `createCheckoutSession`
- Customer Portal: `createCustomerPortalSession`
- Subscription Management: `updateSubscription`, `cancelSubscription`
- Webhook verification: `constructWebhookEvent`
- Payment processing: `createPaymentIntent`, `confirmPayment`

### 2. Enhanced Webhook Handler (`backend/services/subscription-service/controllers/webhookController.js`) 🔄 Needs review
- Implement in existing subscription service
- Process key events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`
- Update existing database tables with Stripe data
- Trigger existing batch job logic for token allocation

### 3. Frontend Integration ❌ Needs to be implemented
- `CheckoutButton` component for initiating Stripe Checkout
- `CustomerPortalButton` for subscription management
- Integration with existing pricing page and subscription components
- Enhanced dashboard to show Stripe-powered subscription status

### 4. Refined Batch Job Strategy 🔄 Needs review

**Review the existing batch jobs:**
- `CreatePaymentsBatch`: Enhanced to work with Stripe subscription cycles
- `CollectPaymentsBatch`: Refactored to use Stripe payment collection
- `SubscriptionRenewalsBatch`: Enhanced with Stripe webhook triggers
- `ProcessPendingCancellationsBatch`: Integrated with Stripe cancellation flow

## API Endpoints Strategy

### New Core Endpoints: 🔄 Needs review
1. `POST /api/subscription/checkout/create-session` - Stripe Checkout initiation
2. `POST /api/subscription/portal/create-session` - Customer Portal access
3. `POST /api/subscription/webhooks/stripe` - Stripe event processing

### Enhanced Existing Endpoints: 🔄 Needs review
- All existing subscription endpoints remain functional
- Added Stripe integration behind the scenes
- Maintain backward compatibility

### Stripe MCP Integration in Cursor:
- Use MCP tools for development testing
- Real-time Stripe API interaction during development
- Easy customer/subscription management for testing
- Payment debugging and monitoring

## Implementation Phases

### Phase 1: Foundation Setup 🔄 Needs review
- Stripe account configuration and product setup
- Database schema migration
- StripeService implementation
- Environment configuration

### Phase 2: Core Integration 🔄 Needs review
- Webhook handler implementation
- Enhanced batch job integration
- API endpoint implementation
- Customer management integration

### Phase 3: Frontend Integration ❌ Needs to be implemented
- Stripe Checkout components
- Customer Portal integration
- Enhanced subscription dashboard
- Payment success/failure flows

## Phase 4: Review Batch Integration 🔄 Needs review
- If covered with logic from stripe