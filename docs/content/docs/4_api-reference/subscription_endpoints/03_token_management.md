# Subscription Service API Reference

The Subscription Service provides endpoints for managing subscription plans, user subscriptions, token transactions, and payment history. This document outlines all available endpoints with request and response examples.

**Base URL**: `/api/subscription`

All endpoints include proper authentication and authorization checks.

---

## Token Management

### 1.  ✅ Get Token Balance
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

### 2.  ✅ Allocate Tokens (Admin Only)
Allocates tokens to a user as bonuses, promotions, or administrative adjustments. Note that subscription renewal tokens are handled by the `/subscriptions/user/:userId/renew` endpoint, and token package purchases are handled by the `/token-packages/buy` endpoint.

**Endpoint**: `POST /tokens/allocate`

**Required Fields**:
- `userId`: User ID to allocate tokens to
- `tokenAmount`: Amount of tokens to allocate (positive number)
- `relatedEntityType`: Source of the tokens, typically `"other"` for administrative or bonus allocations

**Request Body Examples**:

**Administrative allocation** (bonus, promotional, etc.):
```json
{
  "userId": 30,
  "tokenAmount": 100,
  "description": "Welcome bonus tokens",
  "relatedEntityType": "other"
}
```

**Notes**:
- This endpoint is primarily intended for administrative use cases
- The `description` field is optional and will use a default message if not provided
- For regular token allocations via subscriptions, use the subscription renewal endpoint instead

**Response Example**:
```json
{
  "success": true,
  "data": {
    "transactionId": 456,
    "userId": 30,
    "transactionType": "allocation",
    "tokenAmount": 100,
    "description": "Welcome bonus tokens",
    "relatedEntityType": "other",
    "transactionDate": "2023-11-05T12:30:45.000Z",
    "metadata": {}
  }
}
```

### 3.  ✅ Record Token Usage
Records token usage for content generation, assemblies, or content recreation. This endpoint handles all token deduction use cases.

**Endpoint**: `POST /tokens/usage`

**Use Cases**:
1. Deduct tokens for each content piece of a scene within a job
2. Deduct tokens for assemblies (which come after the execution of a job)
3. Deduct tokens for recreation of single content pieces

**Required Fields**:
- `userId` - The user ID to deduct tokens from
- `tokenAmount` - The amount of tokens to deduct (positive number)
- `serviceName` - The service using the tokens (e.g., "image-generation", "text-generation", "assembly")

**Optional Fields**:
- `jobId` - The ID of the job (can be provided directly or in metadata)
- `description` - Description of the token usage
- `relatedEntityType` - Type of entity related to the usage (e.g., "image", "text", "scene", "job")
- `relatedEntityId` - ID of the related entity
- `externalServiceName` - Name of the external service (e.g., "midjourney", "openai")
- `metadata` - Additional data about the transaction (can include jobId if not provided directly)

**Validation Rules**:
- User must have an active subscription to deduct tokens
- Token amount must be a positive number
- Either the jobId or a jobId in the metadata should be provided for traceability
- Insufficient token balance will return a 402 Payment Required error

**Request Body Examples**:

1. **Content generation within a job**:
```json
{
  "userId": 30,
  "tokenAmount": 25,
  "serviceName": "image-generation",
  "jobId": "job-123",
  "description": "Image generation for scene 3",
  "relatedEntityType": "scene",
  "relatedEntityId": 3,
  "externalServiceName": "midjourney",
  "metadata": {
    "scene": 3,
    "prompt": "A cat sitting on a windowsill"
  }
}
```

2. **Assembly process**:
```json
{
  "userId": 30,
  "tokenAmount": 20,
  "serviceName": "assembly",
  "jobId": "job-123",
  "description": "Final video assembly for job-123",
  "relatedEntityType": "job",
  "relatedEntityId": "job-123",
  "metadata": {
    "sceneCount": 5,
    "totalDuration": "00:02:35"
  }
}
```

3. **Content recreation**:
```json
{
  "userId": 30,
  "tokenAmount": 10,
  "serviceName": "image-generation",
  "description": "Image recreation for scene 2",
  "relatedEntityType": "image",
  "relatedEntityId": 172,
  "externalServiceName": "midjourney",
  "metadata": {
    "originalJobId": "job-123",
    "scene": 2,
    "isRecreation": true,
    "reason": "customer_request"
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
    "description": "Image generation for scene 3",
    "relatedEntityType": "scene",
    "relatedEntityId": 3,
    "externalServiceName": "midjourney",
    "transactionDate": "2023-11-05T14:22:30.000Z",
    "metadata": {
      "scene": 3,
      "quality": "high",
      "prompt": "A cat sitting on a windowsill"
    }
  }
}
```

**Error Responses**:

1. User does not have an active subscription:
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "User does not have an active subscription. Token deduction not allowed."
}
```

2. Insufficient tokens in user's balance:
```json
{
  "success": false,
  "error": "Payment Required",
  "message": "Insufficient tokens. User has 15 tokens, but needs 25"
}
```

