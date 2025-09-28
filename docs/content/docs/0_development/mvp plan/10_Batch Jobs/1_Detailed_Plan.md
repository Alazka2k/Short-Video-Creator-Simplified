# Detailed Plan: Batch Jobs

## 1. Overview

This document outlines the plan for the batch jobs for the MVP.

**The Core Requirement:** 
- The batch jobs shall be refactored to align with the Stripe-centric, event-driven payment model, ensuring our internal token allocation logic remains robust.

**The Solution:** 
- The batch jobs shall be refactored to align with the Stripe-centric, event-driven payment model, ensuring our internal token allocation logic remains robust.

---

## 2. Success Criteria

## Phase 1: Batch Job Enhancement & Finalization **STATUS: Not Started**
**Objective:** Refactor the existing batch jobs to align with the Stripe-centric, event-driven payment model, ensuring our internal token allocation logic remains robust.

### Task 1.1: Confirm and Refine `SubscriptionRenewalsBatch` for Token Allocation
- **Action:** This batch job is **critically important** for managing our application-specific **monthly token allocation cycle**, which is decoupled from Stripe's billing cycle (e.g., for yearly plans). The batch's logic will be reviewed and confirmed to perform the following scheduled task:
  - Query for all active subscriptions and pending cancellation subscriptions where the `current_period_end` (token allocation period) has passed.
  - For each subscription, call the `subscriptionService` to allocate the correct number of monthly tokens.
  - Update the subscription's `current_period_start` and `current_period_end` dates, advancing them by one month to schedule the next token allocation.

### Task 1.2: Refactor and Repurpose `ProcessPendingCancellationsBatch`
- **Action:** This batch job will be refactored to serve two primary functions with enhanced Stripe reconciliation:
  - **Primary Functionality:** Process subscriptions that have been canceled in Stripe and have reached the end of their paid billing period. It will query for subscriptions with a status of `pending_cancellation` where the `end_date` has passed and finalize the process by downgrading the user to the Free Tier (create new free subscription in state active).
  - **Stripe Reconciliation (Enhanced):** Before processing any cancellation, the batch will verify the current state with Stripe to ensure data consistency:
    1. **Stripe Verification**: Retrieve actual subscription status from Stripe using `stripe.subscriptions.retrieve()`
    2. **Status Reconciliation**: Compare local DB status with Stripe status and sync any discrepancies
    3. **Billing Period Validation**: Verify that Stripe's `current_period_end` has actually passed
    4. **Payment Status Check**: Confirm subscription payment status and handle failed payments appropriately
    5. **Safe Processing**: Only proceed with cancellation if Stripe confirms the subscription should be canceled
  - **Data Reconciliation Tool:** Act as a comprehensive reconciliation mechanism to compare subscription statuses between local database and Stripe, identifying and correcting discrepancies from missed webhooks, expired subscriptions, unpaid subscriptions, etc.
  - **Error Handling**: Implement robust error handling for Stripe API failures, network issues, and data inconsistencies with appropriate logging and alerting.

### Task 1.3: Refine CollectPaymentsBatch
- **Action:** The CollectPaymentsBatch shall create a new payment when a new payment is created in Stripe for a active subscription to keep the payment history in our database up to date and correct. The batch will be enhanced to act as a reconciliation tool.

### Task 1.4: Deprecate Payment-Related Batch Jobs (since Stripe handles all payment collection, renewals, and retries)
- **Action:** Since Stripe now handles all payment collection, renewals, and retries, the `CreatePaymentsBatch`, `CollectPaymentsBatch`, and `RetryFailedPaymentsBatch` are redundant. They will be **deprecated and removed** from the system to eliminate legacy code and rely solely on Stripe webhooks for payment state changes.
---