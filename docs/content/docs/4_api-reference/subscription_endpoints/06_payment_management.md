# Subscription Service API Reference

The Subscription Service provides endpoints for managing subscription plans, user subscriptions, token transactions, and payment history. This document outlines all available endpoints with request and response examples.

**Base URL**: `/api/subscription`

All endpoints include proper authentication and authorization checks.

---

## Payment History

### 1. ✅ Get Payment History
Retrieves payment history for a user.

**Endpoint**: `GET /payments/user/:userId`

**URL Parameters**:
- `userId`: The numeric ID of the user (e.g., "30")

**Query Parameters**:
- `limit` (optional): Maximum number of results to return (default: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Response Example**:
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "payment_id": 789,
        "user_id": 30,
        "amount": 24.99,
        "currency": "EUR",
        "payment_method": "stripe",
        "status": "completed",
        "payment_date": "2023-11-15T14:25:00.000Z",
        "payment_type": "token_package",
        "package_id": 2,
        "stripe_payment_intent_id": "pi_3NvZN2Iuyt123456"
      },
      {
        "payment_id": 788,
        "user_id": 30,
        "amount": 24.99,
        "currency": "EUR",
        "payment_method": "stripe",
        "status": "completed",
        "payment_date": "2023-11-01T12:00:00.000Z",
        "payment_type": "subscription_initial",
        "plan_id": 2,
        "subscription_id": 123,
        "stripe_payment_intent_id": "pi_3NvZN1Iuyt123456",
        "billing_period_start": "2023-11-01",
        "billing_period_end": "2023-12-01"
      }
    ],
    "count": 2,
    "total": 2
  }
}
```

### 2. ✅ Get Payment Summary
Retrieves a summary of payments for a user.

**Endpoint**: `GET /payments/summary/:userId`

**URL Parameters**:
- `userId`: The numeric ID of the user (e.g., "30")

**Use Case**:
- Get a summary of payments for a user, including total spent, subscription total, token package total, current plan, last payment, and monthly spending breakdown

**Response Example**:
```json
{
  "totalSpent": 579.75,
  "subscriptionTotal": 514.77,
  "tokenPackageTotal": 64.98,
  "currentPlan": {
    "plan_id": 3,
    "plan_name": "Basic Tier",
    "monthly_price": 19.99,
    "billing_frequency": "yearly"
  },
  "lastPayment": {
    "payment_id": 19,
    "amount": 239.88,
    "payment_date": "2025-03-22T12:50:09.614Z",
    "payment_type": "subscription_initial"
  },
  "monthlySpending": [
    {
      "period_start": "2025-02-28T23:00:00.000Z",
      "period_end": "2025-03-30T22:00:00.000Z",
      "amount": 579.75
    }
  ],
  "paymentsByType": {
    "subscription_initial": 12,
    "subscription_renewal": 2,
    "token_package": 2
  }
}
```

**Response Fields**:
- `totalSpent`: Total amount spent across all payment types
- `subscriptionTotal`: Total amount spent on subscription payments
- `tokenPackageTotal`: Total amount spent on token package purchases
- `currentPlan`: Details of the user's current active subscription plan (null if no active subscription)
- `lastPayment`: Details of the user's most recent payment
- `monthlySpending`: Breakdown of spending by month, with period start/end dates
- `paymentsByType`: Count of payments by payment type


### 3. ✅ Create Payment Record
Creates a new payment record for subscription renewals or token package purchases.

**Endpoint**: `POST /payments`

**Use Cases**:
- Creation of subscription renewal payments with status "open" for future collection

**Request Body Examples**:  

1. **Subscription Renewal Payment (Open Status)** - For creating a renewal payment that will be collected after the current billing period ends:
```json
{
  "userId": 30,
  "paymentType": "subscription_renewal",
  "subscriptionId": 123,
  "status": "open"
}
```

**Required Fields**:
- `userId`: The ID of the user for whom the payment is being created
- `paymentType`: Type of payment (e.g., "subscription_renewal", "subscription_initial", "token_package")
- `status`: Payment status (e.g., "open", "completed", "failed")

**Optional Fields**:
- `subscriptionId`: Required for subscription-related payments (renewals, initial subscriptions)
- `planId`: Can be automatically determined from the subscription if not provided
- `amount`: Can be automatically determined from the plan or package if not provided
- `paymentProvider`: Optional for subscription renewals, required for other payment types
- `stripePaymentIntentId`: Optional for subscription renewals, required for other payment types
- `billing_period_start`: Can be automatically calculated based on subscription dates
- `billing_period_end`: Can be automatically calculated based on subscription dates

**Response Example**:
```json
{
    "success": true,
    "data": {
        "payment_id": 31,
        "user_id": 30,
        "amount": 24.99,
        "currency": "eur",
        "payment_method": "credit_card",
        "payment_date": null,
        "status": "open",
        "payment_type": "subscription_renewal",
        "plan_id": 2,
        "package_id": null,
        "subscription_id": 73,
        "stripe_payment_intent_id": null,
        "billing_period_start": "2025-05-03T22:00:00.000Z",
        "billing_period_end": "2025-06-03T22:00:00.000Z",
        "payment_metadata": null,
        "payment_provider": null,
        "created_at": "2025-04-04T10:50:32.816Z",
        "updated_at": "2025-04-04T10:50:32.816Z"
    }
}
```

**Notes**:
- For `subscription_renewal` payments, the system can automatically determine the `planId` from the subscription if not provided
- The subscription must be in `active` status to create a renewal payment
- Only one `open` payment can exist per subscription at a time
- For token package payments, the amount will be automatically determined from the package if not explicitly provided
- For subscription payments, the amount will be determined from the plan pricing if not explicitly provided
- When status is set to "open", it indicates a pending payment that should be collected in the future
- This endpoint requires administrative access with the `manage:payments` permission

### 4. ✅ Update Payment
Updates an existing payment with payment provider details and status update. E.g. when a payment is successfully processed by the payment provider, the status can be updated to "completed".

**Endpoint**: `POST /payments/update`

**Request Body**:
```json
{
  "paymentId": 790,
  "status": "completed",
  "paymentProvider": "stripe",
  "stripePaymentIntentId": "pi_3NvZN2Iuyt123456"
}
```

**Required Fields**:
- `paymentId`: The ID of the payment to update
- `status`: The new status for the payment

**Conditionally Required Fields**:
- `paymentProvider`: Required when updating to "completed" status
- `stripePaymentIntentId`: Required when updating to "completed" status

**Optional Fields**:
- Any other payment fields that can be updated (amount, billing periods, etc.)

**Response Example**:
```json
{
  "success": true,
  "data": {
    "payment_id": 790,
    "user_id": 30,
    "amount": 24.99,
    "payment_provider": "stripe",
    "stripe_payment_intent_id": "pi_3NvZN2Iuyt123456",
    "payment_type": "subscription_renewal",
    "plan_id": 2,
    "subscription_id": 123,
    "status": "completed",
    "payment_date": "2023-11-20T12:00:00.000Z",
    "billing_period_start": "2023-12-01T00:00:00.000Z",
    "billing_period_end": "2024-01-01T00:00:00.000Z",
    "created_at": "2023-11-20T12:30:00.000Z",
    "updated_at": "2023-11-20T12:30:00.000Z"
  }
}
```

**Valid Status Values**:
- `completed`: Payment has been successfully processed
- `open`: Payment is awaiting collection/processing
- `failed`: Payment was attempted but failed

**Special Behavior**:
- When a token package payment is updated to "completed" status, the system automatically allocates the corresponding tokens to the user
- When updating a payment to "completed" status, both `paymentProvider` and `stripePaymentIntentId` must be provided
- This endpoint does NOT interact with any payment provider - it only updates the database record

### 5. ✅ Get Payments for Renewal
Retrieves payments that need to be renewed. This endpoint is used by batch jobs to identify payments that need renewal.

**Endpoint**: `GET /payments/renewal`

**Query Parameters**:
- `force` (boolean, optional): Force retrieval regardless of billing period end date

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "payment_id": 790,
      "user_id": 123,
      "subscription_id": 456,
      "plan_id": 2,
      "amount": 29.99,
      "payment_type": "subscription_renewal",
      "billing_period_start": "2025-03-04",
      "billing_period_end": "2025-04-03",
      "next_billing_period_start": "2025-04-04",
      "next_billing_period_end": "2025-05-03"
    }
  ]
}
```

**Notes**:
- This endpoint is used by batch jobs to identify payments needing renewal and is typically called by the CreatePaymentsBatch job.
- It includes both initial and renewal payments and only returns the latest payment for each subscription to avoid duplicates.
- It prioritizes subscription_renewal payments over subscription_initial payments when selecting the latest payment for each subscription.
- It only returns payments for subscriptions that are in 'active' status and haven't reached their end date.
- The endpoint is primarily for automated batch jobs to create new payment records for subscriptions needing renewal.

### 6. ✅ Get Payments to Collect
Retrieves payments that need to be collected.

**Endpoint**: `GET /payments/collect`

**Query Parameters**:
- `force` (boolean, optional): Force retrieval regardless of collection date (default: false)

**Use Case**:
- Used by batch jobs to identify payments that need to be collected
- Typically called by the CollectPaymentsBatch job

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "payment_id": 32,
      "user_id": 30,
      "amount": 24.99,
      "currency": "eur",
      "payment_method": "credit_card",
      "payment_date": null,
      "status": "open",
      "payment_type": "subscription_renewal",
      "plan_id": 2,
      "package_id": null,
      "subscription_id": 73,
      "stripe_payment_intent_id": null,
      "billing_period_start": "2025-05-03T22:00:00.000Z",
      "billing_period_end": "2025-06-03T22:00:00.000Z",
      "payment_metadata": null,
      "payment_provider": null,
      "created_at": "2025-04-04T10:50:32.816Z",
      "updated_at": "2025-04-04T10:50:32.816Z"
    }
  ]
}
```

### 7. ✅ Collect Payment
Collects a specific payment by ID. This endpoint actively processes the payment through the payment provider (e.g., Stripe) and then updates the payment record with the result.

**Endpoint**: `POST /payments/:paymentId/collect`

**URL Parameters**:
- `paymentId`: The ID of the payment to collect

**Use Case**:
- Used by batch jobs to collect a specific payment
- Typically called by the CollectPaymentsBatch job for each payment that needs to be collected
- This endpoint actively processes the payment through the payment provider, unlike the `/payments/update` endpoint which only updates the database record

**Response Example**:
```json
{
  "success": true,
  "data": {
    "payment_id": 32,
    "user_id": 30,
    "amount": 24.99,
    "currency": "eur",
    "payment_method": "credit_card",
    "payment_date": "2025-05-03T22:00:00.000Z",
    "status": "completed",
    "payment_type": "subscription_renewal",
    "plan_id": 2,
    "package_id": null,
    "subscription_id": 73,
    "stripe_payment_intent_id": "pi_3NvZN2Iuyt123456",
    "billing_period_start": "2025-05-03T22:00:00.000Z",
    "billing_period_end": "2025-06-03T22:00:00.000Z",
    "payment_metadata": null,
    "payment_provider": "stripe",
    "created_at": "2025-04-04T10:50:32.816Z",
    "updated_at": "2025-05-03T22:00:00.000Z"
  }
}
```

**Error Response Example**:
```json
{
  "success": false,
  "error": "Payment collection failed",
  "message": "Payment provider returned an error: Insufficient funds"
}
```

**Notes**:
- This endpoint requires administrative access with the `manage:payments` permission
- The payment must be in `open` status to be collected
- The payment will be updated with the payment provider details and status will be changed to `completed` if successful
- If the payment collection fails, the status will be updated to `failed` and an error message will be returned
- This endpoint actively calls the payment provider (e.g., Stripe) to process the payment, unlike the `/payments/update` endpoint which only updates the database record

The system provides two different endpoints for managing payments that serve distinct purposes:

#### `/payments/update` vs `/payments/:paymentId/collect`

| Feature | `/payments/update` | `/payments/:paymentId/collect` |
|---------|-------------------|--------------------------------|
| **Purpose** | Updates payment record with new information | Processes payment through payment provider and updates record |
| **Payment Provider Interaction** | No interaction with payment providers | Actively calls payment provider to process payment |
| **Status Requirements** | Can update to any valid status | Only works on payments in "open" status |
| **Use Cases** | Manual updates, webhook callbacks | Batch job payment processing |
| **Implementation** | Simple database update | Payment provider integration with error handling |

**When to Use Each Endpoint**:

- Use `/payments/update` when:
  - You need to manually update a payment record
  - You're handling a webhook callback from a payment provider
  - You need to update a payment to a status other than "completed" or "failed"

- Use `/payments/:paymentId/collect` when:
  - You need to process a payment through a payment provider
  - You're running a batch job to collect payments
  - The payment is in "open" status and ready to be collected

//Missing for the retry failed payment batch job

### 8. ⏳ Get Failed Payments
Retrieves failed payments.

**Endpoint**: `GET /payments/failed`

**Query Parameters**:
- `force` (boolean, optional): Force retrieval regardless of collection date (default: false)

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "payment_id": 32,
      "user_id": 30,
      "amount": 24.99,
      "currency": "eur",
      "payment_method": "credit_card",
      "payment_date": null, 
      "status": "failed",
      "payment_type": "subscription_renewal",
      "plan_id": 2,
      "package_id": null,
      "subscription_id": 73,
      "stripe_payment_intent_id": null,
      "billing_period_start": "2025-05-03T22:00:00.000Z",
      "billing_period_end": "2025-06-03T22:00:00.000Z",
      "payment_metadata": null,
      "payment_provider": null,
      "created_at": "2025-04-04T10:50:32.816Z",
      "updated_at": "2025-04-04T10:50:32.816Z"
    }
  ]   
}
```

### 9. ⏳ Retry Failed Payment
Collect and retry a failed payment. Add a counter to the payment to avoid infinite retries. Downgrades the subscription to the lowest plan if max retries reached.

**Endpoint**: `POST /payments/:paymentId/retry`
