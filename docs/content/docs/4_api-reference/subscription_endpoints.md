# Subscription Service API Reference

The Subscription Service provides endpoints for managing subscription plans, user subscriptions, token transactions, and payment history. This document outlines all available endpoints with request and response examples.

**Base URL**: `/api/subscription`

All endpoints include proper authentication and authorization checks.

---

## Plan Management

### 1. ✅ List All Plans
Retrieves all available subscription plans.

**Endpoint**: `GET /plans`

**Parameters**:
- `includeInactive` (optional, query): Set to `true` to include inactive plans. Default is `false`.
- `sortBy` (optional, query): Field to sort by. Valid values: `plan_id`, `plan_name`, `monthly_price`, `price`, `created_at`, `billing_frequency`. Default is `monthly_price`.
- `sortOrder` (optional, query): Sort order. Valid values: `asc` or `desc`. Default is `asc`.
- `billingFrequency` (optional, query): Filter plans by billing frequency. Valid values: `monthly` or `yearly`.

**Example Requests**:
- `GET /plans` - Returns all active plans sorted by monthly_price ascending (default)
- `GET /plans?sortBy=plan_id&sortOrder=desc` - Returns all active plans sorted by plan_id descending
- `GET /plans?billingFrequency=monthly&sortBy=plan_name` - Returns monthly plans sorted by plan name ascending


**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "plan_id": 1,
      "plan_name": "Free",
      "price": 0.00,
      "monthly_price": 0.00,
      "billing_frequency": "monthly",
      "monthly_token_allocation": 300,
      "active": true,
      "max_scenes_per_job": 5,
      "max_jobs_per_month": 10,
      "video_quality": null,
      "visual_selection_count": 2,
      "voice_selection_count": 3,
      "template_selection_count": 3,
      "has_watermark": true,
      "script_settings_enabled": false,
      "support_level": "community",
      "allowed_content_types": ["image", "text", "voice"],
      "recreation_enabled": false,
      "recreation_content_types": [],
      "marketing_description": {
        "features": [
          "Free tier with basic features",
          "Limited to 5 scenes per job",
          "300 tokens per month"
        ]
      },
      "created_at": "2023-11-01T12:00:00.000Z",
      "updated_at": "2023-11-01T12:00:00.000Z"
    }
  ]
}
```

### 2. ✅ Get Plan Details
Retrieves details for a specific plan.

**Endpoint**: `GET /plans/:planId`

**URL Parameters**:
- `planId`: The ID of the plan (integer)

**Response Example**:
```json
{
  "success": true,
  "data": {
    "plan_id": 2,
    "plan_name": "Basic Tier",
    "price": 24.99,
    "monthly_price": 24.99,
    "billing_frequency": "monthly",
    "monthly_token_allocation": 2500,
    "active": true,
    "max_scenes_per_job": 13,
    "max_jobs_per_month": 45,
    "video_quality": "540p",
    "visual_selection_count": 9,
    "voice_selection_count": 9,
    "template_selection_count": 10,
    "has_watermark": false,
    "script_settings_enabled": true,
    "support_level": "community",
    "allowed_content_types": ["image", "voice", "animation", "video", "music"],
    "recreation_enabled": false,
    "recreation_content_types": [],
    "marketing_description": {
      "features": [
        "All content types",
        "YouTube Shorts & TikTok support",
        "Enhanced quality options"
      ]
    },
    "created_at": "2023-11-01T12:00:00.000Z",
    "updated_at": "2023-11-01T12:00:00.000Z"
  }
}
```

---

## Subscription Management

### 1. ✅ Get User's Current Subscription
Retrieves the active subscription for a user.

**Endpoint**: `GET /subscriptions/user/:userId`

**URL Parameters**:
- `userId`: The numeric ID of the user (e.g., "30")
- `status`: (optional, query): The status of the subscription to filter by. Valid values: `active`, `cancelled`, `expired`.

**Example Requests**:
- `GET /subscriptions/user/30` - Returns the active subscription for user 30
- `GET /subscriptions/user/30?status=active` - Returns the active subscription for user 30

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
    "external_subscription_id": "sub_1234567890",
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
Creates a new subscription for a user.

**Use Case**:
- Primary use: Create a brand new subscription for a user who doesn't have one
- Secondary use: Replace an existing subscription with a new one (upgrade / downgrade)
- When a user already has an active subscription, calling this endpoint will:
  1. Cancel the existing subscription
  2. Create a completely new subscription record
  3. Create a new payment record
  4. Allocate tokens based on the new plan
  5. Update the user's token balance

**Free Tier Subscriptions**:
- For free tier subscriptions (plan ID 1), payment-related fields (`paymentProvider`, `externalPaymentId`, `amount`) should be omitted
- The system will create the subscription without generating any payment records
- Token allocation will automatically occur based on the free tier's monthly token allocation (usually 300 tokens)
- Users will immediately have access to these tokens after the subscription is created

**Endpoint**: `POST /subscriptions`

**Example Free Tier Subscription Request:**
```json
{
  "userId": 30,
  "planId": 1,  // Free tier plan ID
  "startDate": "2023-11-01T00:00:00.000Z",
  "status": "active"
  // No payment fields needed for free tier
}
```

**Payment-Related Fields (for paid subscriptions):**
```json
{
  "userId": 30,
  "planId": 2,
  "paymentProvider": "stripe",  // Payment provider: "stripe"
  "paymentMethod": "credit_card",  // Optional - Payment method: "credit_card", "bank_transfer", "paypal", etc.
  "externalPaymentId": "pi_123456789",  // Payment ID from payment processor
  "amount": 24.99,  // Amount charged for the subscription (number, not string)
  "startDate": "2023-11-01T00:00:00.000Z",
  "status": "active"
}
```

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
    "end_date": null,
    "current_period_start": "2023-11-01T00:00:00.000Z",
    "current_period_end": "2023-12-01T00:00:00.000Z",
    "canceled_at": null,
    "ended_at": null,
    "external_subscription_id": "sub_stripe123",
    "created_at": "2023-11-01T12:00:00.000Z",
    "updated_at": "2023-11-01T12:00:00.000Z",
    "plan": {
      "plan_id": 2,
      "plan_name": "Basic Tier",
      "billing_frequency": "monthly",
      "monthly_price": 24.99,
      "annual_price": 299.88,
      "monthly_token_allocation": 2500,
      "video_quality": "540p",
      "max_scenes_per_job": 13,
      "max_jobs_per_month": 45,
      "allowed_content_types": ["image", "voice", "animation", "video", "music"],
      "recreation_content_types": [],
      "support_level": "community"
    }
  }
}
```

### 3. ✅ Update Subscription
Updates an existing subscription.

**Use Case**:
- Primary use: Modify properties of an existing subscription without creating a new record
- Typical scenarios:
  1. Change the end date or billing period
  2. Update payment details
  3. Upgrade/downgrade a plan within the same subscription record
  4. Change the status (e.g., to temporarily pause)
- The subscription ID remains the same throughout the changes
- Unlike POST, this preserves the same subscription record instead of creating a new one
- When changing plans, new tokens will be allocated based on the new plan's allocation

**Endpoint**: `PUT /subscriptions/:subscriptionId`

**URL Parameters**:
- `subscriptionId`: The numeric ID of the subscription (e.g., 123)

**Request Body (all fields optional)**:
```json
{
  "planId": 3,
  "status": "active",
  "externalSubscriptionId": "sub_stripe456",
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
    "external_subscription_id": "sub_stripe456",
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
    "external_subscription_id": "sub_stripe456",
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
    "external_subscription_id": "sub_stripe456",
    "created_at": "2023-11-01T12:00:00.000Z",
    "updated_at": "2023-11-20T12:00:00.000Z"
  }
}
```

### 5. ✅ Renew Subscription
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

---

## Token Management

### 1. ✅ Get Token Balance
Retrieves the current token balance for a user.

**Endpoint**: `GET /tokens/balance/:userId`

**URL Parameters**:
- `userId`: The numeric ID of the user (e.g., "30")

**Response Example**:
```json
{
  "success": true,
  "data": {
    "user_id": 30,
    "balance": 2350,
    "last_updated": "2023-11-15T12:00:00.000Z"
  }
}
```

### 2. ✅ Allocate Tokens
Allocates tokens to a user, with flexible options for tracking the source of the allocation.

**Endpoint**: `POST /tokens/allocate`

**Required Fields**:
- `userId`: User ID to allocate tokens to
- `tokenAmount`: Amount of tokens to allocate (positive number)
- `relatedEntityType`: Source of the tokens, must be one of:
  - `"subscription"`: For subscription-based allocations
  - `"token_package"`: For token package purchases
  - `"other"`: For administrative or bonus allocations

**Request Body Examples**:

1. **Subscription allocation**:
```json
{
  "userId": 30,
  "tokenAmount": 500,
  "description": "Monthly subscription allocation",
  "relatedEntityType": "subscription",
  "relatedEntityId": 123
}
```

2. **Token package allocation**:
```json
{
  "userId": 30,
  "tokenAmount": 2500,
  "description": "Creator Pack purchase",
  "relatedEntityType": "token_package",
  "relatedEntityId": 2
}
```

3. **Other allocation** (bonus, promotional, etc.):
```json
{
  "userId": 30,
  "tokenAmount": 100,
  "description": "Welcome bonus tokens",
  "relatedEntityType": "other"
}
```

**Notes**:
- For `"subscription"` and `"token_package"` types, `relatedEntityId` is required and should be the ID of the subscription or token package
- For `"other"` type, `relatedEntityId` is optional
- The `description` field is optional and will use a default message if not provided

**Response Example**:
```json
{
  "success": true,
  "data": {
    "transactionId": 456,
    "userId": 30,
    "transactionType": "allocation",
    "tokenAmount": 500,
    "description": "Monthly subscription allocation",
    "relatedEntityType": "subscription",
    "relatedEntityId": "123",
    "transactionDate": "2023-11-05T12:30:45.000Z",
    "metadata": {}
  }
}
```

### 3. ✅ Deduct Tokens
Deducts tokens from a user's balance for service usage.

**Endpoint**: `POST /tokens/deduct`

**Request Body**:
```json
{
  "userId": 30,
  "tokenAmount": 25,
  "description": "Token usage for image generation",
  "relatedEntityType": "job",
  "relatedEntityId": "job-123",
  "externalServiceName": "stable-diffusion-xl",
  "metadata": {
    "jobId": "job-123",
    "sceneCount": 5,
    "contentId": "img-456"
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "transactionId": 457,
    "userId": 30,
    "transactionType": "deduction",
    "tokenAmount": -25,
    "description": "Token usage for image generation",
    "relatedEntityType": "job",
    "relatedEntityId": "job-123",
    "externalServiceName": "stable-diffusion-xl",
    "transactionDate": "2023-11-05T14:22:30.000Z",
    "metadata": {
      "jobId": "job-123",
      "sceneCount": 5,
      "contentId": "img-456"
    }
  }
}
```

### 4. ✅ Get Transaction History
Retrieves a user's token transaction history.

**Endpoint**: `GET /transactions/user/:userId`

**URL Parameters**:
- `userId` - User ID to get transaction history for

**Query Parameters**:
- `limit` (optional) - Maximum number of transactions to return (default: 100)
- `offset` (optional) - Offset to start from (default: 0)

**Response Example**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transactionId": 457,
        "userId": 30,
        "transactionType": "deduction",
        "tokenAmount": -25,
        "description": "Token usage for image generation",
        "relatedEntityType": "job",
        "relatedEntityId": "job-123",
        "externalServiceName": "stable-diffusion-xl",
        "transactionDate": "2023-11-05T14:22:30.000Z",
        "metadata": {
          "jobId": "job-123",
          "sceneCount": 5,
          "contentId": "img-456"
        }
      },
      {
        "transactionId": 456,
        "userId": 30,
        "transactionType": "allocation",
        "tokenAmount": 500,
        "description": "Monthly subscription allocation",
        "relatedEntityType": "subscription",
        "relatedEntityId": "123",
        "transactionDate": "2023-11-05T12:30:45.000Z",
        "metadata": {}
      },
      {
        "transactionId": 455,
        "userId": 30,
        "transactionType": "purchase",
        "tokenAmount": 2500,
        "description": "Token package purchase",
        "relatedEntityType": "token_package",
        "relatedEntityId": "2",
        "transactionDate": "2023-11-01T10:15:20.000Z",
        "metadata": {
          "source": "purchase",
          "packageId": 2
        }
      }
    ],
    "totalCount": 3,
    "currentBalance": 2975
  }
}
```

### 5. ✅ Get Token Costs
Retrieves token costs for different services.

**Endpoint**: `GET /token-costs`

**Response Example**:
```json
{
  "success": true,
  "data": {
    "llm": 5,
    "image": 10,
    "voice": 5,
    "animation": 30,
    "video": 50,
    "music": 20,
    "assembly": 20
  }
}
```

### 6. ✅ Calculate Job Cost
Calculates token cost for a job with multiple services.

**Endpoint**: `POST /calculate-job-cost`

**Request Body**:
```json
{
  "sceneCount": 5,
  "services": {
    "llm": true,
    "image": true,
    "voice": true,
    "music": true,
    "assembly": true
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "total": 120,
    "breakdown": {
      "llm": 5,
      "image": 50,
      "voice": 25,
      "music": 20,
      "assembly": 20
    },
    "sceneCount": 5
  }
}
```

---

## Token Packages

### 1. ✅ List All Token Packages
Retrieves all available token packages.

**Endpoint**: `GET /token-packages`

**Parameters**:
- `includeInactive` (optional, query): Set to `true` to include inactive packages. Default is `false`.

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "package_id": 1,
      "package_name": "Starter Pack",
      "token_allocation": 1000,
      "price": 9.99,
      "active": true,
      "marketing_description": {
        "features": ["1,000 additional tokens", "Never expires"]
      },
      "created_at": "2023-11-01T12:00:00.000Z",
      "updated_at": "2023-11-01T12:00:00.000Z"
    },
    {
      "package_id": 2,
      "package_name": "Creator Pack",
      "token_allocation": 2500,
      "price": 24.99,
      "active": true,
      "marketing_description": {
        "features": ["2,500 additional tokens", "Never expires", "Best value for basic users"]
      },
      "created_at": "2023-11-01T12:00:00.000Z",
      "updated_at": "2023-11-01T12:00:00.000Z"
    }
  ]
}
```

### 2. ✅ Get Token Package Details
Retrieves details for a specific token package.

**Endpoint**: `GET /token-packages/:packageId`

**URL Parameters**:
- `packageId`: The ID of the token package (integer)

**Response Example**:
```json
{
  "success": true,
  "data": {
    "package_id": 2,
    "package_name": "Creator Pack",
    "token_allocation": 2500,
    "price": 24.99,
    "active": true,
    "marketing_description": {
      "features": ["2,500 additional tokens", "Never expires", "Best value for basic users"]
    },
    "created_at": "2023-11-01T12:00:00.000Z",
    "updated_at": "2023-11-01T12:00:00.000Z"
  }
}
```

### 3. ✅ Create Token Package
Creates a new token package.

**Endpoint**: `POST /token-packages`

**Request Body**:
```json
{
  "packageName": "Pro Pack",
  "tokenAllocation": 6000,
  "price": 39.99,
  "active": true,
  "marketingDescription": {
    "features": ["6,000 additional tokens", "Never expires", "Perfect for power users"]
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "package_id": 3,
    "package_name": "Pro Pack",
    "token_allocation": 6000,
    "price": 39.99,
    "active": true,
    "marketing_description": {
      "features": ["6,000 additional tokens", "Never expires", "Perfect for power users"]
    },
    "created_at": "2023-11-20T12:00:00.000Z",
    "updated_at": "2023-11-20T12:00:00.000Z"
  }
}
```

### 4. ✅ Buy Token Package
Purchase a new package of tokens for a user independently of a subscription.

**Endpoint**: `POST /token-packages/buy`

**Use Case**:
- Primary use: Purchase additional tokens when the regular subscription allocation is running low
- One-time purchase that adds tokens to the user's balance immediately
- Payment is processed immediately and tokens are allocated upon successful payment

**Request Body**:
```json
{
  "userId": 30,
  "packageId": 2,
  "paymentProvider": "stripe",
  "externalPaymentId": "pi_3NvZN2Iuyt123456"
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "payment": {
      "payment_id": 791,
      "user_id": 30,
      "amount": 24.99,
      "payment_provider": "stripe",
      "payment_method": "credit_card",
      "currency": "eur",
      "external_payment_id": "pi_3NvZN2Iuyt123456",
      "payment_type": "token_package",
      "status": "completed",
      "package_id": 2,
      "payment_date": "2023-11-20T12:00:00.000Z",
      "created_at": "2023-11-20T12:00:00.000Z",
      "updated_at": "2023-11-20T12:00:00.000Z"
    },
    "transaction": {
      "transactionId": 456,
      "userId": 30,
      "transactionType": "allocation",
      "tokenAmount": 2500,
      "description": "Token package purchase: 2500 tokens",
      "relatedEntityType": "token_package",
      "relatedEntityId": "2",
      "paymentId": 791,
      "transactionDate": "2023-11-20T12:00:00.000Z"
    },
    "tokenPackage": {
      "package_id": 2,
      "package_name": "Creator Pack",
      "token_allocation": 2500,
      "price": 24.99,
      "active": true
    }
  }
}
```

**Notes**:
- This endpoint must be called after the payment has been successfully processed by the payment provider
- The `externalPaymentId` should be the ID returned by the payment provider (e.g., Stripe) upon successful payment
- The endpoint will automatically:
  1. Create a payment record in the database
  2. Allocate the tokens from the package to the user's balance
  3. Create a token transaction record tracking the allocation

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

### 2. ✅ Create Payment Record
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

### 3. ✅ Change Payment Status
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

### 4. ✅ Get Payment Summary
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

## Coming Soon Endpoints

The following endpoints are currently in development:

### 1. Get Count for token renewal and payment renewal
**Endpoint**: `GET /subscriptions/count/:userId`

**Use Case**:
- Get information about how often the customer had token renewal and payment renewal
- Total calculation of tokens and payment for the entire subscription
- Need to be checked: We create a new subscription for upgrade or downgrades or cancellations -> How to handle this? Or only for current active subscription?

### 2. Check Token Availability (Pre-authorization)
**Endpoint**: `POST /tokens/check`

**Use Case**:
- Pre-authorization of token usage before processing a job or other API call that consumes tokens
- Calculation of theoretical token usage (how many images, voices, etc. can be generated with the remaining tokens)

### 3. Get Monthly Job Count (to check how many jobs user executed in the current period)
**Endpoint**: `GET /jobs/count/:userId`

**Use Case**: 
- Get information about current period (of the subscription)
- Get count of jobs executed by user in the current period

### 4. Check Feature Availability
**Endpoint**: `GET /features/available/:userId`

**Use Case**:
- To compare the users selected plan with the available features

### 5. Change Token Package Details (Admin Only)
**Endpoint**: `POST /token-packages/change`

### 6. Activate / Deactivate Token Package (Admin Only)
**Endpoint**: `POST /token-packages/activate`

### 7. Change Subscription Plan Details (Admin Only)
**Endpoint**: `POST /subscriptions/change`

### 8. Activate/Deactivate Subscription (Admin Only)
**Endpoint**: `POST /subscriptions/activate`