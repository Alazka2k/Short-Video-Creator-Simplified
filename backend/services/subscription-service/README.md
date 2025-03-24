# Subscription Service

## Overview
The Subscription Service handles all subscription, payment, and token management operations. It provides APIs for managing user subscriptions, token allocations, payments, and other related functionalities.

## Architecture

### Updated Service Structure
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
cd backend/services/subscription-service
npm install
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Testing

```bash
npm test
``` 