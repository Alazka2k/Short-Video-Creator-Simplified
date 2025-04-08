# Batch Jobs Testing

This directory contains test data and test scripts for the batch jobs in the Short-Video-Creator-Simplified project.

## Test Data

The `test-data` directory contains scripts to create test data for batch jobs. These scripts create the necessary database entries to test the batch jobs.

### Available Test Data Scripts

- `create-test-subscription.js`: Creates a test subscription for a user
- `create-test-payment.js`: Creates a test payment for a subscription
- `create-test-data.js`: Creates all test data needed for batch job testing

## Test Scripts

The `test-scripts` directory contains scripts to test the batch jobs. These scripts run the batch jobs and verify that they work as expected.

### Available Test Scripts

- `test-create-payments.js`: Tests the Create Payments batch job
- `test-collect-payments.js`: Tests the Collect Payments batch job
- `test-retry-failed-payments.js`: Tests the Retry Failed Payments batch job
- `test-process-pending-cancellations.js`: Tests the Process Pending Cancellations batch job
- `test-subscription-renewals.js`: Tests the Subscription Renewals batch job
- `test-all-batch-jobs.js`: Tests all batch jobs in sequence

## Test Scenarios

### Create Payments Batch Job

**Test Scenario 1: Create Payment for Active Subscription (Subscription table) with Expired Billing Period (Payment table)**
- **Setup**: Create an active subscription with a billing period end date in the past
- **Expected Behavior**: The batch job should create a new payment record for the subscription
- **Verification**: Check that a new payment record was created with the correct subscription ID and user ID

**Test Scenario 2: No Payment Creation for Active Subscription (Subscription table) with Future Billing Period (Payment table)**
- **Setup**: Create an active subscription with a billing period end date in the future
- **Expected Behavior**: The batch job should not create a new payment record for the subscription
- **Verification**: Check that no new payment record was created for the subscription

**Test Scenario 3: No Payment Creation for Cancelled Subscription (Subscription table)**
- **Setup**: Create a cancelled subscription with a billing period end date in the past
- **Expected Behavior**: The batch job should not create a new payment record for the subscription
- **Verification**: Check that no new payment record was created for the subscription

### Collect Payments Batch Job

**Test Scenario 1: Collect Payment for Open Payment**
- **Setup**: Create an open payment record for a subscription
- **Expected Behavior**: The batch job should update the payment status to 'completed'
- **Verification**: Check that the payment status was updated to 'completed'

**Test Scenario 2: No Collection for Completed Payment**
- **Setup**: Create a completed payment record for a subscription
- **Expected Behavior**: The batch job should not update the payment status
- **Verification**: Check that the payment status was not updated

### Retry Failed Payments Batch Job

**Test Scenario 1: Retry Failed Payment**
- **Setup**: Create a failed payment record for a subscription
- **Expected Behavior**: The batch job should retry the payment and update the payment status to 'completed'
- **Verification**: Check that the payment status was updated to 'completed'

**Test Scenario 2: Retry Failed Payment Twice**
- **Setup**: Create a failed payment record for a subscription that has already been retried once
- **Expected Behavior**: The batch job should retry the payment and update the payment status to 'completed'
- **Verification**: Check that the payment status was updated to 'completed'

**Test Scenario 3: Cancel Subscription After Two Failed Retries**
- **Setup**: Create a failed payment record for a subscription that has already been retried twice
- **Expected Behavior**: The batch job should update the payment status to 'cancelled' and cancel the subscription
- **Verification**: Check that the payment status was updated to 'cancelled' and the subscription was cancelled

### Process Pending Cancellations Batch Job

**Test Scenario 1: Process Pending Cancellation**
- **Setup**: Create a subscription with status 'pending_cancellation' and an end date in the past
- **Expected Behavior**: The batch job should update the subscription status to 'cancelled' and set the ended_at date
- **Verification**: Check that the subscription status was updated to 'cancelled' and the ended_at date was set

**Test Scenario 2: No Processing for Future End Date**
- **Setup**: Create a subscription with status 'pending_cancellation' and an end date in the future
- **Expected Behavior**: The batch job should not update the subscription status
- **Verification**: Check that the subscription status was not updated

### Subscription Renewals Batch Job

**Test Scenario 1: Renew Subscription with Expired Billing Period**
- **Setup**: Create an active subscription with a billing period end date in the past
- **Expected Behavior**: The batch job should update the current_period_start and current_period_end dates and allocate tokens
- **Verification**: Check that the current_period_start and current_period_end dates were updated and tokens were allocated

**Test Scenario 2: No Renewal for Future Billing Period**
- **Setup**: Create an active subscription with a billing period end date in the future
- **Expected Behavior**: The batch job should not update the current_period_start and current_period_end dates
- **Verification**: Check that the current_period_start and current_period_end dates were not updated

## Running the Tests

To run all batch job tests:

```bash
node tests/batches/test-scripts/test-all-batch-jobs.js
```

To run a specific batch job test:

```bash
node tests/batches/test-scripts/test-create-payments.js
```

To create test data:

Complete test data: 
```bash
node tests/batches/test-data/create-test-data.js
``` 

Create test subscription:
```bash
node tests/batches/test-data/create-test-subscription.js
```

Create test payment:
```bash
node tests/batches/test-data/create-test-payment.js
```	