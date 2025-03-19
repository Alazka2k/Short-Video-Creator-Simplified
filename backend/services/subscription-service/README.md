# Subscription Service

## Overview

The Subscription Service manages billing, payments, subscriptions, and token management for the Short Video Creator application. It provides a comprehensive solution for handling user subscriptions, token allocations, usage tracking, and payment processing.

## Architecture

The service follows a layered architecture:

1. **Service Interface Layer**: `SubscriptionServiceInterface` class that exposes methods to interact with the service
2. **Data Access Layer**: Classes for interacting with the database tables
3. **Utility Layer**: Helper classes for specific functionality like payment processing and token calculations

## Components

### Data Access Components

- `PlansDataAccess`: Manages subscription plans data
- `SubscriptionsDataAccess`: Handles user subscription records
- `TokenPackagesDataAccess`: Manages token packages available for purchase
- `TokenTransactionsDataAccess`: Tracks token allocations and usage
- `PaymentsDataAccess`: Records payment transactions

### Service Integrations

- `StripeService`: Handles payment processing via Stripe, including:
  - One-time payments for token packages
  - Subscription management
  - Webhook handling for payment notifications

### Utilities

- `TokenCalculator`: Calculates token costs for different services based on configuration

## Database Schema

The service interacts with the following tables:

- `plans`: Subscription tiers, pricing, and features
- `user_subscriptions`: User's active and historical subscriptions
- `token_packages`: Available token packages for purchase
- `token_transactions`: Record of token allocations and usage
- `payments`: Payment records for subscriptions and token purchases

## API Endpoints

### Plans

- `GET /plans`: List all subscription plans
- `GET /plans/:planId`: Get details for a specific plan

### Subscriptions

- `GET /subscriptions/user/:userId`: Get user's active subscription
- `POST /subscriptions`: Create a new subscription
- `PUT /subscriptions/:subscriptionId`: Update an existing subscription
- `POST /subscriptions/:subscriptionId/cancel`: Cancel a subscription

### Tokens

- `GET /tokens/balance/:userId`: Get user's current token balance
- `POST /tokens/allocate`: Allocate tokens to a user (from subscription)
- `POST /tokens/deduct`: Deduct tokens for service usage
- `POST /tokens/purchase`: Purchase a token package
- `GET /transactions/user/:userId`: Get user's token transaction history
- `GET /token-costs`: Get token costs for different services
- `POST /calculate-job-cost`: Calculate token cost for a job

### Token Packages

- `GET /token-packages`: List all available token packages
- `GET /token-packages/:packageId`: Get details for a specific token package

### Payments

- `GET /payments/user/:userId`: Get user's payment history
- `GET /payments/summary/:userId`: Get a summary of user's payments

### Webhooks

- `POST /webhooks/stripe`: Receive payment events from Stripe

## Usage Examples

### Creating a New Subscription

```javascript
// Request
POST /subscriptions
{
  "user_id": "user123",
  "plan_id": 2,
  "billing_frequency": "monthly",
  "payment_provider": "stripe",
  "external_payment_id": "pi_123456789",
  "amount": 24.99
}

// Response
{
  "subscription_id": "sub_abc123",
  "user_id": "user123",
  "plan_id": 2,
  "status": "active",
  "start_date": "2023-11-01T00:00:00.000Z",
  "end_date": "2023-12-01T00:00:00.000Z",
  "billing_frequency": "monthly",
  "created_at": "2023-11-01T00:00:00.000Z",
  "updated_at": "2023-11-01T00:00:00.000Z"
}
```

### Tracking Token Usage

```javascript
// Request
POST /tokens/deduct
{
  "userId": "user123",
  "jobId": "job456",
  "serviceName": "image",
  "tokenAmount": 50,
  "metadata": {
    "sceneCount": 5
  }
}

// Response
{
  "transaction_id": "tr_xyz789",
  "user_id": "user123",
  "job_id": "job456",
  "transaction_type": "deduction",
  "amount": 50,
  "service_type": "image",
  "transaction_date": "2023-11-10T14:25:00.000Z"
}
```

## Configuration

The service uses the following environment variables:

- `SUBSCRIPTION_SERVICE_PORT`: Port to run the service on (default: 3010)
- `NODE_ENV`: Environment (development, staging, production)
- `STRIPE_API_KEY`: Stripe API key for payment processing
- `STRIPE_WEBHOOK_SECRET`: Secret for verifying Stripe webhook events

## Development

To run the Subscription Service locally:

1. Install dependencies: `npm install`
2. Start the service: `NODE_ENV=development node backend/services/subscription-service/index.js` 