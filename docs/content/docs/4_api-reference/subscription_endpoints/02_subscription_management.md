# Subscription Service API Reference

The Subscription Service provides endpoints for managing subscription plans, user subscriptions, token transactions, and payment history. This document outlines all available endpoints with request and response examples.

**Base URL**: `/api/subscription`

All endpoints include proper authentication and authorization checks.

---

## Subscription Management

### 1. ✅ Get Current User's Subscription
Retrieves the active subscription for the currently authenticated user.

**Endpoint**: `GET /subscriptions/me`

**URL Parameters**:
- `status`: (optional, query): The status of the subscription to filter by. Valid values: `active`, `cancelled`, `expired`. Default is `active`.

**Example Requests**:
- `GET /subscriptions/me` - Returns the active subscription for the logged-in user.
- `GET /subscriptions/me?status=cancelled` - Returns any cancelled subscriptions for the logged-in user.

**Response Example**:
```json
{
  "success": true,
  "data": {
    "subscription_id": 123,
    "user_id": 30,
    "plan_id": 2,
    "status": "active",
    "start_date": "2023-11-01T00:00:00.000Z",
    "end_date": "2023-12-01T00:00:00.000Z",
    "auto_renew": true,
    "stripe_subscription_id": "sub_1234567890",
    "updated_at": "2023-11-01T00:00:00.000Z",
    "created_at": "2023-11-01T00:00:00.000Z",
    "plan_details": {
      "plan_name": "Pro",
      "billing_frequency": "monthly",
      "monthly_price": 29.99,
      "annual_price": 299.99,
      "monthly_token_allocation": 2000,
      "video_quality": "hd",
      "max_scenes_per_job": 10,
      "max_jobs_per_month": 20,
      "allowed_content_types": ["image", "voice", "animation", "video", "music"],
      "recreation_enabled": true,
      "has_watermark": false,
      "script_settings_enabled": true,
      "support_level": "priority_12h"
    }
  }
}
```

If the user has no active subscription, the response will be:

```json
{
  "success": true,
  "data": null
}
```

### 2. ✅ Create New Subscription
Creates a new subscription for a user or handles subscription plan changes.

**Use Case**:
- **Primary use**: Create a new subscription for a user who doesn't have one
- **Secondary use**: Handle all subscription plan changes through a unified approach:
  - **Tier Upgrade**: Immediate upgrade to a higher tier plan
  - **Tier Downgrade**: Schedule downgrade to a lower tier plan at period end
  - **Frequency Change**: Schedule change to same tier with different billing frequency at period end

**Behavior with Existing Subscriptions**:
When a user already has an active subscription, the system will automatically determine the type of change based on tier comparison:

1. **Tier Upgrade** (higher tier_id):
   - Immediately cancels the existing subscription
   - Creates a completely new subscription record with higher tier
   - Processes payment for the new plan
   - Allocates tokens based on the new plan
   - User gets immediate access to the new plan benefits

2. **Tier Downgrade** (lower tier_id):
   - Marks the existing subscription for cancellation at period end
   - Sets status to `pending_cancellation`
   - Stores the new plan ID as `upcoming_plan_id`
   - User retains current plan benefits until the billing period ends
   - At period end, batch job creates the new lower-tier subscription

3. **Frequency Change** (same tier_id, different plan_id):
   - Marks the existing subscription for cancellation at period end
   - Sets status to `pending_cancellation`
   - Stores the new plan ID as `upcoming_plan_id`
   - User retains current plan benefits until the billing period ends
   - At period end, batch job creates the new subscription with different frequency

**Endpoint**: `POST /subscriptions`

**Required Fields**:
- `userId`: User ID to create subscription for
- `planId`: Plan ID to subscribe to (tier-based plan identifier)

**Optional Fields**:
- `status`: Subscription status (defaults to "active")
- `startDate`: When the subscription should start (defaults to current date)
- `endDate`: When the subscription should end (defaults to null for indefinite)
- `currentPeriodStart`: Start of current billing period (defaults to startDate)
- `currentPeriodEnd`: End of current billing period (calculated based on plan if not provided)
- `paymentProvider`: Payment provider used (e.g., "stripe")
- `paymentMethod`: Method of payment (e.g., "credit_card", "bank_transfer")
- `stripePaymentIntentId`: Payment ID from external payment processor (stripe) for the payment intent
- `stripeSubscriptionId`: Subscription ID from external payment processor
- `amount`: Amount charged for the subscription (if not given, it will be calculated based on the plan)

**Free Tier Subscriptions**:
- For free tier subscriptions (plan ID 1), payment-related fields should be omitted
- The system will create the subscription without generating any payment records
- Token allocation will automatically occur based on the free tier's monthly token allocation
- Users will immediately have access to these tokens after the subscription is created

**Example Requests**:

1. **Free Tier Subscription**:
```json
{
  "userId": 30,
  "planId": 1  // Free tier plan ID
}
```

2. **New Paid Subscription**:
```json
{
  "userId": 30,
  "planId": 2,
  "paymentProvider": "stripe",
  "paymentMethod": "credit_card",
  "stripePaymentIntentId": "pi_123456789",
  "stripeSubscriptionId": "sub_987654321",
  "amount": 24.99,
  "startDate": "2023-11-01T00:00:00.000Z"
}
```

3. **Plan Upgrade** (will immediately cancel existing subscription):
```json
{
  "userId": 30,
  "planId": 3,  // Higher tier plan
  "paymentProvider": "stripe",
  "stripePaymentIntentId": "pi_upgradePayment123",
  "amount": 49.99
}
```

4. **Plan Downgrade or Frequency Change** (will schedule change for end of current period):
```json
{
  "userId": 30,
  "planId": 2  // Lower tier plan or different frequency
}
```

**Response Examples**:

1. **New Subscription or Immediate Upgrade**:
```json
{
  "success": true,
  "data": {
    "subscription_id": 123,
    "user_id": 30,
    "plan_id": 3,
    "status": "active",
    "start_date": "2023-11-01T00:00:00.000Z",
    "end_date": null,
    "current_period_start": "2023-11-01T00:00:00.000Z",
    "current_period_end": "2023-12-01T00:00:00.000Z",
    "canceled_at": null,
    "ended_at": null,
    "stripe_subscription_id": "sub_987654321",
    "created_at": "2023-11-01T12:00:00.000Z",
    "updated_at": "2023-11-01T12:00:00.000Z",
    "plan": {
      "plan_id": 3,
      "plan_name": "Professional Tier",
      "billing_frequency": "monthly",
      "monthly_price": 49.99,
      "annual_price": 499.88,
      "monthly_token_allocation": 5000,
      "tier_id": 3,
      "video_quality": "720p",
      "max_scenes_per_job": 25,
      "max_jobs_per_month": 75,
      "allowed_content_types": ["image", "voice", "animation", "video", "music", "assembly"],
      "recreation_enabled": true,
      "recreation_content_types": ["image", "voice"],
      "support_level": "email_24h"
    }
  }
}
```

2. **Scheduled Downgrade or Frequency Change**:
```json
{
  "success": true,
  "data": {
    "subscription_id": 123,
    "user_id": 30,
    "plan_id": 3,
    "status": "pending_cancellation",
    "start_date": "2023-11-01T00:00:00.000Z",
    "end_date": null,
    "current_period_start": "2023-11-01T00:00:00.000Z",
    "current_period_end": "2023-12-01T00:00:00.000Z",
    "canceled_at": "2023-11-15T12:00:00.000Z",
    "ended_at": null,
    "upcoming_plan_id": 2,
    "cancellation_reason": "CANCEL_FOR_DOWNGRADE",
    "stripe_subscription_id": "sub_987654321",
    "created_at": "2023-11-01T12:00:00.000Z",
    "updated_at": "2023-11-15T12:00:00.000Z",
    "message": "Subscription change scheduled for end of billing period",
    "plan": {
      "plan_id": 3,
      "plan_name": "Professional Tier",
      "billing_frequency": "monthly",
      "tier_id": 3,
      "monthly_token_allocation": 5000
    }
  }
}
```

**Validation Rules**:
- Free tier subscriptions (plan_id=1) cannot be downgraded
- Each user can have only one active subscription at a time
- Plan changes require valid tier and frequency combinations
- Users can only manage their own subscriptions unless they have admin permissions

### 3. ✅ Update Subscription
Updates an existing subscription.

**Use Case**:
- Primary use: Modify properties of an existing subscription without creating a new record
- Typical scenarios:
  1. Change the end date or current period
  2. Upgrade/downgrade a plan within the same subscription record
  3. Change the status
- The subscription ID remains the same throughout the changes

**Endpoint**: `PUT /subscriptions/:subscriptionId`

**URL Parameters**:
- `subscriptionId`: The numeric ID of the subscription (e.g., 123)

**Request Body (all fields optional)**:
```json
{
  "planId": 3,
  "status": "active",
  "stripeSubscriptionId": "sub_stripe456",
  "startDate": "2023-11-01T00:00:00.000Z",
  "endDate": "2024-11-01T00:00:00.000Z",
  "currentPeriodStart": "2023-11-01T00:00:00.000Z",
  "currentPeriodEnd": "2024-11-01T00:00:00.000Z",
  "canceledAt": "2023-11-15T00:00:00.000Z"
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "subscription_id": 123,
    "user_id": 30,
    "plan_id": 3,
    "status": "active",
    "start_date": "2023-11-01T00:00:00.000Z",
    "end_date": "2024-11-01T00:00:00.000Z",
    "current_period_start": "2023-11-01T00:00:00.000Z",
    "current_period_end": "2024-11-01T00:00:00.000Z",
    "canceled_at": "2023-11-15T00:00:00.000Z",
    "ended_at": null,
    "stripe_subscription_id": "sub_stripe456",
    "created_at": "2023-11-01T12:00:00.000Z",
    "updated_at": "2023-11-15T12:00:00.000Z",
    "plan": {
      "plan_id": 3,
      "plan_name": "Creator Tier",
      "billing_frequency": "yearly",
      "monthly_token_allocation": 6500
    }
  }
}
```

### 4. ✅ Cancel Subscription
Cancels an active subscription.

**Endpoint**: `POST /subscriptions/:subscriptionId/cancel`

**URL Parameters**:
- `subscriptionId`: The numeric ID of the subscription (e.g., 123)

**Request Body**:
```json
{
  "reason": "CANCEL_PAID_PLAN"
}
```

**Standardized Cancellation Reasons**:
- `CANCEL_PAID_PLAN`: Standard cancellation of a paid plan, will be set to pending_cancellation until billing period ends
- `CANCEL_FOR_UPGRADE`: Immediate cancellation for upgrading to a higher tier plan
- `CANCEL_FOR_DOWNGRADE`: Scheduled cancellation for downgrading to a lower tier plan

**Notes**:
- When cancelling a paid plan with `CANCEL_PAID_PLAN`, the subscription will enter a `pending_cancellation` status
- The user will retain access until the end of their current billing period
- At the end of the billing period, the subscription will automatically be set to `cancelled`
- For immediate cancellations (like `CANCEL_FOR_UPGRADE`), the status will directly change to `cancelled`
- Free tier plans (plan_id=1) cannot be cancelled

**Response Example for Immediate Cancellation**:
```json
{
  "message": "Subscription cancelled successfully",
  "subscription": {
    "subscription_id": 123,
    "user_id": 30,
    "plan_id": 3,
    "status": "cancelled",
    "start_date": "2023-11-01T00:00:00.000Z",
    "end_date": "2024-11-01T00:00:00.000Z",
    "current_period_start": "2023-11-01T00:00:00.000Z",
    "current_period_end": "2024-11-01T00:00:00.000Z",
    "canceled_at": "2023-11-20T12:00:00.000Z",
    "ended_at": null,
    "cancellation_reason": "CANCEL_FOR_UPGRADE",
    "stripe_subscription_id": "sub_stripe456",
    "created_at": "2023-11-01T12:00:00.000Z",
    "updated_at": "2023-11-20T12:00:00.000Z"
  }
}
```

**Response Example for Pending Cancellation**:
```json
{
  "message": "Subscription scheduled for cancellation at the end of billing period",
  "subscription": {
    "subscription_id": 123,
    "user_id": 30,
    "plan_id": 3,
    "status": "pending_cancellation",
    "start_date": "2023-11-01T00:00:00.000Z",
    "end_date": "2024-11-01T00:00:00.000Z",
    "current_period_start": "2023-11-01T00:00:00.000Z",
    "current_period_end": "2024-11-01T00:00:00.000Z",
    "canceled_at": "2023-11-20T12:00:00.000Z",
    "ended_at": null,
    "cancellation_reason": "CANCEL_PAID_PLAN",
    "upcoming_plan_id": 1,
    "stripe_subscription_id": "sub_stripe456",
    "created_at": "2023-11-01T12:00:00.000Z",
    "updated_at": "2023-11-20T12:00:00.000Z"
  }
}
```

### 5. ✅ Get Subscriptions to Renew
Retrieves subscriptions that need to be renewed.

**Endpoint**: `GET /subscriptions/renewal`

**Query Parameters**:
- `force` (boolean, optional): Force retrieval regardless of period end date (default: false)

**Use Case**:
- Used by batch jobs to identify subscriptions that need to be renewed
- Typically called by the SubscriptionRenewalsBatch job

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "subscription_id": 123,
      "user_id": 30,
      "plan_id": 2,
      "status": "active",
      "start_date": "2023-11-01T00:00:00.000Z",
      "end_date": null,
      "current_period_start": "2023-11-01T00:00:00.000Z",
      "current_period_end": "2023-12-01T00:00:00.000Z",
      "canceled_at": null,
      "ended_at": null,
      "stripe_subscription_id": "sub_987654321",
      "created_at": "2023-11-01T12:00:00.000Z",
      "updated_at": "2023-11-01T12:00:00.000Z",
      "plan": {
        "plan_id": 2,
        "plan_name": "Basic Tier",
        "billing_frequency": "monthly",
        "tier_id": 2,
        "monthly_token_allocation": 2500
      }
    }
  ]
}
```

**Notes**:
- Both endpoints require administrative access with the `manage:subscriptions` permission
- The `force` parameter allows batch jobs to retrieve all subscriptions regardless of their end date or period end date
- These endpoints are primarily used by batch jobs to identify subscriptions that need to be processed

---

### 6. ✅ Renew Subscription
Renews a subscription's token allocation period and allocates fresh tokens.

**Endpoint**: `POST /subscriptions/user/:userId/renew`

**URL Parameters**:
- `userId`: The numeric ID of the user (e.g., 30)

**Request Body**:
```json
{
  "forceRenew": false
}
```

**Notes**:
- By default, renewal is only allowed when the current period has ended (current_period_end date reached)
- Set `forceRenew` to `true` to force renewal even if the current period hasn't ended yet (admin use)
- The endpoint updates the subscription's `current_period_start` and `current_period_end` dates
- It also allocates fresh tokens according to the subscription plan's configuration
- Token allocation always uses the plan's `monthly_token_allocation` value, even for yearly plans
- This endpoint is designed for both manual renewal and use by automated batch jobs

**Response Example**:
```json
{
  "success": true,
  "data": {
    "subscription": {
      "subscription_id": 123,
      "user_id": 30,
      "plan_id": 2,
      "status": "active",
      "start_date": "2023-11-01T00:00:00.000Z",
      "end_date": "2024-11-01T00:00:00.000Z",
      "current_period_start": "2023-12-01T00:00:00.000Z",
      "current_period_end": "2024-01-01T00:00:00.000Z",
      "updated_at": "2023-12-01T00:00:00.000Z"
    },
    "tokenAllocation": {
      "transactionId": 458,
      "userId": 30,
      "transactionType": "allocation",
      "tokenAmount": 2500,
      "description": "Renewal token allocation for Basic Tier subscription",
      "transactionDate": "2023-12-01T00:00:00.000Z"
    },
    "newPeriod": {
      "start": "2023-12-01T00:00:00.000Z",
      "end": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses**:

1. When trying to renew too early:
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Subscription period has not ended yet. Current period ends on 2023-12-01T00:00:00.000Z (15 days remaining)"
}
```

2. When user has no active subscription:
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "No active subscription found for user 30"
}
```

### 7. ✅ Get Pending Cancellations
Retrieves subscriptions that are pending cancellation.

**Endpoint**: `GET /subscriptions/pending-cancellations`

**Query Parameters**:
- `force` (boolean, optional): Force retrieval regardless of end date (default: false)

**Use Case**:
- Used by batch jobs to identify subscriptions that need to be processed for cancellation
- Typically called by the ProcessPendingCancellationsBatch job

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "subscription_id": 123,
      "user_id": 30,
      "plan_id": 3,
      "status": "pending_cancellation",
      "start_date": "2023-11-01T00:00:00.000Z",
      "end_date": "2023-12-01T00:00:00.000Z",
      "current_period_start": "2023-11-01T00:00:00.000Z",
      "current_period_end": "2023-12-01T00:00:00.000Z",
      "canceled_at": "2023-11-15T12:00:00.000Z",
      "ended_at": null,
      "upcoming_plan_id": 2,
      "cancellation_reason": "CANCEL_FOR_DOWNGRADE",
      "stripe_subscription_id": "sub_987654321",
      "created_at": "2023-11-01T12:00:00.000Z",
      "updated_at": "2023-11-15T12:00:00.000Z",
      "plan": {
        "plan_id": 3,
        "plan_name": "Professional Tier",
        "billing_frequency": "monthly",
        "tier_id": 3,
        "monthly_token_allocation": 5000
      }
    }
  ]
}
```

