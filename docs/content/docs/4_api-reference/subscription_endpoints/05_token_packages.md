# Subscription Service API Reference

The Subscription Service provides endpoints for managing subscription plans, user subscriptions, token transactions, and payment history. This document outlines all available endpoints with request and response examples.

**Base URL**: `/api/subscription`

All endpoints include proper authentication and authorization checks.

---

## Token Packages

### 1. ✅ List All Token Packages
Retrieves all available token packages.

**Endpoint**: `GET /token-packages`

**Parameters**:
- `status` (optional, query): Set to `inactive` to query inactive packages. Set to `active` to query active packages. Default is query for all packages.

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

### 3. ✅ Buy Token Package
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
  "stripePaymentIntentId": "pi_3NvZN2Iuyt123456"
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
      "stripe_payment_intent_id": "pi_3NvZN2Iuyt123456",
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
- The `stripePaymentIntentId` should be the ID returned by the payment provider (e.g., Stripe) upon successful payment
- The endpoint will automatically:
  1. Create a payment record in the database
  2. Allocate the tokens from the package to the user's balance
  3. Create a token transaction record tracking the allocation


### 4. ✅ Add Token Package:

**Endpoint**: `POST /token-packages/add`

**Use Case**:
- Add a new token package to the system
- This endpoint is only available to admin users

**Request Body**:
```json
{
  "packageName": "Test3",
  "tokenAllocation": 3,
  "price": 39.99,
  "active": false,
  "marketingDescription": {
    "features": ["This is a test for a new package"]
  }
}
```

**Response Example**:
```json
{
    "success": true,
    "data": {
        "package_id": 7,
        "package_name": "Test3",
        "token_allocation": 3,
        "price": "39.99",
        "active": false,
        "marketing_description": {
            "features": [
                "This is a test for a new package"
            ]
        },
        "created_at": "2025-04-03T16:08:26.937Z",
        "updated_at": "2025-04-03T16:08:26.937Z"
    }
}
```

**Notes**:
- This endpoint is used to add a new token package to the system
- The `active` field is used to determine if the package is currently available for purchase
- The `marketingDescription` field is used to provide a description of the package for marketing purposes
