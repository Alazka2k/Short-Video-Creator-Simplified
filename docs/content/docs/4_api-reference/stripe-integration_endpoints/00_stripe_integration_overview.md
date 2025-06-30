# Stripe Integration API Reference

The Stripe Integration provides secure payment processing capabilities for subscription plans and token package purchases. This integration handles checkout sessions, customer portal access, and real-time webhook processing.

**Base URL**: `/api/subscription`

All endpoints include proper authentication and authorization checks.

---

## Available Endpoint Categories

### 1. Checkout Session Management
Handles secure payment session creation for subscriptions and token packages.

**Endpoints**:
- `POST /checkout/create-subscription-session` - Create subscription checkout sessions
- `POST /checkout/create-token-package-session` - Create token package checkout sessions  
- `POST /checkout/create-customer-portal-session` - Create customer portal sessions

**Documentation**: [Checkout Sessions](./01_checkout_sessions.md)

### 2. Webhook Event Processing
Processes real-time notifications from Stripe for payment and subscription events.

**Endpoints**:
- `POST /webhooks/stripe` - Process Stripe webhook events

**Supported Events**:
- `checkout.session.completed` - Payment completion
- `payment_intent.succeeded` - Successful payments
- `payment_intent.payment_failed` - Failed payments
- `invoice.payment_succeeded` - Subscription renewals
- `invoice.payment_failed` - Failed renewals
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Subscription cancellations

**Documentation**: [Webhook Endpoints](./02_webhook_endpoints.md)

---

## Authentication Requirements

### User Authentication
Most checkout endpoints require user authentication:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### Webhook Authentication
Webhook endpoints use Stripe signature verification:
```
Content-Type: application/json
Stripe-Signature: t=timestamp,v1=signature_hash
x-service-auth: {service_auth_token}
```

### Service Authentication
Internal service calls require service authentication:
```
x-service-auth: {service_auth_token}
Content-Type: application/json
```

---

## Integration Workflow

### Subscription Purchase Flow
1. **Create Checkout Session**: `POST /checkout/create-subscription-session`
2. **User Completes Payment**: Stripe hosted checkout page
3. **Webhook Processing**: `POST /webhooks/stripe` (checkout.session.completed)
4. **Subscription Activation**: Automatic subscription creation and token allocation

### Token Package Purchase Flow
1. **Create Checkout Session**: `POST /checkout/create-token-package-session`
2. **User Completes Payment**: Stripe hosted checkout page
3. **Webhook Processing**: `POST /webhooks/stripe` (checkout.session.completed)
4. **Token Allocation**: Automatic token allocation to user account

### Subscription Management Flow
1. **Create Portal Session**: `POST /checkout/create-customer-portal-session`
2. **User Manages Subscription**: Stripe customer portal
3. **Webhook Processing**: Various subscription update webhooks
4. **Data Synchronization**: Automatic sync with local database

---

## Data Flow Integration

### Customer Management
- Stripe customers are automatically created during first purchase
- Customer IDs are stored in local database for future reference
- Customer portal provides self-service subscription management

### Subscription Synchronization
- Subscription status is synchronized via webhooks
- Plan changes are reflected in token allocations
- Billing periods are tracked for renewal processing

### Payment Processing
- All payments are processed securely through Stripe
- Payment records are created in local database
- Failed payments trigger appropriate user notifications

### Token Allocation
- Subscription tokens are allocated monthly based on plan
- Token package purchases provide immediate token allocation
- Token balances are updated in real-time via webhooks

---

## Error Handling

### Common Error Responses

**Authentication Errors**:
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication token is required"
}
```

**Validation Errors**:
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Required field missing",
  "details": {
    "field": "planId",
    "code": "REQUIRED"
  }
}
```

**Stripe Integration Errors**:
```json
{
  "success": false,
  "error": "Stripe error",
  "message": "Unable to create checkout session",
  "details": {
    "stripeError": "Account configuration error"
  }
}
```

### Error Recovery
- Failed webhook events are automatically retried by Stripe
- Database transactions ensure data consistency
- Manual intervention procedures for persistent failures

---

## Security Features

### Payment Security
- All payments processed through Stripe's secure infrastructure
- PCI DSS compliance handled by Stripe
- No sensitive payment data stored locally

### Webhook Security
- Webhook signature verification prevents unauthorized requests
- Idempotency protection prevents duplicate processing
- Event logging for audit trails

### Data Protection
- User data encrypted in transit and at rest
- Access controls based on user authentication
- Service-to-service authentication for internal calls

---

## Testing and Development

### Test Environment
- Use Stripe test keys for development
- Test webhook events with Stripe CLI
- Validate all payment flows before production

### Monitoring
- Track webhook processing success rates
- Monitor payment completion rates
- Alert on failed webhook processing

### Documentation References
- [Checkout Sessions API](./01_checkout_sessions.md)
- [Webhook Processing API](./02_webhook_endpoints.md)
- [Subscription Management API](../subscription_endpoints/02_subscription_management.md)
- [Payment Management API](../subscription_endpoints/06_payment_management.md)

---

## Quick Start Guide

### 1. Environment Setup
```bash
# Set required environment variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SERVICE_AUTH_TOKEN=your_service_token
```

### 2. Create Subscription Checkout
```bash
curl -X POST http://localhost:3001/api/subscription/checkout/create-subscription-session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": 2,
    "userId": "123",
    "successUrl": "https://yourdomain.com/success",
    "cancelUrl": "https://yourdomain.com/cancel"
  }'
```

### 3. Configure Webhooks
Set up webhook endpoint in Stripe dashboard:
```
Endpoint URL: https://yourdomain.com/api/subscription/webhooks/stripe
Events: checkout.session.completed, payment_intent.succeeded, invoice.payment_succeeded
```

### 4. Test Webhook Processing
```bash
# Use Stripe CLI for local testing
stripe listen --forward-to localhost:3001/api/subscription/webhooks/stripe
stripe trigger checkout.session.completed
``` 