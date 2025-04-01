# Batch Jobs

This directory contains batch jobs that run on a scheduled basis to perform maintenance and operational tasks for the application.

## Batch Jobs Overview

### Subscription related batch jobs

#### Pending Cancellations: `process-pending-cancellations.js`

This batch job processes subscriptions that are marked for cancellation (`status='pending_cancellation'`) and have reached their end date. It performs the following tasks:

1. Identifies all pending cancellations where `end_date <= current_date` and status is `pending_cancellation`
2. Changes their status from `pending_cancellation` to `cancelled`
3. Sets the `ended_at` date to the current timestamp
4. Creates new subscriptions based on the `upcoming_plan_id` and the endpoint `create-subscription` POST /api/subscription/subscriptions

Example request body:

```json
{
  "userId": :userId,
  "planId": :upcomingPlanId,
  "status": "active",
  "externalSubscriptionId": :externalSubscriptionId,
  "paymentProvider":"stripe",
  "externalPaymentId":"id_123"
}
```

Depending on the use case, the following actions are performed:
   - For downgrades: Creates a new subscription with the specified lower-tier plan
   - For frequency changes (Yearly <-> Monthly): Creates a new subscription with the same tier but different billing frequency
   - For cancellations to free tier: Creates a new free tier subscription (plan_id=1)
   - Sets new start date to the end date of the current billing period
   - No new end date should be set (the new subscription will be active until the user cancels or changes the plan again)
   - Sets timestamp of the old subscription (ended_at) to the timestamp when the status is switched from pending_cancellation to cancelled
   - Creates a new payment for the new subscription
   - Creates a token transaction for the new subscription
   - Updated the token balance of the user

To switch the status from pending_cancellation to cancelled, the following endpoint can be used:

`Update existing subscription` PUT /api/subscription/subscriptions/:userId

Example request body:

```json
{
  "userId": :userId,
  "status": "cancelled"
}
```

#### Create Payments: `create-payments-renewals.js`

This batch job creates payments for subscription renewals which are due. Due means that the `billing_period_end` is today or in the past with status `completed`. But only for subscriptions (subscription ids) which are in `active` status (need to exclude not in `pending_cancellation` or `cancelled` status). Lookup in the subscription table necessary.
Runs everday after 11:00 AM EST.
Creates then a new payment entry by calling the `create-payment` endpoint of the subscription service.

The endpoint is:

`Create new payment` POST /api/subscription/payments

Example request body:

```json
{
  "userId": :userId,
  "paymentType": "subscription_renewal",
  "subscriptionId": :subscriptionId, //Subscription id of the last payment of this user with payment type subscription_renewal or subscription_initial 
  "status": "open"
}
```

- User is the user id of the user who is renewing the subscription
- paymentType is the type of payment (subscription_renewal)
- subscriptionId is the id of the subscription that is being renewed
- status is the status of the payment (open)

#### Collect Payments: `collect-payments.js`

This batch job collects payments for subscriptions that are in the status `open` and have a billing period start date today or in the past. 
Runs every day at 3:00 PM EST.

1. Identifies all payments that are in the status `open`
2. Collects the payments with Stripe
3. Updates the payment status to `completed` if the payment was successful
3. Sets the payment information in the payment entry:
  "paymentProvider": :paymentProvider,
  "externalPaymentId": :externalPaymentId,
4. Updates the payment status to `failed` if the payment was not successful

The endpoint is:

`Update existing payment` PUT /api/subscription/payments/:paymentId //TODO: Add endpoint in the subscription service?

Example request body:

```json
{
  "paymentProvider": :paymentProvider,
  "externalPaymentId": :externalPaymentId,
  "status": "completed"
}
```

#### Retry Failed Payments: `retry-failed-payments.js`

This batch job retries failed payments for subscriptions that are in the status `failed`. Retry should be done twice. If the payment is still not successful, the payment status is set to `failed` and the counter is incremented.
Runs every day at 4:00 PM EST.

1. Identifies all payments that are in the status `failed`
2. Retries the payments with Stripe
3. Updates the payment status to `completed` if the payment was successful
4. Updates the payment status to `failed` if the payment was not successful, adds a counter to the payment entry 
//TODO: New column in the payments table
6. If the payment is successful, the payment status is set to `completed` and the counter is reset to 0.
5. If the payment is still not successful after 2 retries, the payment status is set to `cancelled` and the counter is incremented.
7. The current subscription of the user is then cancelled (switched to the free tier)
8. The token addition is reverted (for the not paid tokens). //Complicated to identify the not paid tokens. After the mvp go live.

The endpoint for updating the payment is:

`Update existing payment` PUT /api/subscription/payments/:paymentId //TODO: Add endpoint in the subscription service

Example request body (for successful payment):

```json
{
  "paymentProvider": :paymentProvider,
  "externalPaymentId": :externalPaymentId,
  "status": "completed"
}
```

Example request body (for failed payment):

```json
{
  "status": "failed"
}
```

#### Subscription Renewals: `subscription-renewals.js`

This batch job updateds the current `current_period_start` and `current_period_end` for the users subscriptions and allocates tokens for the users subscriptions.
Runs every day at 5:00 PM EST.

1. Identifies all subscriptions that are in the status `active`
2. Checks if the `current_period_end` is today or in the past
3. If yes, the `current_period_start` and `current_period_end` are updated to the next monthly period.
4. Allocates tokens for the users subscriptions based on the `plan_id`

Endpoint for renewal of the subscription (which automatically triggers the allocation of tokens):

`Renew subscription` PUT /api/subscription/subscriptions/:userId/renew

Example request body:

```json
{
  "forceRenew": false (optional, can be empty)
}
```

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