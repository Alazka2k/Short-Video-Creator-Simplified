# Stripe Integration Development Plan (Old)

## Overview

This document outlines the development plan for implementing Stripe payment processing in the Short-Video-Creator-Simplified application. After reviewing the existing architecture, we will **enhance the current subscription service** with full Stripe integration while **preserving existing business logic** and data structures.

## Current System Analysis

### Existing Strengths:
- **Complete Database Schema**: Well-designed subscription, payment, and token management tables with Stripe price IDs already added
- **Comprehensive Subscription Service**: Full subscription service with authentication, business logic, and existing Stripe utilities
- **Working Batch Processing**: Established payment creation, collection, and renewal workflows
- **Frontend Components**: Existing subscription management and billing interfaces
- **API Gateway**: Well-structured routing with proper authentication middleware
- **Existing Stripe Integration**: `StripeService`, `WebhookController`, `PaymentService` already implemented

### Architecture Decision: **Enhance Subscription Service (Not Create Separate Payment Service)**

**Rationale:**
1. **Existing Integration**: Stripe utilities already exist in subscription service
2. **Business Logic Coupling**: Payment and subscription logic are tightly coupled
3. **Reduced Complexity**: Avoid inter-service communication overhead
4. **Current Structure**: Subscription service already handles all payment operations

## Components to Enhance/Develop

### 1. Enhanced Stripe Service (`subscription-service/utils/stripeService.js`)

**Current Status:** ✅ Already implemented with basic functionality
**Enhancement Needed:** Add missing methods and improve error handling

**Additional Methods to Implement:**
- `createCheckoutSession`: For subscription sign-ups and token package purchases
- `createCustomerPortalSession`: For user self-service management
- `retrieveSubscription`: For webhook processing and reconciliation
- `retrieveInvoice`: For payment processing
- `listCustomers`: For admin operations and reconciliation
- Enhanced error handling and retry logic
- Idempotency key support for all operations

### 2. Enhanced Webhook Controller (`subscription-service/controllers/webhookController.js`)

**Current Status:** ✅ Basic structure exists
**Enhancement Needed:** Complete webhook event handling

**Event Handlers to Implement:**
- `checkout.session.completed`: Handle successful subscription sign-ups and token purchases
- `invoice.payment_succeeded`: Process successful recurring payments and token allocation
- `invoice.payment_failed`: Handle failed payments and update subscription status
- `customer.subscription.updated`: Sync subscription changes from Stripe
- `customer.subscription.deleted`: Handle subscription cancellations
- `payment_intent.succeeded`: Process one-time token package purchases
- Event idempotency handling to prevent duplicate processing

### 3. Enhanced Payment Service (`subscription-service/services/paymentService.js`)

**Current Status:** ✅ Already implemented with comprehensive logic
**Enhancement Needed:** Integration with Stripe webhook events

**Methods to Enhance:**
- `handleStripeCheckoutCompleted`: Process checkout completion
- `handleStripeInvoicePaid`: Process successful invoice payments
- `handleStripeSubscriptionUpdated`: Sync subscription status changes
- `createStripeCustomer`: Create customers in Stripe when needed
- Enhanced reconciliation methods for data consistency

### 4. New Checkout Controller (`subscription-service/controllers/checkoutController.js`)

**Current Status:** ✅ Fixed and implemented 
**Purpose:** Handle Stripe Checkout session creation

**Methods to Implement:**
- `createSubscriptionCheckout`: Create checkout for subscription plans
- `createTokenPackageCheckout`: Create checkout for token packages
- `createCustomerPortalSession`: Create customer portal sessions
- Request validation and user authentication handling

### 5. Enhanced Frontend Integration ❌ Needs work

**Approach:** Utilize Stripe Checkout and Customer Portal for seamless payment experience

**Components to Create/Update:**
- **`StripeCheckoutButton`**: Generic button for Stripe checkout sessions
- **`SubscriptionPlanSelector`**: Plan selection with Stripe integration
- **`TokenPackagePurchase`**: Token package purchase with Stripe
- **`CustomerPortalButton`**: Access to Stripe customer portal
- **Updated Pricing Page**: Complete pricing page with Stripe integration

### 6. Enhanced Batch Job Integration 🔄 Needs review

**Enhancement Strategy**: Integrate Stripe capabilities into existing batch jobs while maintaining Stripe as the source of truth for payments:

#### 6.1 **Enhanced `CreatePaymentsBatch`**: 
- **Current Role**: ✅ Creates local payment records in 'open' status when billing period ends
- **Enhancement with Stripe**: Create Stripe subscriptions/invoices instead of local payment records
- **Key Changes**: 
  - Replace local payment creation with Stripe invoice generation
  - Use Stripe's billing cycle management
  - Maintain billing_period_start/end tracking for business logic
- **Preservation**: Keep existing subscription period logic and token allocation timing

#### 6.2 **Enhanced `CollectPaymentsBatch`**: 
- **Current Role**: ✅ Processes payments in 'open' status using payment providers
- **Enhancement with Stripe**: Monitor Stripe payment status and sync to local database
- **Key Changes**:
  - Replace manual payment collection with Stripe payment status monitoring
  - Sync Stripe invoice/payment status to local payments table
  - Handle payment method updates and retry logic via Stripe
- **Preservation**: Maintain existing payment processing workflows and status updates

#### 6.3 **Enhanced `SubscriptionRenewalsBatch`**:
- **Current Role**: ✅ Token allocation and subscription period updates after successful payments
- **Enhancement with Stripe**: Triggered by Stripe webhook events (invoice.paid) instead of local payments
- **Key Changes**:
  - Listen for Stripe invoice.paid events to trigger token allocation
  - Update current_period_start/end based on Stripe billing periods
  - Maintain separation between billing periods (payments) and subscription periods (tokens)
- **Preservation**: Keep existing token allocation business logic and monthly renewal cycles

#### 6.4 **Enhanced `ProcessPendingCancellationsBatch`**:
- **Current Role**: ✅ Handles downgrades, frequency changes, and cancellations to free tier
- **Enhancement with Stripe**: Coordinate local subscription changes with Stripe subscription management
- **Key Changes**:
  - Cancel/modify Stripe subscriptions when processing local cancellations
  - Handle plan changes by creating new Stripe subscriptions
  - Sync Stripe subscription status with local subscription status
- **Preservation**: Maintain existing business logic for plan changes and free tier transitions

#### 6.5 **Modified `RetryFailedPaymentsBatch`**:
- **Current Role**: ✅ Retries failed payments manually with local retry logic
- **Enhancement with Stripe**: Leverage Stripe's automatic retry and dunning management
- **Key Changes**:
  - Stripe handles automatic payment retries and dunning emails
  - Batch job focuses on handling final failure outcomes from Stripe
  - Process subscription downgrades/cancellations after Stripe exhausts retries
- **Consideration**: May be simplified or deprecated as Stripe handles most retry logic

#### 6.6 **New `StripeWebhookProcessingBatch`**:
- **Role**: Handle webhook processing failures and retries
- **Purpose**: Ensure webhook events are processed even during temporary system issues
- **Function**: Retry failed webhook processing and maintain data consistency

### **Summary of Batch Job Changes with Stripe Integration**

#### **Key Architectural Changes:**
1. **Payment Source of Truth**: Stripe becomes the authoritative source for all payment processing
2. **Billing vs Subscription Periods**: Maintain clear separation:
   - `billing_period_start/end` (payments table): Tracks Stripe billing cycles
   - `current_period_start/end` (user_subscriptions table): Tracks business subscription periods for token allocation
3. **Webhook-Driven Updates**: Most database updates triggered by Stripe webhook events rather than batch jobs
4. **Reconciliation Focus**: Batch jobs ensure consistency between Stripe and local database

#### **Preserved Business Logic:**
- ✅ Token allocation timing and amounts remain unchanged
- ✅ Subscription plan change logic (upgrades, downgrades, frequency changes) preserved
- ✅ Cancellation workflows and free tier transitions maintained
- ✅ Monthly renewal cycles and period tracking continue as before

#### **Enhanced Capabilities:**
- 🔄 Real-time payment status updates via webhooks
- 🔄 Automatic payment retry handling by Stripe

## Database Schema Status

### ✅ **Already Completed:**
- Stripe price IDs added to `plans` and `token_packages` tables
- Migration `20250620000001_add_stripe_price_ids.js` successfully applied
- Seed files updated with actual Stripe price IDs

### ✅ **Schema Enhancements Completed:**

**Migration:** `20250620000002_add_stripe_customer_fields.js`

1. **`users` Table:**
   - ✅ Added `stripe_customer_id` (VARCHAR(255), Nullable, Indexed)

2. **`user_subscriptions` Table:**
   - ✅ Renamed `external_subscription_id` → `stripe_subscription_id` (Indexed)
   - ✅ Added `stripe_status` (VARCHAR(50), Nullable) - Mirror Stripe subscription status
   - ✅ Added `cancel_at_period_end` (BOOLEAN, Default: false)
   - ✅ **Note**: `current_period_start` and `current_period_end` already exist in the table

3. **`payments` Table:** 
   - ✅ Renamed `external_payment_id` → `stripe_payment_intent_id` (Indexed)
   - ✅ Added `stripe_invoice_id` (VARCHAR(255), Nullable, Indexed)
   - ✅ Added `stripe_charge_id` (VARCHAR(255), Nullable, Indexed)
   - ✅ Added `receipt_url` (VARCHAR(500), Nullable)
   - ✅ **Note**: Existing `billing_period_start` and `billing_period_end` preserved for business logic

4. **`webhook_events` Table (New):**
   - ✅ `event_id` (VARCHAR(255), Primary Key) - Stripe event ID for idempotency
   - ✅ `event_type` (VARCHAR(100), Not Null) - Event type indexing
   - ✅ `received_at` (TIMESTAMP, Default: now()) - When webhook received
   - ✅ `processed_at` (TIMESTAMP, Nullable) - When successfully processed
   - ✅ `processing_attempts` (INTEGER, Default: 0) - Retry tracking
   - ✅ `last_error` (TEXT, Nullable) - Error logging
   - ✅ `event_data` (JSONB, Nullable) - Full event data for debugging

## API Endpoints Enhancement

### ✅ **Existing Endpoints:** 🔄 Needs review
- `GET /api/subscription/plans` - List subscription plans with Stripe price IDs
- `GET /api/subscription/token-packages` - List token packages with Stripe price IDs
- `POST /api/subscription/webhooks/stripe` - Webhook handler (needs enhancement)
- All subscription management endpoints

**Subscription Endpoints:** 🔄 Needs review
- `POST /api/subscription/subscriptions` - Enhanced with Stripe checkout redirection
- `PUT /api/subscription/subscriptions/:id` - Enhanced with Stripe subscription updates
- `POST /api/subscription/subscriptions/:id/cancel` - Enhanced with Stripe cancellation


### **New Endpoints to Implement:** 🔄 Needs review

1. **Stripe Checkout Integration:**
   - `POST /api/subscription/checkout/create-session` - Create Stripe checkout sessions
   - `POST /api/subscription/portal/create-session` - Create customer portal sessions

2. **Stripe Customer Management:** 🔄 Needs review
   - `POST /api/subscription/customers/create` - Create Stripe customers
   - `GET /api/subscription/customers/:userId/portal` - Get customer portal URL


## Implementation Phases

### **Phase 1: Backend Core Enhancement and Review 🔄 Needs review
1.  Enhance `StripeService` with missing methods
2.  Complete `WebhookController` event handling  
3.  Create `CheckoutController` for session management
4.  Add additional database schema enhancements
5.  Implement webhook event idempotency
6.  Add checkout routes to API Gateway

### **Phase 2: Frontend Integration ❌ Nothing done yet
1. Create Stripe checkout components
2. Implement pricing page with Stripe integration
3. Add customer portal integration
4. Update subscription management UI

### **Phase 3: Batch Job Review and Enhancement 🔄 Needs review
1. Enhance existing batch jobs with Stripe integration
2. Create webhook processing batch job
3. Add Stripe reconciliation utilities

### **Phase 4: Integration of token deduction and limitations for each service ❌ Nothing done yet
1. Enhance existing services deductio of tokens. So either a single service or a job run has a cost when needs to be deducted.
2. Add limitations for each service.

### **Phase 5: Testing & Deployment
1. End-to-end testing with Stripe test mode
2. Webhook testing and validation
3. Production deployment preparation

This enhanced plan leverages your existing robust infrastructure while adding Stripe capabilities in a way that preserves your current business logic and provides a seamless user experience.