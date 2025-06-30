# Stripe Integration Data Flow Documentation

## Overview

This document details the data flow patterns in the Short-Video-Creator-Simplified application with Stripe integration. It shows how data moves through the system for subscription management, payment processing, and token allocation while preserving existing business logic. Additionally, it defines the source of truth strategy for different data types to ensure consistency and reliability.

## System Architecture Overview

### Current Data Flow Foundation
```
Frontend (React/Next.js)
    ↓ API Calls
API Gateway
    ↓ Service Routing
Subscription Service ←→ Database (PostgreSQL)
    ↓ Business Logic
Batch Processing ←→ Token Management
```

### Enhanced Data Flow with Stripe
```
Frontend (React/Next.js)
    ↓ API Calls
API Gateway
    ↓ Service Routing
Subscription Service ←→ Database (PostgreSQL)
    ↓ ↑ Stripe Integration
StripeService ←→ Stripe API
    ↓ Webhooks
Webhook Handler ←→ Enhanced Batch Processing
```

## Source of Truth Strategy

### Hybrid Approach: Stripe + Local Database

The system uses a **hybrid model** where different aspects have different sources of truth, with strong synchronization between them to ensure data consistency and reliability.

### Source of Truth Breakdown

#### 1. Payment Processing & Financial Transactions
**Source of Truth: Stripe**
- ✅ **Initial Payments**: Stripe Checkout → Stripe Records → Webhook → Local DB
- ✅ **Renewal Payments**: Stripe Subscription Engine → Stripe Invoice → Webhook → Local DB  
- ✅ **Token Package Purchases**: Stripe Checkout → Stripe PaymentIntent → Webhook → Local DB
- ✅ **Payment Status**: Stripe determines success/failure, local DB mirrors for performance

**Why Stripe?**
- PCI compliance and security
- Built-in retry logic and failed payment handling
- Comprehensive payment method support
- Regulatory compliance (SCA, etc.)
- Detailed transaction records and reporting

#### 2. Subscription Lifecycle & Business Logic
**Source of Truth: Local Database (Enhanced with Stripe sync)**
- ✅ **Subscription Status**: Local DB drives business logic, synced with Stripe
- ✅ **Plan Configuration**: Local DB defines plans, features, and limitations
- ✅ **Business Rules**: Upgrade/downgrade logic, plan restrictions, feature access
- ✅ **Subscription History**: Complete lifecycle tracking in local DB

**Why Local Database?**
- Complex business logic and plan configurations
- Feature access control and limitations
- Custom subscription workflows
- Performance for frequent access checks
- Business intelligence and analytics

#### 3. Token Management & Allocation
**Source of Truth: Local Database (Triggered by Stripe events)**
- ✅ **Token Balances**: Local DB maintains current balances
- ✅ **Token Allocation**: Triggered by Stripe payment webhooks
- ✅ **Token Usage**: Local tracking for service consumption
- ✅ **Token Transactions**: Complete transaction history in local DB

**Why Local Database?**
- Real-time balance checks for service usage
- Complex token allocation rules per plan
- Usage tracking and analytics
- Performance for frequent balance queries

### Source of Truth Matrix

| **Data Type** | **Source of Truth** | **Sync Direction** | **Local Purpose** |
|---------------|-------------------|------------------|------------------|
| **Payment Status** | Stripe | Stripe → Local | Cache for performance |
| **Payment Methods** | Stripe | Stripe → Local | Reference only |
| **Subscription Billing** | Stripe | Stripe → Local | Mirror for business logic |
| **Plan Definitions** | Local DB | Local → Stripe | Business configuration |
| **Subscription Status** | Both (synced) | Bidirectional | Business logic control |
| **Token Balances** | Local DB | Local only | Real-time usage |
| **Token Allocation** | Local DB | Webhook triggered | Business rules |
| **User Preferences** | Local DB | Local only | Application state |
| **Usage Analytics** | Local DB | Local only | Business intelligence |

### Data Consistency Principles

#### For Initial Payments:
- Stripe creates and processes the payment record
- Webhook confirms successful payment to local system
- Local DB records the payment and triggers subscription activation

#### For Renewals:
- Stripe manages billing cycle and payment collection automatically
- Webhook confirms renewal payment success
- Local DB updates subscription period and triggers token allocation

#### For Token Purchases:
- Stripe processes the one-time payment transaction
- Webhook confirms payment success to local system
- Local DB adds tokens to user balance and records transaction

## Core Data Entities

### Database Tables (Enhanced with Stripe Fields)

#### Users Table
```sql
users {
  user_id (PK)
  email
  auth0_id
  stripe_customer_id (NEW) -- Links to Stripe Customer
  created_at
  updated_at
}
```

#### User Subscriptions Table
```sql
user_subscriptions {
  subscription_id (PK)
  user_id (FK)
  plan_id (FK)
  status ('active', 'pending_cancellation', 'cancelled')
  
  -- Stripe Integration Fields
  stripe_subscription_id (NEW) -- Links to Stripe Subscription
  stripe_price_id (NEW) -- Current Stripe Price
  stripe_status (NEW) -- Mirrors Stripe status
  cancel_at_period_end (NEW) -- Stripe cancellation flag
  current_period_start (NEW) -- Synced from Stripe
  current_period_end (NEW) -- Synced from Stripe
  
  start_date
  end_date
  created_at
  updated_at
}
```

#### Payments Table
```sql
payments {
  payment_id (PK)
  user_id (FK)
  subscription_id (FK)
  amount
  currency
  status ('open', 'completed', 'failed')
  payment_type ('subscription', 'token_package')
  
  -- Stripe Integration Fields
  stripe_payment_intent_id (NEW)
  stripe_invoice_id (NEW) -- Key for subscription payments
  stripe_charge_id (NEW)
  payment_method_details (NEW) -- JSONB
  receipt_url (NEW)
  
  billing_period_start
  billing_period_end
  created_at
  updated_at
}
```

#### Plans Table
```sql
plans {
  plan_id (PK)
  name
  price
  billing_frequency ('monthly', 'yearly')
  token_allocation
  features (JSONB)
  
  -- Stripe Integration Fields
  stripe_product_id (NEW)
  stripe_price_id (NEW)
  
  created_at
  updated_at
}
```

#### Token Packages Table
```sql
token_packages {
  package_id (PK)
  name
  token_amount
  price
  
  -- Stripe Integration Fields
  stripe_product_id (NEW)
  stripe_price_id (NEW)
  
  created_at
  updated_at
}
```

## Data Flow Scenarios

### 1. New Subscription Flow

#### Frontend to Backend
```
1. User selects plan on Pricing Page
2. Frontend calls: POST /api/subscription/checkout/create-session
   Request: {
     planId: 2,
     userId: 123,
     priceId: "price_1234..."
   }
```

#### Backend Processing
```
3. API Gateway → Subscription Service
4. SubscriptionController.createCheckoutSession()
5. StripeService.createCustomer() (if needed)
6. Database: UPDATE users SET stripe_customer_id = ?
7. StripeService.createCheckoutSession()
8. Response: { checkoutUrl: "https://checkout.stripe.com/..." }
```

#### Frontend Redirect
```
9. Frontend redirects to Stripe Checkout
10. User completes payment on Stripe
11. Stripe processes payment and creates subscription
```

#### Webhook Processing
```
12. Stripe sends webhook: checkout.session.completed
13. API Gateway → WebhookController.handleStripeWebhook()
14. Verify webhook signature
15. Extract session data and customer info
16. Update database with initial subscription data

17. Stripe sends webhook: invoice.paid
18. WebhookController.handleInvoicePaid()
19. Database: INSERT INTO payments (...)
20. Database: INSERT INTO user_subscriptions (...)
21. Trigger: SubscriptionRenewalsBatch for token allocation
```

#### Final Database State
```sql
-- users table
UPDATE users SET stripe_customer_id = 'cus_1234...' WHERE user_id = 123;

-- user_subscriptions table
INSERT INTO user_subscriptions (
  user_id, plan_id, status,
  stripe_subscription_id, stripe_price_id, stripe_status,
  current_period_start, current_period_end
) VALUES (
  123, 2, 'active',
  'sub_1234...', 'price_1234...', 'active',
  '2024-02-15', '2024-03-15'
);

-- payments table
INSERT INTO payments (
  user_id, subscription_id, amount, status,
  stripe_invoice_id, stripe_payment_intent_id
) VALUES (
  123, 456, 2999, 'completed',
  'in_1234...', 'pi_1234...'
);

-- tokens table (via batch processing)
UPDATE tokens SET balance = balance + 10000 WHERE user_id = 123;
```

### 2. Subscription Renewal Flow

#### Stripe Automated Process
```
1. Stripe subscription engine creates invoice before period end
2. Stripe attempts payment collection
3. Payment succeeds → Stripe sends webhook: invoice.paid
```

#### Webhook Processing
```
4. WebhookController.handleInvoicePaid()
5. Extract invoice and subscription data
6. Database: INSERT INTO payments (
     stripe_invoice_id: "in_5678...",
     amount: 2999,
     status: 'completed'
   )
7. Database: UPDATE user_subscriptions SET
     current_period_start = '2024-03-15',
     current_period_end = '2024-04-15'
8. Trigger: SubscriptionRenewalsBatch
```

#### Enhanced Batch Processing
```
9. SubscriptionRenewalsBatch.process()
10. Find subscriptions needing token allocation
11. TokenService.allocateTokensForPeriod()
12. Database: INSERT INTO token_transactions (
      user_id, transaction_type: 'allocation',
      amount: 10000, description: 'Monthly plan renewal'
    )
13. Database: UPDATE tokens SET balance = balance + 10000
```

### 3. Plan Change Flow

#### Frontend Request
```
1. User selects new plan in dashboard
2. Frontend calls: PUT /api/subscription/subscriptions/456
   Request: {
     planId: 3,
     priceId: "price_5678..."
   }
```

#### Backend Processing
```
3. SubscriptionController.updateSubscription()
4. Validate plan change (upgrade/downgrade logic)
5. StripeService.updateSubscription(
     subscriptionId: "sub_1234...",
     priceId: "price_5678...",
     prorationBehavior: "create_prorations"
   )
```

#### Stripe Processing & Webhooks
```
6. Stripe updates subscription
7. Stripe sends webhook: customer.subscription.updated
8. WebhookController.handleSubscriptionUpdated()
9. Database: UPDATE user_subscriptions SET
     plan_id = 3,
     stripe_price_id = 'price_5678...'
10. Apply plan change logic (immediate or at period end)
```

### 4. Token Package Purchase Flow

#### Frontend to Stripe
```
1. User selects token package
2. Frontend calls: POST /api/subscription/checkout/create-session
   Request: {
     type: 'token_package',
     packageId: 5,
     priceId: "price_tokens_100"
   }
3. Redirect to Stripe Checkout
```

#### Webhook Processing
```
4. Stripe sends: checkout.session.completed
5. WebhookController identifies token package purchase
6. Database: INSERT INTO payments (
     payment_type: 'token_package',
     stripe_payment_intent_id: "pi_9999..."
   )
7. Trigger: Token allocation logic
8. Database: UPDATE tokens SET balance = balance + 5000
9. Database: INSERT INTO token_transactions (...)
```

### 5. Subscription Cancellation Flow

#### Customer Portal Flow
```
1. User clicks "Manage Subscription"
2. Frontend calls: POST /api/subscription/portal/create-session
3. Redirect to Stripe Customer Portal
4. User cancels subscription (at period end)
```

#### Webhook Processing
```
5. Stripe sends: customer.subscription.updated
   { cancel_at_period_end: true }
6. WebhookController.handleSubscriptionUpdated()
7. Database: UPDATE user_subscriptions SET
     cancel_at_period_end = true,
     status = 'pending_cancellation'
```

#### End of Period Processing
```
8. At period end, Stripe sends: customer.subscription.deleted
9. WebhookController.handleSubscriptionDeleted()
10. Database: UPDATE user_subscriptions SET
      status = 'cancelled',
      ended_at = NOW()
11. Trigger: ProcessPendingCancellationsBatch
12. Apply cancellation logic (downgrade to free tier)
```

## Enhanced Batch Processing Data Flow

### 1. CreatePaymentsBatch (Enhanced)
```
Current Logic: Create payment records for renewals
Enhancement: Integrate with Stripe billing data

Data Flow:
1. Query subscriptions nearing renewal
2. Check Stripe for upcoming invoices
3. Create local payment records with Stripe references
4. Coordinate timing with Stripe billing cycles
```

### 2. CollectPaymentsBatch (Enhanced)
```
Current Logic: Process payment collection
Enhancement: Use Stripe payment collection APIs

Data Flow:
1. Query payments with status 'open'
2. Use Stripe APIs to collect payments
3. Update payment status based on Stripe results
4. Handle failed payments with Stripe retry logic
```

### 3. SubscriptionRenewalsBatch (Enhanced)
```
Current Logic: Token allocation and period updates
Enhancement: Webhook-triggered processing

Data Flow:
1. Process webhook-flagged subscriptions
2. Allocate tokens based on plan configuration
3. Update token balances and transaction history
4. Mark renewal processing as complete
```

### 4. ProcessPendingCancellationsBatch (Enhanced)
```
Current Logic: Handle plan changes and cancellations
Enhancement: Coordinate with Stripe subscription status

Data Flow:
1. Query subscriptions with pending changes
2. Verify status with Stripe API
3. Apply plan changes or cancellations
4. Update local subscription status
```

## Error Handling & Data Consistency

### Synchronization Safeguards

#### 1. Webhook-Driven Synchronization
```javascript
// Example: Invoice paid webhook handler
async handleInvoicePaid(event) {
  const invoice = event.data.object;
  
  // Stripe is source of truth for payment
  await this.updatePaymentFromStripe(invoice);
  
  // Local DB is source of truth for business logic
  await this.triggerSubscriptionRenewal(invoice.subscription);
  await this.allocateTokensForPeriod(invoice.customer);
}
```

#### 2. Reconciliation Processes
```javascript
// Daily reconciliation to ensure consistency
async reconcileWithStripe() {
  // Compare critical data points
  const localSubscriptions = await this.getActiveSubscriptions();
  
  for (const subscription of localSubscriptions) {
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );
    
    // Reconcile any discrepancies
    await this.syncSubscriptionStatus(subscription, stripeSubscription);
  }
}
```

#### 3. Implementation Principles
- **Stripe for Financial Operations**: Payment collection, billing cycles, payment methods
- **Local Database for Business Logic**: Plan access control, token management, subscription workflows
- **Idempotent Webhooks**: Prevent duplicate processing using event IDs
- **Event Ordering**: Handle out-of-order webhook delivery gracefully
- **Fallback Reconciliation**: Daily/weekly consistency checks as safety net

### Webhook Processing Failures
```
1. Failed webhook processing logged with full context
2. StripeWebhookProcessingBatch retries failed events
3. Reconciliation with Stripe API data for critical discrepancies
4. Alert on persistent failures requiring manual intervention
```

### Payment Failures
```
1. Stripe handles initial retries with Smart Retry logic
2. webhook: invoice.payment_failed received and processed
3. Update local payment status to 'failed'
4. Customer notification triggered through existing systems
5. Retry logic coordinates with Stripe Smart Retries
6. Final failure handling downgrades subscription appropriately
```

### Data Synchronization
```
1. Real-time: Webhook events keep critical data in sync
2. Batch: Reconciliation processes verify consistency daily
3. Development: Stripe MCP tools for real-time verification
4. Monitoring: Alerts for sync discrepancies and processing failures
5. Recovery: Manual reconciliation procedures for edge cases
```

## API Data Contracts

### Checkout Session Creation
```typescript
// Request
interface CreateCheckoutSessionRequest {
  type: 'subscription' | 'token_package';
  planId?: number;
  packageId?: number;
  priceId: string;
  userId: number;
  successUrl: string;
  cancelUrl: string;
}

// Response
interface CreateCheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}
```

### Webhook Event Processing
```typescript
interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: StripeSubscription | StripeInvoice | StripeCustomer;
  };
  created: number;
}

interface WebhookProcessingResult {
  processed: boolean;
  actions: string[];
  errors?: string[];
}
```

### Subscription Status
```typescript
interface SubscriptionStatus {
  subscriptionId: number;
  planId: number;
  status: 'active' | 'pending_cancellation' | 'cancelled';
  stripeStatus: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  tokenBalance: number;
}
```

## Monitoring & Observability

### Key Metrics
- Webhook processing success rate
- Payment collection success rate  
- Data synchronization accuracy
- Subscription lifecycle event processing time
- Token allocation completion rate

### Logging Points
- All Stripe API interactions
- Webhook event processing
- Database updates triggered by Stripe events
- Batch job execution with Stripe integration
- Error conditions and retry attempts

## Source of Truth Summary

### Quick Reference Guide

**For Payment Operations:**
- ✅ Use Stripe APIs for all payment processing
- ✅ Trust Stripe webhooks for payment status updates
- ✅ Mirror payment data in local DB for performance and reporting

**For Subscription Logic:**
- ✅ Local database drives subscription business rules
- ✅ Stripe handles billing cycles and payment collection
- ✅ Sync subscription status bidirectionally

**For Token Management:**
- ✅ Local database maintains real-time balances
- ✅ Stripe payment events trigger token allocation
- ✅ Local tracking for all token usage and transactions

**For Data Consistency:**
- ✅ Webhook-driven real-time synchronization
- ✅ Daily reconciliation for consistency verification
- ✅ MCP tools for development testing and verification
- ✅ Monitoring and alerts for discrepancy detection

This hybrid approach leverages Stripe's strengths in payment processing while preserving the robust business logic and token management system already built into the application.

---

This data flow documentation ensures that all stakeholders understand how data moves through the enhanced system while preserving the integrity and business logic of the existing subscription infrastructure. 