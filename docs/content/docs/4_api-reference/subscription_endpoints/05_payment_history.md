# Subscription Service API Reference

The Subscription Service provides endpoints for managing subscription plans, user subscriptions, token transactions, and payment history. This document outlines all available endpoints with request and response examples.

**Base URL**: `/api/subscription`

All endpoints include proper authentication and authorization checks.

---

## Payment History

### 1.  Get Payment History
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
        "external_payment_id": "pi_3NvZN2Iuyt123456"
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
        "external_payment_id": "pi_3NvZN1Iuyt123456",
        "billing_period_start": "2023-11-01",
        "billing_period_end": "2023-12-01"
      }
    ],
    "count": 2,
    "total": 2
  }
}
```

### 2.  Create Payment Record
Creates a new payment record for subscription renewals or token package purchases.

**Endpoint**: `POST /payments`

**Use Cases**:
- Creation of subscription renewal payments with status "open" for future collection
- Recording successful token package purchase payments

**Request Body Examples**:  

1. **Subscription Renewal Payment (Open Status)** - For creating a renewal payment that will be collected one day before billing period ends:
```json
{
  "userId": 30,
  "paymentProvider": "stripe",
  "externalPaymentId": "pi_3NvZN2Iuyt123456",
  "paymentType": "subscription_renewal",
  "subscriptionId": 49,
  "status": "open",
  "planId": 2,
  "billingPeriod": {
    "start": "2023-12-01T00:00:00.000Z",
    "end": "2024-01-01T00:00:00.000Z"
  }
}
```

2. **Token Package Purchase (Completed Status)** - For recording a token package purchase payment that was 
already successfully processed:
```json
{
  "userId": 30,
  "paymentType": "token_package",
  "packageId": 2,
  "paymentProvider": "stripe",
  "externalPaymentId": "pi_3NvZN2Iuyt123456",
  "status": "completed"
}
```

**Required Fields**:
- `userId`: User ID (string/number)
- `paymentProvider`: Payment provider name (string, e.g., "stripe", "paypal")
- `externalPaymentId`: Payment ID from external provider (string)
- `paymentType`: Type of payment (string, one of: "subscription_initial", "subscription_renewal", "token_package")

**Conditional Fields**:
- For subscription payments (`subscription_initial` or `subscription_renewal`):
  - `subscriptionId`: Subscription ID (number, required)
  - `planId`: Plan ID (number, required for `subscription_initial`, optional for `subscription_renewal`)
  - `billingPeriod`: Billing period object (optional for `subscription_renewal`, will be calculated if not provided)

- For token package payments (`token_package`):
  - `packageId`: Token package ID (number, required)

**Optional Fields**:
- `status`: Payment status (string, one of: "completed", "open", "failed", defaults to "completed")
- `amount`: Payment amount (number, if not provided, will be determined from plan or package)

**Response Example**:
```json
{
  "success": true,
  "data": {
    "payment_id": 125,
    "user_id": 30,
    "amount": 24.99,
    "payment_provider": "stripe",
    "payment_method": "credit_card",
    "currency": "eur",
    "external_payment_id": "pending_collection",
    "payment_type": "subscription_renewal",
    "plan_id": 2,
    "subscription_id": 123,
    "status": "open",
    "payment_date": "2023-11-20T12:00:00.000Z",
    "billing_period_start": "2023-12-01T00:00:00.000Z",
    "billing_period_end": "2024-01-01T00:00:00.000Z",
    "created_at": "2023-11-20T12:00:00.000Z",
    "updated_at": "2023-11-20T12:00:00.000Z"
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

### 3.  Change Payment Status
Updates the status of an existing payment.

**Endpoint**: `POST /payments/:paymentId/status`

**URL Parameters**:
- `paymentId`: The numeric ID of the payment to update (integer)

**Request Body**:
```json
{
  "status": "completed"
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "payment_id": 790,
    "user_id": 30,
    "amount": 24.99,
    "payment_provider": "stripe",
    "external_payment_id": "pi_3NvZN2Iuyt123456",
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
- When a token package payment is changed from "open" to "completed", the system automatically allocates the corresponding tokens to the user
- This endpoint is primarily used by automated batch jobs to update the status of payments after processing

### 4.  Get Payment Summary
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
