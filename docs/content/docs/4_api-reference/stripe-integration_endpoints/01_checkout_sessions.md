# Stripe Checkout Session API Reference

The Stripe Checkout Session endpoints handle the creation of secure payment sessions for subscriptions and token packages. These endpoints integrate with Stripe's hosted checkout experience to provide secure payment processing.

**Base URL**: `/api/subscription/checkout`

All endpoints include proper authentication and authorization checks.

---

## Checkout Session Management

### 1. ⏳ Create Subscription Checkout Session

Creates a Stripe checkout session for subscribing to a plan.

**Endpoint**: `POST /create-subscription-session`

**Authentication**: User Authentication Required

**Use Cases**:
- Create a secure checkout session for subscription plan purchases
- Generate Stripe-hosted payment page URLs
- Handle subscription upgrades and downgrades

**Request Body**:
```json
{
  "planId": 2,
  "userId": "123",
  "successUrl": "https://yourdomain.com/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://yourdomain.com/dashboard/subscription/cancel"
}
```

**Required Fields**:
- `planId`: The ID of the subscription plan to purchase (1=Free, 2=Basic, 3=Creator, 4=Professional)
- `userId`: The ID of the user making the purchase
- `successUrl`: URL to redirect after successful payment (supports {CHECKOUT_SESSION_ID} placeholder)
- `cancelUrl`: URL to redirect if payment is cancelled

**Response Example**:
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    "url": "https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
  }
}
```

**Error Response Example**:
```json
{
  "success": false,
  "error": "Invalid plan",
  "message": "Plan with ID 999 not found"
}
```

**Notes**:
- The checkout session expires after 24 hours
- Users will be redirected to Stripe's secure payment page
- The session includes the user's email and billing information if available
- Plan validation ensures only valid subscription plans can be purchased

### 2. ⏳ Create Token Package Checkout Session
Creates a Stripe checkout session for token package purchases.

**Endpoint**: `POST /create-token-package-session`

**Authentication**: User Authentication Required

**Use Cases**:
- Create a secure checkout session for token package purchases
- Allow users to buy additional tokens beyond their subscription allocation

**Request Body**:
```json
{
  "packageId": 1,
  "userId": "123",
  "successUrl": "https://yourdomain.com/dashboard/tokens/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://yourdomain.com/dashboard/tokens/cancel"
}
```

**Required Fields**:
- `packageId`: The ID of the token package to purchase (1=Starter, 2=Creator, 3=Pro, 4=Studio)
- `userId`: The ID of the user making the purchase
- `successUrl`: URL to redirect after successful payment (supports {CHECKOUT_SESSION_ID} placeholder)
- `cancelUrl`: URL to redirect if payment is cancelled

**Response Example**:
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1",
    "url": "https://checkout.stripe.com/pay/cs_test_b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1"
  }
}
```

**Error Response Example**:
```json
{
  "success": false,
  "error": "Invalid package",
  "message": "Token package with ID 999 not found"
}
```

**Notes**:
- Token packages provide additional tokens that don't expire with subscription renewals
- Package validation ensures only valid token packages can be purchased
- Tokens are automatically allocated after successful payment via webhook

### 3. ⏳ Create Customer Portal Session
Creates a Stripe Customer Portal session for subscription management.

**Endpoint**: `POST /create-customer-portal-session`

**Authentication**: User Authentication Required

**Use Cases**:
- Allow users to manage their subscription directly through Stripe
- Enable users to update payment methods, view invoices, and cancel subscriptions
- Provide self-service subscription management

**Request Body**:
```json
{
  "userId": "123",
  "returnUrl": "https://yourdomain.com/dashboard/subscription"
}
```

**Required Fields**:
- `userId`: The ID of the user accessing the portal
- `returnUrl`: URL to redirect to when leaving the portal

**Response Example**:
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/bsess_1234567890abcdef"
  }
}
```

**Error Response Example**:
```json
{
  "success": false,
  "error": "No active subscription",
  "message": "User does not have an active subscription to manage"
}
```

**Notes**:
- The user must have an active Stripe customer record to access the portal
- The portal session expires after 24 hours
- Users can update payment methods, view billing history, and manage subscriptions
- Changes made in the portal are synchronized via webhooks

---

## Common Error Responses

### Authentication Errors
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication token is required"
}
```

### Validation Errors
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Required field 'userId' is missing",
  "details": {
    "field": "userId",
    "code": "REQUIRED"
  }
}
```

### Stripe Integration Errors
```json
{
  "success": false,
  "error": "Stripe error",
  "message": "Unable to create checkout session",
  "details": {
    "stripeError": "Your account cannot currently make live charges."
  }
}
```

---

## Security Considerations

### Authentication
- All checkout endpoints require valid JWT authentication
- User ID in request must match authenticated user (unless admin permissions)
- Service-to-service calls require service authentication token

### Data Validation
- All plan IDs and package IDs are validated against database
- User existence is verified before creating sessions
- URLs are validated for proper format and allowed domains

### Stripe Security
- All communication with Stripe uses HTTPS
- Checkout sessions are created with metadata for verification
- Session URLs are single-use and expire automatically