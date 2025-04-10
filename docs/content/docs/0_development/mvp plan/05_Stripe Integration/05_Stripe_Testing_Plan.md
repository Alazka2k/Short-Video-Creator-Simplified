# Stripe Integration Testing Plan (Revised)

## Overview

This document outlines the comprehensive testing strategy for the Stripe payment integration in the Short-Video-Creator-Simplified application. The testing plan has been revised to align with our updated integration approach, which leverages Stripe Checkout, Customer Portal, and webhook-driven synchronization. This plan covers all aspects of testing, from unit tests to end-to-end integration tests, and includes specific test cases for various payment scenarios.

## Test Environment Setup

1. **Configure Test API Keys**
   - Set up Stripe test API keys in development environment
   - Configure webhook endpoints for testing

2. **Set Up Test Data**
   - Create test products for subscription tiers
   - Create test products for token packages
   - Create test prices for different billing frequencies
   - Create test prices for token packages
   - Create test customers

3. **Configure Test Webhooks**
   - Set up ngrok for local webhook testing
   - Configure webhook endpoints in Stripe dashboard
   - Set up webhook signature verification
   - Configure webhook events to listen for:
     - `checkout.session.completed`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

4. **Configure Customer Portal**
   - Set up test Customer Portal configuration
   - Configure allowed actions (update payment methods, cancel subscriptions)
   - Set up branding and return URL

## Unit Tests

### 1. StripeService Tests

```javascript
// tests/unit/stripeService.test.js

describe('StripeService', () => {
  let stripeService;
  
  beforeEach(() => {
    // Setup
  });
  
  test('createCustomer should create a customer', async () => {
    // Test implementation
  });
  
  test('createCheckoutSession should create a session for subscription', async () => {
    // Test implementation
  });
  
  test('createCheckoutSession should create a session for token package', async () => {
    // Test implementation
  });
  
  test('createCustomerPortalSession should create a portal session', async () => {
    // Test implementation
  });
  
  test('updateSubscription should update a subscription', async () => {
    // Test implementation
  });
  
  test('cancelSubscription should cancel a subscription', async () => {
    // Test implementation
  });
  
  test('constructWebhookEvent should verify webhook signature', () => {
    // Test implementation
  });
  
  test('getSubscription should retrieve a subscription', async () => {
    // Test implementation
  });
  
  test('getInvoice should retrieve an invoice', async () => {
    // Test implementation
  });
});
```

### 2. WebhookController Tests

```javascript
// tests/unit/webhookController.test.js

describe('WebhookController', () => {
  let webhookController;
  let paymentService;
  let stripeService;
  let subscriptionService;
  let tokenService;
  
  beforeEach(() => {
    // Setup
  });
  
  test('handleStripeWebhook should verify webhook signature', async () => {
    // Test implementation
  });
  
  test('handleCheckoutSessionCompleted should process completed checkout', async () => {
    // Test implementation
  });
  
  test('handleInvoicePaid should process successful invoice', async () => {
    // Test implementation
  });
  
  test('handleInvoicePaymentFailed should handle failed invoice', async () => {
    // Test implementation
  });
  
  test('handleSubscriptionCreated should handle new subscription', async () => {
    // Test implementation
  });
  
  test('handleSubscriptionUpdated should handle subscription update', async () => {
    // Test implementation
  });
  
  test('handleSubscriptionDeleted should handle subscription deletion', async () => {
    // Test implementation
  });
  
  test('should implement idempotency check for webhook events', async () => {
    // Test implementation
  });
});
```

### 3. PaymentController Tests

```javascript
// tests/unit/paymentController.test.js

describe('PaymentController', () => {
  let paymentController;
  let paymentService;
  let stripeService;
  
  beforeEach(() => {
    // Setup
  });
  
  test('createCheckoutSession should create a session for subscription', async () => {
    // Test implementation
  });
  
  test('createCheckoutSession should create a session for token package', async () => {
    // Test implementation
  });
  
  test('getPaymentHistory should retrieve user payment history', async () => {
    // Test implementation
  });
  
  test('getPaymentSummary should retrieve user payment summary', async () => {
    // Test implementation
  });
});
```

### 4. SubscriptionController Tests

```javascript
// tests/unit/subscriptionController.test.js

describe('SubscriptionController', () => {
  let subscriptionController;
  let subscriptionService;
  let stripeService;
  
  beforeEach(() => {
    // Setup
  });
  
  test('createCustomerPortalSession should create a portal session', async () => {
    // Test implementation
  });
  
  test('updateSubscription should update a subscription', async () => {
    // Test implementation
  });
  
  test('cancelSubscription should cancel a subscription', async () => {
    // Test implementation
  });
  
  test('getSubscription should retrieve a subscription', async () => {
    // Test implementation
  });
  
  test('getSubscriptions should retrieve user subscriptions', async () => {
    // Test implementation
  });
});
```

### 5. TokenPackageController Tests

```javascript
// tests/unit/tokenPackageController.test.js

describe('TokenPackageController', () => {
  let tokenPackageController;
  let tokenPackageService;
  
  beforeEach(() => {
    // Setup
  });
  
  test('getTokenPackages should retrieve available packages', async () => {
    // Test implementation
  });
  
  test('getTokenBalance should retrieve user token balance', async () => {
    // Test implementation
  });
  
  test('getTokenTransactions should retrieve user token transactions', async () => {
    // Test implementation
  });
});
```

## Integration Tests

### 1. Checkout Flow Tests

```javascript
// tests/integration/checkoutFlow.test.js

describe('Checkout Flow', () => {
  test('should create a checkout session for subscription', async () => {
    // Test implementation
  });
  
  test('should create a checkout session for token package', async () => {
    // Test implementation
  });
  
  test('should handle successful checkout completion', async () => {
    // Test implementation
  });
  
  test('should handle cancelled checkout', async () => {
    // Test implementation
  });
  
  test('should process webhook events after successful checkout', async () => {
    // Test implementation
  });
});
```

### 2. Customer Portal Flow Tests

```javascript
// tests/integration/customerPortalFlow.test.js

describe('Customer Portal Flow', () => {
  test('should create a customer portal session', async () => {
    // Test implementation
  });
  
  test('should handle subscription update via portal', async () => {
    // Test implementation
  });
  
  test('should handle subscription cancellation via portal', async () => {
    // Test implementation
  });
  
  test('should handle payment method update via portal', async () => {
    // Test implementation
  });
  
  test('should process webhook events after portal actions', async () => {
    // Test implementation
  });
});
```

### 3. Webhook Tests

```javascript
// tests/integration/webhook.test.js

describe('Webhook Handling', () => {
  test('should handle checkout.session.completed event', async () => {
    // Test implementation
  });
  
  test('should handle invoice.paid event', async () => {
    // Test implementation
  });
  
  test('should handle invoice.payment_failed event', async () => {
    // Test implementation
  });
  
  test('should handle customer.subscription.created event', async () => {
    // Test implementation
  });
  
  test('should handle customer.subscription.updated event', async () => {
    // Test implementation
  });
  
  test('should handle customer.subscription.deleted event', async () => {
    // Test implementation
  });
  
  test('should reject invalid webhook signatures', async () => {
    // Test implementation
  });
  
  test('should implement idempotency for duplicate events', async () => {
    // Test implementation
  });
});
```

### 4. SubscriptionRenewalsBatch Tests

```javascript
// tests/integration/subscriptionRenewalsBatch.test.js

describe('SubscriptionRenewalsBatch', () => {
  test('should allocate tokens for subscriptions with successful renewals', async () => {
    // Test implementation
  });
  
  test('should not allocate tokens for subscriptions without successful renewals', async () => {
    // Test implementation
  });
  
  test('should handle token allocation for different plan tiers', async () => {
    // Test implementation
  });
  
  test('should mark token allocation as complete for processed subscriptions', async () => {
    // Test implementation
  });
});
```

## End-to-End Tests

### 1. Frontend Checkout Flow Tests

```javascript
// tests/e2e/checkoutFlow.test.js

describe('Checkout Flow', () => {
  test('should display plan selection page', async () => {
    // Test implementation
  });
  
  test('should display token package selection page', async () => {
    // Test implementation
  });
  
  test('should redirect to Stripe Checkout', async () => {
    // Test implementation
  });
  
  test('should handle successful payment completion', async () => {
    // Test implementation
  });
  
  test('should handle cancelled payment', async () => {
    // Test implementation
  });
  
  test('should display success message after payment', async () => {
    // Test implementation
  });
  
  test('should display error message for failed payment', async () => {
    // Test implementation
  });
});
```

### 2. Frontend Customer Portal Flow Tests

```javascript
// tests/e2e/customerPortalFlow.test.js

describe('Customer Portal Flow', () => {
  test('should redirect to Stripe Customer Portal', async () => {
    // Test implementation
  });
  
  test('should handle return from Customer Portal', async () => {
    // Test implementation
  });
  
  test('should display updated subscription status after portal changes', async () => {
    // Test implementation
  });
  
  test('should display updated payment method after portal changes', async () => {
    // Test implementation
  });
});
```

### 3. Complete User Journey Tests

```javascript
// tests/e2e/userJourney.test.js

describe('User Journey', () => {
  test('should sign up and subscribe to a plan via Checkout', async () => {
    // Test implementation
  });
  
  test('should purchase a token package via Checkout', async () => {
    // Test implementation
  });
  
  test('should use tokens for content generation', async () => {
    // Test implementation
  });
  
  test('should manage subscription via Customer Portal', async () => {
    // Test implementation
  });
  
  test('should upgrade subscription via Customer Portal', async () => {
    // Test implementation
  });
  
  test('should downgrade subscription via Customer Portal', async () => {
    // Test implementation
  });
  
  test('should cancel subscription via Customer Portal', async () => {
    // Test implementation
  });
  
  test('should update payment method via Customer Portal', async () => {
    // Test implementation
  });
});
```

## Test Scenarios

### 1. Checkout Scenarios

1. **Subscription Checkout**
   - New customer subscription
   - Existing customer subscription
   - Different plan tiers
   - Different billing frequencies

2. **Token Package Checkout**
   - New customer purchase
   - Existing customer purchase
   - Different package sizes
   - Multiple purchases

3. **Checkout Completion**
   - Successful payment
   - Cancelled payment
   - Failed payment
   - 3D Secure authentication required

### 2. Customer Portal Scenarios

1. **Subscription Management**
   - View subscription details
   - Update subscription (upgrade/downgrade)
   - Cancel subscription
   - Reactivate subscription

2. **Payment Method Management**
   - View payment methods
   - Add new payment method
   - Update default payment method
   - Remove payment method

3. **Invoice Management**
   - View invoice history
   - Download invoices
   - View upcoming invoices

### 3. Webhook Scenarios

1. **Checkout Events**
   - `checkout.session.completed`
   - `checkout.session.expired`

2. **Subscription Events**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`

3. **Invoice Events**
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.upcoming`

4. **Error Scenarios**
   - Invalid signature
   - Duplicate events
   - Processing errors
   - Idempotency handling

### 4. Token Allocation Scenarios

1. **Subscription Renewal**
   - Successful renewal and token allocation
   - Failed renewal and no token allocation
   - Different token amounts for different plans

2. **Token Package Purchase**
   - Successful purchase and token addition
   - Failed purchase and no token addition
   - Different token amounts for different packages

3. **Token Usage**
   - Token deduction for content generation
   - Insufficient tokens handling
   - Token balance tracking

### 5. Database Synchronization Scenarios

1. **User Data**
   - Stripe customer ID storage
   - Customer ID retrieval

2. **Subscription Data**
   - Stripe subscription ID storage
   - Subscription status synchronization
   - Billing period synchronization
   - Cancellation flag synchronization

3. **Payment Data**
   - Payment record creation
   - Payment status synchronization
   - Invoice ID storage
   - Payment method details storage

## Rollback Testing

1. **Database Rollback**
   - Verify no schema changes
   - Verify data integrity

2. **Code Rollback**
   - Revert to previous version
   - Verify functionality

3. **Configuration Rollback**
   - Revert environment variables
   - Disable webhooks
   - Verify system behavior

## Quality Assurance

### 1. Code Review Checklist

- [ ] Proper error handling
- [ ] Input validation
- [ ] Secure API key storage
- [ ] Webhook signature verification
- [ ] Proper logging
- [ ] Transaction management
- [ ] Token balance consistency
- [ ] Payment status consistency
- [ ] Idempotency implementation

### 2. Security Testing

- [ ] API key exposure
- [ ] Webhook signature verification
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting

### 3. Performance Testing

- [ ] Checkout session creation time
- [ ] Customer Portal session creation time
- [ ] Webhook processing time
- [ ] Token allocation time
- [ ] API response time
- [ ] Concurrent request handling

### 4. Monitoring and Alerts

- [ ] Webhook failure alerts
- [ ] Token allocation failure alerts
- [ ] API error rate monitoring
- [ ] Performance monitoring
- [ ] Database synchronization monitoring

## Test Data Management

### 1. Test Data Setup Scripts

```javascript
// scripts/setup-test-data.js

async function setupTestData() {
  // Create test products
  // Create test prices
  // Create test customers
  // Create test subscriptions
  // Create test token packages
  // Create test payments
}
```

### 2. Test Data Cleanup Scripts

```javascript
// scripts/cleanup-test-data.js

async function cleanupTestData() {
  // Delete test products
  // Delete test prices
  // Delete test customers
  // Delete test subscriptions
  // Delete test token packages
  // Delete test payments
}
```

## Continuous Integration

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/stripe-tests.yml

name: Stripe Integration Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Run e2e tests
        run: npm run test:e2e
```

## Test Reporting

### 1. Test Results Dashboard

- Unit test coverage
- Integration test results
- E2E test results
- Performance metrics
- Error rates

### 2. Test Execution Logs

- Test execution time
- Test failures
- Error messages
- Stack traces

## Timeline

1. **Test Environment Setup** - 1 day
2. **Unit Tests** - 2 days
3. **Integration Tests** - 2 days
4. **End-to-End Tests** - 2 days
5. **Test Execution and Reporting** - 1 day

Total estimated time: 8 days 