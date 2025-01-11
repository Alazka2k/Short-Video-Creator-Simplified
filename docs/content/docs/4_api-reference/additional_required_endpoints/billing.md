# Billing & Token Management API

## Get Token Usage

Retrieves current token usage statistics for the user.

```http
GET /api/billing/usage
```

### Response

```typescript
{
  tokens: {
    total: number;
    used: number;
    remaining: number;
    expiresAt?: string;
  };
  usage: {
    videoGeneration: number;
    imageGeneration: number;
    voiceGeneration: number;
    musicGeneration: number;
  };
  limits: {
    maxTokensPerMonth: number;
    maxVideosPerMonth: number;
    maxDurationPerVideo: number;
  };
}
```

## Get Billing Plans

Retrieves available subscription plans.

```http
GET /api/billing/plans
```

### Response

```typescript
{
  plans: {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: 'month' | 'year';
    features: {
      tokensPerMonth: number;
      maxVideosPerMonth: number;
      maxDurationPerVideo: number;
      additionalFeatures: string[];
    };
    tokenPricing: {
      baseTokens: number;
      additionalTokenCost: number;
    };
  }[];
}
```

## Get Transaction History

Retrieves user's transaction history.

```http
GET /api/billing/transactions
```

### Query Parameters

| Parameter | Type     | Description                                           |
|-----------|----------|-------------------------------------------------------|
| page      | number   | Page number for pagination (default: 1)               |
| limit     | number   | Number of items per page (default: 10, max: 50)      |
| type      | string   | Filter by type: 'purchase', 'usage', 'refund'        |

### Response

```typescript
{
  transactions: {
    id: string;
    type: 'purchase' | 'usage' | 'refund';
    amount: number;
    description: string;
    date: string;
    status: 'completed' | 'pending' | 'failed';
    metadata?: {
      tokens?: number;
      planId?: string;
      videoId?: string;
    };
  }[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
```

## Purchase Tokens

Purchases additional tokens.

```http
POST /api/billing/purchase
```

### Request Body

```typescript
{
  amount: number;
  paymentMethodId: string;
}
```

### Response

```typescript
{
  success: boolean;
  transaction: {
    id: string;
    amount: number;
    tokens: number;
    status: 'completed' | 'pending' | 'failed';
  };
  newBalance: {
    total: number;
    used: number;
    remaining: number;
  };
}
```

## Subscribe to Plan

Subscribes to a billing plan.

```http
POST /api/billing/subscribe
```

### Request Body

```typescript
{
  planId: string;
  paymentMethodId: string;
  interval: 'month' | 'year';
}
```

### Response

```typescript
{
  success: boolean;
  subscription: {
    id: string;
    planId: string;
    status: 'active' | 'pending' | 'failed';
    currentPeriodEnd: string;
    features: {
      tokensPerMonth: number;
      maxVideosPerMonth: number;
      maxDurationPerVideo: number;
      additionalFeatures: string[];
    };
  };
}
```

## Token Cost Reference

Token consumption rates for different services:

| Service           | Base Cost | Additional Factors                    |
|------------------|-----------|---------------------------------------|
| Video Generation | 100       | +50 per minute of duration           |
| Image Generation | 25        | +10 for high resolution              |
| Voice Generation | 15        | +5 per minute of audio               |
| Music Generation | 30        | +10 per minute of music              | 