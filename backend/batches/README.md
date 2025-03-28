# Batch Jobs

This directory contains batch jobs that run on a scheduled basis to perform maintenance and operational tasks for the application.

## Available Batch Jobs

### `process-pending-cancellations.js`

This batch job processes subscriptions that are marked for cancellation (`status='pending_cancellation'`) and have reached their end date. It performs the following tasks:

1. Identifies all pending cancellations where `end_date <= current_date`
2. Changes their status from `pending_cancellation` to `cancelled`
3. Sets the `ended_at` date to the current timestamp
4. Creates new subscriptions based on the `upcoming_plan_id` if applicable:
   - For downgrades: Creates a new subscription with the specified lower-tier plan
   - For frequency changes: Creates a new subscription with the same tier but different billing frequency
   - For cancellations to free tier: Creates a new free tier subscription (plan_id=1)
   - Sets new start date to the end date of the current billing period
   - No new end date should be set (the new subscription will be active until the user cancels or changes the plan again)
   - Sets timestamp of the old subscription (ended_at) to the timestamp when the status is switched from pending_cancellation to cancelled
   - Creates a new payment for the new subscription
   - Creates a token transaction for the new subscription
   - Updated the token balance of the user

#### Use Cases

##### Downgrade (different tier and different / lower plan)

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


##### Cancellation to Free Tier (independent of tier and plan apart if the user is on the free tier)

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

## Implementation Guidelines

All batch jobs should:

1. Include proper logging to track execution
2. Implement error handling with graceful failures
3. Return a summary of actions performed
4. Be idempotent (safe to run multiple times)

## Running Batch Jobs

Batch jobs can be run in several ways:

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