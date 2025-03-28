# Subscription Service API Reference

The Subscription Service provides endpoints for managing subscription plans, user subscriptions, token transactions, and payment history. This document outlines all available endpoints with request and response examples.

**Base URL**: `/api/subscription`

All endpoints include proper authentication and authorization checks.

---

## Token Management

### 1.  Get Token Balance
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

### 2.  Allocate Tokens
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

### 3.  Deduct Tokens
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

### 4.  Get Transaction History
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

### 5.  Get Token Costs
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

### 6.  Calculate Job Cost
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
