# Subscription Service API Reference

The Subscription Service provides endpoints for managing subscription plans, user subscriptions, token transactions, and payment history. This document outlines all available endpoints with request and response examples.

**Base URL**: `/api/subscription`

All endpoints include proper authentication and authorization checks.

---

## Token Packages

### 1.  List All Token Packages
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

### 2.  Get Token Package Details
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

### 3.  Create Token Package
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

### 4.  Buy Token Package
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
