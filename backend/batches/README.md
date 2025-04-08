# Batch Jobs

This directory contains the batch job implementations for the subscription service.

## Available Batch Jobs

### Create Payments: `CreatePaymentsBatch.js`

This batch job creates payment records for active subscriptions that are due for renewal.

**Parameters:**
- `force` (boolean, optional): Force payment creation regardless of due date

**Implementation Details:**
- Extends `BaseBatch` class
- Creates payment records for subscriptions that are due for renewal
- Updates subscription status and billing period dates

### Collect Payments: `CollectPaymentsBatch.js`

This batch job processes pending payments and updates their status based on the payment provider's response.

**Parameters:**
- `force` (boolean, optional): Force collection regardless of payment status

**Implementation Details:**
- Extends `BaseBatch` class
- Processes pending payments through the payment provider
- Updates payment and subscription status based on provider response

### Retry Failed Payments: `RetryFailedPaymentsBatch.js`

This batch job retries failed payments for subscriptions that are in the status `failed`. Retry should be done twice. If the payment is still not successful, the payment status is set to `failed` and the counter is incremented.

**Parameters:**
- `force` (boolean, optional): Force retry regardless of retry count

   
### Process Pending Cancellations: `ProcessPendingCancellationsBatch.js`

This batch job processes pending cancellations for subscriptions that have reached their cancellation date.

**Parameters:**
- `force` (boolean, optional): Force processing regardless of cancellation date

**Implementation Details:**
- Extends `BaseBatch` class
- Processes subscriptions with pending cancellations
- Updates subscription status and end dates

### Subscription Renewals: `SubscriptionRenewalsBatch.js`

This batch job updates the current_period_start and current_period_end for active subscriptions and allocates tokens for the users subscriptions.

**Parameters:**
- `force` (boolean, optional): Force renewal regardless of period end date

**Implementation Details:**
- Extends `BaseBatch` class
- Updates subscription period dates
- Allocates tokens for renewed subscriptions

## Base Classes

### BaseBatch

The `BaseBatch` class provides the foundation for all batch jobs in the system. It defines the common interface and functionality that all batch jobs must implement.

**Required Properties:**
- `id`: Unique identifier for the batch job
- `name`: Display name for the batch job
- `description`: Detailed description of what the batch job does
- `parameters`: Object defining the parameters that can be passed to the batch job

**Required Methods:**
- `execute(params)`: The main method that implements the batch job's logic

## Batch Jobs Overview

### Payment management related batch jobs

#### Create Payments: `CreatePaymentsBatch.js`

This batch job creates payments for subscription renewals which are due. Due means that the `billing_period_end` is today or in the past with status `completed`. But only for subscriptions (subscription ids) which are in `active` status (need to exclude not in `pending_cancellation` or `cancelled` status). Lookup in the subscription table necessary.
Runs everday after 11:00 AM EST.
Creates then a new payment entry by calling the `create-payment` endpoint of the subscription service.

**Technical Implementation:**
- Extends `BaseBatch` class
- Uses `fetchSubscriptionsNeedingPayments` to get active subscriptions with completed billing periods
- Processes each subscription by creating a new payment via `createPayment` method
- Tracks progress and logs execution details
- Handles errors gracefully with detailed logging

**API Endpoints Used:**
- `GET /api/subscription/subscriptions/needing-payments` - Fetches subscriptions needing payments
- `POST /api/subscription/payments` - Creates a new payment entry

**Example request body for payment creation:**
```json
{
  "userId": :userId,
  "paymentType": "subscription_renewal",
  "subscriptionId": :subscriptionId, //Subscription id of the last payment of this user with payment type subscription_renewal or subscription_initial 
  "status": "open"
}
```

**Parameters:**
- `force` (boolean, optional): Force creation regardless of billing period end date

#### Collect Payments: `CollectPaymentsBatch.js`

This batch job collects payments for subscriptions that are in the status `open` and have a billing period start date today or in the past. 
Runs every day at 3:00 PM EST.

**Technical Implementation:**
- Extends `BaseBatch` class
- Uses `fetchPaymentsToCollect` to get open payments that need to be collected
- Processes each payment via `collectPayment` method
- Tracks successful and failed collections
- Provides detailed progress updates and logging

**API Endpoints Used:**
- `GET /api/subscription/payments/to-collect` - Fetches payments to collect
- `POST /api/subscription/payments/:paymentId/collect` - Collects a specific payment

**Process Flow:**
1. Identifies all payments that are in the status `open`
2. Collects the payments with Stripe
3. Updates the payment status to `completed` if the payment was successful
4. Sets the payment information in the payment entry:
  "paymentProvider": :paymentProvider,
  "externalPaymentId": :externalPaymentId,
5. Updates the payment status to `failed` if the payment was not successful

**Parameters:**
- `force` (boolean, optional): Force collection regardless of billing period start date

#### Retry Failed Payments: `RetryFailedPaymentsBatch.js`

This batch job retries failed payments for subscriptions that are in the status `failed`. Retry should be done twice. If the payment is still not successful, the payment status is set to `failed` and the counter is incremented.
Runs every day at 4:00 PM EST.

**Technical Implementation:**
- Extends `BaseBatch` class
- Uses `fetchFailedPayments` to get payments in failed status
- Processes each payment via `retryPayment` method
- Tracks retry attempts and updates payment status accordingly
- Handles subscription cancellation for permanently failed payments

**API Endpoints Used:**
- `GET /api/subscription/payments/failed` - Fetches failed payments
- `POST /api/subscription/payments/:paymentId/retry` - Retries a specific payment
- `PUT /api/subscription/payments/:paymentId` - Updates payment status

**Process Flow:**
1. Identifies all payments that are in the status `failed`
2. Retries the payments with Stripe
3. Updates the payment status to `completed` if the payment was successful
4. Updates the payment status to `failed` if the payment was not successful, adds a counter to the payment entry
5. If the payment is successful, the payment status is set to `completed` and the counter is reset to 0
6. If the payment is still not successful after 2 retries, the payment status is set to `cancelled` and the counter is incremented
7. The current subscription of the user is then cancelled (switched to the free tier)
8. The token addition is reverted (for the not paid tokens)

**Parameters:**
- `force` (boolean, optional): Force retry regardless of retry count

### Subscription management related batch jobs

#### Pending Cancellations: `ProcessPendingCancellationsBatch.js`

This batch job processes subscriptions that are marked for cancellation (`status='pending_cancellation'`) and have reached their end date.
Runs every day before the other batch jobs.

**Technical Implementation:**
- Extends `BaseBatch` class
- Uses `fetchPendingCancellations` to get subscriptions marked for cancellation
- Processes each subscription via `updateSubscriptionStatus` and `createNewSubscription` methods
- Handles different cancellation scenarios (downgrades, frequency changes, cancellations to free tier)
- Tracks progress and provides detailed logging

**API Endpoints Used:**
- `GET /api/subscription/subscriptions/pending-cancellations` - Fetches pending cancellations
- `PUT /api/subscription/subscriptions/:subscriptionId` - Updates subscription status
- `POST /api/subscription/subscriptions` - Creates a new subscription

**Process Flow:**
1. Identifies all pending cancellations where `end_date <= current_date` and status is `pending_cancellation`
2. Changes their status from `pending_cancellation` to `cancelled`
3. Sets the `ended_at` date to the current timestamp
4. Creates new subscriptions based on the `upcoming_plan_id`

**Example request body for new subscription:**
```json
{
  "userId": :userId,
  "planId": :upcomingPlanId, //The plan id of the new subscription, and the upcoming plan id of the current subscription
  "status": "active"
}
```

**Example request body for updating subscription status:**
```json
{
  "userId": :userId,
  "status": "cancelled"
}
```

**Parameters:**
- `force` (boolean, optional): Force processing regardless of end date

#### Subscription Renewals: `SubscriptionRenewalsBatch.js`

This batch job updates the current `current_period_start` and `current_period_end` for the users subscriptions and allocates tokens for the users subscriptions.
Runs every day at 5:00 PM EST.

**Technical Implementation:**
- Extends `BaseBatch` class
- Uses `fetchSubscriptionsToRenew` to get active subscriptions that need renewal
- Processes each subscription via `renewSubscription` method
- Tracks successful and failed renewals
- Provides detailed progress updates and logging

**API Endpoints Used:**
- `GET /api/subscription/subscriptions/to-renew` - Fetches subscriptions to renew
- `PUT /api/subscription/subscriptions/:userId/renew` - Renews a specific subscription

**Process Flow:**
1. Identifies all subscriptions that are in the status `active`
2. Checks if the `current_period_end` is today or in the past
3. If yes, the `current_period_start` and `current_period_end` are updated to the next monthly period
4. Allocates tokens for the users subscriptions based on the `plan_id`

**Example request body for renewal:**
```json
{
  "forceRenew": false (optional, can be empty)
}
```

**Parameters:**
- `force` (boolean, optional): Force renewal regardless of period end date

## Batch jobs Testing:

1. Manually via command line:
   ```
   NODE_ENV=development node backend/batches/process-pending-cancellations.js
   ```

2. Scheduled via cron job (recommended for production):
   ```
   0 0 * * * NODE_ENV=production node /path/to/backend/batches/process-pending-cancellations.js >> /path/to/logs/batch.log 2>&1
   ```

3. Via the admin API endpoint (where implemented):
   ```
   POST /api/admin/batches/run/process-pending-cancellations
   ```

## API Endpoints for Manual Batch Execution

The batch processing service provides the following API endpoints for manual batch execution:

1. **Get Available Batches**
   ```
   GET /api/batch/batches
   ```
   Returns a list of all available batch jobs with their descriptions and parameters.

2. **Run a Specific Batch**
   ```
   POST /api/batch/batches/:batchId/run
   ```
   Triggers the execution of a specific batch with optional parameters.

3. **Get Batch Status**
   ```
   GET /api/batch/batches/:batchId/status
   ```
   Returns the current status of a batch execution.

4. **Get Batch History**
   ```
   GET /api/batch/batches/:batchId/history
   ```
   Returns the execution history of a specific batch.

5. **Get Batch Logs**
   ```
   GET /api/batch/batches/:batchId/logs
   ```
   Returns the logs for a specific batch execution. 