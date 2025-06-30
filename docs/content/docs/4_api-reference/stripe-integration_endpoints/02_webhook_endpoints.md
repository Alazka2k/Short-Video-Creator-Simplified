# Stripe Webhook API Reference

The Stripe Webhook endpoints handle real-time notifications from Stripe about payment events, subscription changes, and customer updates. These endpoints ensure data synchronization between Stripe and the local system.

**Base URL**: `/api/subscription/webhooks`

All endpoints include proper Stripe signature verification for security.

---

## Webhook Event Processing

### 1. ⏳ Stripe Webhook Handler
Receives and processes webhook events from Stripe.

**Endpoint**: `POST /stripe`

**Authentication**: Stripe Signature Verification

**Use Cases**:
- Process payment completion events
- Handle subscription lifecycle changes
- Synchronize customer data between Stripe and local system
- Allocate tokens after successful purchases

**Request Headers**:
```
Content-Type: application/json
Stripe-Signature: t=1234567890,v1=signature_hash
x-service-auth: your_service_auth_token
```

**Supported Webhook Events**:

#### A. checkout.session.completed
**Event Type**: `checkout.session.completed`
**Description**: Triggered when a user completes a checkout session (subscription or token package purchase)

**Request Body Example**:
```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_1234567890",
      "object": "checkout.session",
      "customer": "cus_1234567890",
      "subscription": "sub_1234567890",
      "mode": "subscription",
      "payment_status": "paid",
      "metadata": {
        "userId": "123",
        "planId": "2"
      }
    }
  }
}
```

**Processing Actions**:
- Creates new subscription record in database
- Allocates tokens based on plan
- Creates or updates Stripe customer record
- Updates user subscription status

#### B. payment_intent.succeeded
**Event Type**: `payment_intent.succeeded`
**Description**: Triggered when a payment is successfully processed

**Request Body Example:**
```json
{
  "id": "evt_1234567891",
  "object": "event", 
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "object": "payment_intent",
      "amount": 2499,
      "currency": "eur",
      "customer": "cus_1234567890",
      "metadata": {
        "userId": "123",
        "packageId": "1"
      }
    }
  }
}
```

**Processing Actions**:
- Records successful payment in database
- Allocates tokens for token package purchases
- Updates payment status to "completed"

#### C. payment_intent.payment_failed
**Event Type**: `payment_intent.payment_failed`
**Description**: Triggered when a payment fails

**Request Body Example:**
```json
{
  "id": "evt_1234567892",
  "object": "event",
  "type": "payment_intent.payment_failed", 
  "data": {
    "object": {
      "id": "pi_1234567890",
      "object": "payment_intent",
      "last_payment_error": {
        "code": "card_declined",
        "message": "Your card was declined."
      },
      "metadata": {
        "userId": "123"
      }
    }
  }
}
```

**Processing Actions**:
- Updates payment status to "failed"
- Logs payment failure reason
- Triggers user notification (if configured)

#### D. invoice.payment_succeeded
**Event Type**: `invoice.payment_succeeded`
**Description**: Triggered when a subscription renewal payment succeeds

**Request Body Example:**
```json
{
  "id": "evt_1234567893",
  "object": "event",
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "in_1234567890",
      "object": "invoice",
      "customer": "cus_1234567890",
      "subscription": "sub_1234567890",
      "amount_paid": 2499,
      "currency": "eur",
      "period_start": 1640995200,
      "period_end": 1643673600
    }
  }
}
```

**Processing Actions**:
- Allocates new monthly tokens
- Updates subscription period dates
- Records renewal payment
- Extends user access

#### E. invoice.payment_failed
**Event Type**: `invoice.payment_failed`
**Description**: Triggered when a subscription renewal payment fails

**Request Body Example:**
```json
{
  "id": "evt_1234567894",
  "object": "event",
  "type": "invoice.payment_failed",
  "data": {
    "object": {
      "id": "in_1234567890",
      "object": "invoice",
      "customer": "cus_1234567890",
      "subscription": "sub_1234567890",
      "attempt_count": 1,
      "next_payment_attempt": 1641081600
    }
  }
}
```

**Processing Actions**:
- Updates subscription status based on attempt count
- Schedules retry if within retry limits
- Triggers dunning management process

#### F. customer.subscription.updated
**Event Type**: `customer.subscription.updated`
**Description**: Triggered when subscription details change (plan, status, etc.)

**Request Body Example:**
```json
{
  "id": "evt_1234567895",
  "object": "event",
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_1234567890",
      "object": "subscription",
      "customer": "cus_1234567890",
      "status": "active",
      "current_period_start": 1640995200,
      "current_period_end": 1643673600,
      "items": {
        "data": [{
          "price": {
            "id": "price_1234567890"
          }
        }]
      }
    }
  }
}
```

**Processing Actions**:
- Updates subscription details in database
- Adjusts token allocation if plan changed
- Synchronizes billing periods

#### G. customer.subscription.deleted
**Event Type**: `customer.subscription.deleted`
**Description**: Triggered when a subscription is cancelled

**Request Body Example:**
```json
{
  "id": "evt_1234567896",
  "object": "event",
  "type": "customer.subscription.deleted",
  "data": {
    "object": {
      "id": "sub_1234567890",
      "object": "subscription",
      "customer": "cus_1234567890",
      "status": "canceled",
      "canceled_at": 1640995200,
      "current_period_end": 1643673600
    }
  }
}
```

**Processing Actions**:
- Updates subscription status to "cancelled"
- Maintains access until period end
- Stops future billing attempts

**Response Examples**:

**Success Response (200 OK)**:
```json
{
  "received": true,
  "eventId": "evt_1234567890",
  "processed": true
}
```

**Error Response (400 Bad Request)**:
```json
{
  "received": false,
  "error": "Invalid signature",
  "message": "Webhook signature verification failed"
}
```

**Error Response (422 Unprocessable Entity)**:
```json
{
  "received": true,
  "processed": false,
  "error": "Processing failed",
  "message": "Failed to process webhook event",
  "eventId": "evt_1234567890"
}
```

---

## Security Features

### Signature Verification
All webhooks are verified using Stripe's signature verification:
```javascript
const signature = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.body, 
  signature, 
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### Idempotency Protection
Duplicate webhook events are detected and ignored:
- Events are stored in `webhook_events` table with unique event IDs
- Duplicate processing attempts return success without side effects
- Prevents double-charging or duplicate token allocation

---

## Webhook Configuration

### Required Stripe Webhook Events
Configure these events in your Stripe dashboard:
```
checkout.session.completed
payment_intent.succeeded
payment_intent.payment_failed
invoice.payment_succeeded
invoice.payment_failed
customer.subscription.updated
customer.subscription.deleted
```

### Webhook Endpoint URL
```
https://yourdomain.com/api/subscription/webhooks/stripe
```

### Webhook Secret
Set the webhook signing secret in environment variables:
```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

---

## Error Handling

### Webhook Processing Failures
If webhook processing fails:
1. Error is logged with full context
2. HTTP 422 status returned to Stripe
3. Stripe will retry the webhook automatically
4. Manual intervention may be required for persistent failures

### Database Transaction Safety
All webhook processing is wrapped in database transactions:
- Changes are rolled back if any step fails
- Ensures data consistency
- Prevents partial updates

---

## Monitoring and Logging

### Webhook Logs
All webhook events are logged with:
- Event ID and type
- Processing status (success/failure)
- Processing duration
- Any error messages

### Metrics to Monitor
- Webhook processing success rate
- Average processing time
- Failed webhook events requiring manual intervention
- Duplicate webhook detection rate

---

## Testing Webhooks

### Stripe CLI Testing
Use Stripe CLI to test webhooks locally:
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local development server
stripe listen --forward-to localhost:3001/api/subscription/webhooks/stripe

# Trigger specific webhook events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger invoice.payment_succeeded
```

### Manual Webhook Testing
Send test webhooks using curl:
```bash
curl -X POST https://yourdomain.com/api/subscription/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1640995200,v1=test_signature" \
  -d '{
    "id": "evt_test_webhook",
    "object": "event",
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_123",
        "customer": "cus_test_123"
      }
    }
  }'
```

---

## Troubleshooting

### Common Issues

**Signature Verification Failed**
- Check webhook secret configuration
- Ensure raw request body is used for verification
- Verify Stripe-Signature header is present

**Duplicate Event Processing**
- Check webhook_events table for existing event IDs
- Verify idempotency logic is working correctly

**Database Connection Errors**
- Check database connectivity
- Verify transaction handling
- Review connection pool settings

**Missing Customer/Subscription Data**
- Verify Stripe customer exists
- Check metadata mapping between Stripe and local system
- Ensure user ID synchronization

---

## Best Practices

### Webhook Endpoint Design
- Process webhooks quickly (< 10 seconds)
- Return HTTP 200 for successful processing
- Use idempotency keys to prevent duplicate processing
- Log all webhook events for debugging

### Error Recovery
- Implement exponential backoff for retries
- Set up monitoring alerts for failed webhooks
- Maintain manual intervention procedures for edge cases
- Regular reconciliation between Stripe and local data

### Security
- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Rotate webhook secrets regularly
- Monitor for suspicious webhook activity 