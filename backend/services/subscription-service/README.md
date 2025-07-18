# Subscription Service

## Overview
The Subscription Service handles all subscription, payment, and token management operations. It provides APIs for managing user subscriptions, token allocations, payments, and other related functionalities.

## Architecture

### Service Structure
```
subscription-service/
├── controllers/              # API route controllers
│   ├── planController.js      # Plan-related endpoints
│   ├── subscriptionController.js  # Subscription-related endpoints
│   ├── tokenController.js     # Token and transaction endpoints
│   ├── paymentController.js   # Payment-related endpoints
│   └── webhookController.js   # Webhook handlers
├── services/                 # Business logic layer
│   ├── subscriptionService.js # Main subscription business logic
│   ├── tokenService.js        # Token allocation/deduction logic
│   ├── paymentService.js      # Payment processing logic
│   └── planService.js         # Plan management logic
├── data/                     # Data access layer
│   ├── paymentsDataAccess.js  # Payments table operations
│   ├── plansDataAccess.js     # Plans table operations
│   ├── subscriptionsDataAccess.js  # User subscriptions operations
│   ├── tokenBalanceDataAccess.js   # Token balance operations
│   ├── tokenPackagesDataAccess.js  # Token packages operations
│   └── tokenTransactionsDataAccess.js  # Token transactions operations
├── utils/                    # Utility functions
│   ├── tokenCalculator.js     # Token calculation utilities
│   └── stripeService.js       # Stripe payment integration
├── middleware/               # Express middleware
│   ├── validation.js          # Request validation middleware
│   └── errorHandler.js        # Error handling middleware
├── routes/                   # Express route definitions
│   ├── planRoutes.js          # Plan routes
│   ├── subscriptionRoutes.js  # Subscription routes
│   ├── tokenRoutes.js         # Token routes
│   ├── tokenPackageRoutes.js  # Token package routes
│   ├── webhookRoutes.js       # Webhook routes
│   └── paymentRoutes.js       # Payment routes
├── index.js                  # Service entry point (much smaller now)
└── server.js                 # Express server configuration (much smaller now)
```

## Service Modules

### Controllers
Each controller handles a specific group of API endpoints and is responsible for:
- Processing request parameters and body
- Calling appropriate service methods
- Formatting and returning responses
- Error handling for its routes

### Services
The service layer contains the business logic and:
- Orchestrates operations across multiple data sources
- Implements business rules and validations
- Coordinates complex operations

### Data Access
The data access layer is responsible for:
- Raw database operations
- Query construction and execution
- Data formatting and transformation

### Utilities
Utilities provide shared helper functions:
- Token calculation for different service types
- Payment provider integration (e.g., Stripe)

### Middleware
Common middleware used across routes:
- Request validation
- Error handling
- Authentication/authorization

### Routes
Routes define the API endpoints and their corresponding controller methods:
- Define the path and HTTP method for each endpoint
- Handle request parameters and body
- Call the appropriate controller method
- Return the response from the controller

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

## Getting Started

To start the service locally:

```bash
npm run dev:subscription
```

## Testing

#### Use Cases for the Direct Tier Change

##### Upgrade (higher tier and higher plan)

Endpoint:
- `POST /subscriptions/`: Change subscription

#### Use Cases for the Delayed Tier Change (excluding Batch Job)

##### Downgrade (lower tier and lower plan)

Endpoint:
- `POST /subscriptions/`: Change subscription (with lower plan and lower plan)

###### Scenario 1: User wants to change to a lower plan (and different tier)

####### Description:
- User wants to change to a higher plan (and different tier) (e.g. Creator to Professional)
- User should first pay for the new plan when the current billing period (for the old plan) ends
- Subscription should be marked in status pending cancellation with end date as the end of the current billing period

####### Requirements for the Batch Job:
- The new subscription should be created with the new plan (set in the old subscription in column upcoming_plan_id)
- A new payment should be created for the new plan
- The old subscription should be switched to status cancelled
- The ended_at date (of the old subscription) should be set to the timestamp when the status is switched from pending_cancellation to cancelled
- The start date (of the new subscription) should be the end date of the current billing period
- No new end date should be set (the new subscription will be active until the user cancels or changes the plan again)

##### Frequency Change (same tier and different / lower / higher plan)

Endpoint:
- `POST /subscriptions/`: Change subscription (with different / lower / higher plan and same tier)

###### Scenario 1: User wants to change to a higher plan (and same tier)

####### Description:
- User wants to change from monthly to annual in the same tier (e.g. Creator with monthly to Creator with annual payment)
- User should first pay for the new plan (annual) when the current billing period (for the old plan) ends
- Subscription should be marked in status pending cancellation with end date as the end of the current billing period

####### Requirements for the Batch Job:
- The the new subscription should be created with the annual plan (set in the old subscription in column upcoming_plan_id)
- A new payment should be created for the annual plan
- The old subscription should be switched to status cancelled
- The ended_at date (of the old subscription) should be set to the timestamp when the status is switched from pending_cancellation to cancelled
- The start date (of the new subscription) should be the end date of the current billing period
- No new end date should be set (the new subscription will be active until the user cancels or changes the plan again)

###### Scenario 2: User wants to change to a lower plan (and same tier)

####### Description:
- User wants to change from annual to monthly in the same tier (e.g. Creator with annual to Creator with monthly payment)
- User should first pay for the new plan (monthly) when the current billing period (for the old plan) ends
- Subscription should be marked in status pending cancellation with end date as the end of the current billing period

####### Requirements for the Batch Job:
- The the new subscription should be created with the monthly plan (set in the old subscription in column upcoming_plan_id)
- A new payment should be created for the monthly plan
- The old subscription should be switched to status cancelled
- The ended_at date (of the old subscription) should be set to the timestamp when the status is switched from pending_cancellation to cancelled
- The start date (of the new subscription) should be the end date of the current billing period
- No new end date should be set (the new subscription will be active until the user cancels or changes the plan again)


##### Cancellation [to Free Tier] (independent of tier and plan apart if the user is on the free tier)

Endpoint:
- `POST /subscriptions/:subscriptionId/cancel`: Cancel a subscription

###### Scenario 1: User wants to cancel their subscription and switch to the free tier

####### Description:
- User wants to cancel their subscription and switch to the free tier
- User should first pay for the new plan (monthly) when the current billing period (for the old plan) ends
- Subscription should be marked in status pending cancellation with end date as the end of the current billing period

####### Requirements for the Batch Job:
- The the new subscription should be created with the monthly plan (set in the old subscription in column upcoming_plan_id)
- A new payment should be created for the monthly plan
- The old subscription should be switched to status cancelled
- The ended_at date (of the old subscription) should be set to the timestamp when the status is switched from pending_cancellation to cancelled
- The start date (of the new subscription) should be the end date of the current billing period
- No new end date should be set (the new subscription will be active until the user cancels or changes the plan again)

## Batch Jobs