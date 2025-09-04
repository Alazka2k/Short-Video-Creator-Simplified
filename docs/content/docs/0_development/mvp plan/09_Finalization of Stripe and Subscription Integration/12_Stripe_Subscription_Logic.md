# Stripe Payment & Subscription Logic

## 1. Guiding Principle: Stripe as the Source of Truth

The entire payment and subscription system is designed with a single guiding principle: **Stripe is the single source of truth for all subscription states and payment information.** Our local database acts as a synchronized, read-optimized cache of this truth. This event-driven architecture ensures robustness and data consistency.

- **Our Application's Role:** Initiate actions (e.g., create a checkout session for a new plan).
- **Stripe's Role:** Execute the financial transaction and manage the subscription lifecycle (renewals, cancellations, etc.).
- **Webhooks' Role:** Stripe informs our application of every state change via webhooks.
- **Our Backend's Role:** Listen for webhooks and update our local database to mirror the state in Stripe. Allocate monthly tokens for the user's current plan.

---

## 2. Core Scenarios

### Scenario 2.1: New User Signup (Free Tier)

This process happens during user registration and does not involve Stripe.

- **User Action:** A new user signs up for the application.
- **System Flow:**
  1.  The `auth-service` creates a new user record in the `users` table.
  2.  The `subscription-service` is called to provision a default subscription.
- **Application Data Flow:**
  1.  `subscriptionService.createSubscription` is called for the new user.
  2.  A new record is created in the `user_subscriptions` table with `plan_id = 1` (Free Tier) and `status = 'active'`.
  3.  The `token-service` logic is called to allocate the initial tokens for the Free Tier plan, creating a record in `token_transactions` and updating the user's balance in the `tokens` table.
  4.  No `payments` record is created as no money is exchanged. No interaction with Stripe occurs.

### Scenario 2.2: Upgrade from Free to a Paid Plan

- **User Action:** A logged-in Free Tier user clicks "Get Started" on a paid plan on the pricing page. The customer immediately gets a new subscription in Stripe and pays for the subscription.

- **System Flow (Initiation):**
  1.  **Frontend:** The `<StripeCheckoutButton>` component calls our API Gateway at `POST /api/subscription/checkout/create-subscription-session`.
  2.  **API Gateway:** Authenticates the user and forwards the request to the `subscription-service`.
  3.  **Subscription Service:**
      - The `checkoutController` receives the request.
      - It checks the local `users` table. Seeing no `stripe_customer_id`, it first calls Stripe to create a new `Customer` object.
      - It saves the new `stripe_customer_id` back to our `users` table.
      - It then calls Stripe to create a `Checkout Session` and returns the `checkoutUrl` to the frontend.
  4.  **Frontend:** The browser redirects the user to the Stripe Checkout page.
  5.  **User Action:** The user completes the payment on Stripe's page.
- **Stripe Webhook Flow (Post-Payment):** Stripe sends a series of webhooks to our endpoint (`/api/subscription/webhooks/stripe`). The most critical one is `checkout.session.completed`.
- **Application Data Flow (Handling Webhooks):**
  1.  **`paymentService` (Router):** Receives the `checkout.session.completed` event.
  2.  **Delegation:** It extracts the subscription data from the webhook payload and calls `subscriptionService.createSubscription`.
  3.  **`subscriptionService` (Logic):**
      - It cancels the user's existing Free Tier subscription (`CANCEL_FOR_UPGRADE`).
      - It creates a **new** record in the `user_subscriptions` table for the paid plan, storing the `stripe_subscription_id`, `stripe_status`, and setting the initial `current_period_start` and `current_period_end` for the first month's token allocation.
      - It creates a corresponding record in the `payments` table for this initial transaction, linking it to the new subscription.
      - It calls the `token-service` logic to allocate the initial tokens for the new plan, creating a `token_transactions` record and updating the `tokens` balance.

### Scenario 2.3: Upgrade from a Paid Plan to a Higher Tier

An upgrade is treated as an immediate and full reset of the user's benefits to the new, higher tier. The customer immediately gets a new subscription in Stripe and pays for the subscription.

- **User Action:** A user on the "Basic" plan selects the "Creator" plan as a new, higher tier plan.
- **System Flow:** The user is sent to Stripe Checkout to confirm and pay the prorated charge for the upgrade.
- **Stripe Webhook Flow:** Stripe sends a `customer.subscription.updated` webhook, followed by an `invoice.payment_succeeded` webhook for the prorated charge.
- **Application Data Flow:**
  1.  **`paymentService` (Router):** Receives the `customer.subscription.updated` event.
  2.  **Delegation:** It calls `subscriptionService.createSubscription`
  3.  **`subscriptionService` (Logic):**
      - Immediately marks the old "Basic" plan subscription record as `canceled`.
      - Creates a brand new `user_subscriptions` record for the "Creator" plan with a `status` of `active`.
      - It stores the `stripe_subscription_id`, `stripe_status` 
      - The new subscription gets a fresh token allocation period, with `current_period_start` set to today and `current_period_end` set to one month from today.
      - The user receives the **full monthly token allocation** for the new "Creator" plan immediately.
  4.  The `invoice.payment_succeeded` event is processed to create a `payments` record for the prorated upgrade cost.

### Scenario 2.4: Tier Downgrade

- **User Action:** A user on the a paid subscription plan (e.g. "Creator" either yearly or monthly) downgrades to the another paid plan e.g. ("Basic" either yearly or monthly) via our webpage and forwarded to the Stripe Customer Portal. The customer shall not pay immediately but the downgrade should take effect at the end of the current billing period (at the end of the current billing period (year or month)), then the customer should pay the prorated amount for the downgraded, new plan.
- **System Flow:** Stripe schedules this change to take effect at the end of the current billing period (at the end of the current billing period (year or month)).
- **Stripe Webhook Flow:** Stripe sends a `customer.subscription.updated` webhook immediately. The payload will contain information about the *future* plan.
- **Application Data Flow:**
  1.  **`paymentService` (Router):** Receives the `customer.subscription.updated` event.
  2.  **Delegation:** It calls `subscriptionService.updateSubscription`.
  3.  **`subscriptionService` (Logic):**
      - It does **NOT** change the primary `plan_id` of the active subscription.
      - It populates the `upcoming_plan_id` field on the `user_subscriptions` record with the new, lower-tier plan ID.
      - It sets a `end_date` to the current subscription for when the tier downgrading will take effect.
      - It sets `cancel_at_period_end` to `true` to indicate that the subscription will be canceled at the end of the current billing period.
      - The user remains on the current plan until billing period ends, and the `SubscriptionRenewalsBatch` continues to allocate the token amount monthly of the current subscription, ensuring they receive the benefits they paid for.
  4.  **At Period End:** When the billing period is up, Stripe executes the downgrade and sends another `customer.subscription.updated` event confirming the plan change.
  5.  **Finalization:**
      - The `paymentService` receives the final webhook and calls `subscriptionService.createSubscription`.
      - The `subscriptionService` now updates the old subscription record to status cancelled and creates a new (the downgraded) subscription record.
      - A `payments` record is created to log the transaction at the period end.

### Scenario 2.5: Cancellation (Downgrade to Free)

- **User Action:** A user on a paid plan clicks "Cancel Subscription" in the Stripe Customer Portal.
- **System Flow:** This action in Stripe sets the subscription to be canceled at the end of the current billing period. The user retains paid access until then.
- **Stripe Webhook Flow:** Stripe immediately sends a `customer.subscription.updated` webhook. The key change in the payload will be `cancel_at_period_end: true`. When the billing period actually ends, Stripe will send a `customer.subscription.deleted` webhook.
- **Application Data Flow:**
  1.  **Handling `customer.subscription.updated`:**
      - **`paymentService`:** Receives the event and calls `subscriptionService.updateSubscription`.
      - **`subscriptionService`:** Updates the `cancel_at_period_end` flag on our local `user_subscriptions` record. The `status` remains `'active'` and the user continues to receive their monthly token allocations until the paid period ends. The `end_date` is set to the future date of the cancellation. The `upcoming_plan_id` is set to the Free Tier plan. It sets `cancel_at_period_end` to `true` to indicate that the subscription will be canceled at the end of the current billing period.
  2.  **Handling `customer.subscription.deleted` (at period end):**
      - **`paymentService`:** Receives the event and calls `subscriptionService.cancelSubscription`.
      - **`subscriptionService`:** It finds the active subscription, changes its `status` to `'canceled'`, and sets the `ended_at` timestamp. It then calls `createSubscription` to provision a new Free Tier subscription, which includes the initial token allocation for the Free plan.
      - No `payments` record is created.

### Scenario 2.6: Payment Frequency Change (e.g., Monthly to Yearly)

A payment frequency change is a billing-only event and does **not** affect the user's monthly token allocation cycle.

- **User Action:** A user on the "Basic Monthly" plan switches to the "Basic Yearly" plan.
- **System Flow:** Stripe handles the prorated billing change.
- **Stripe Webhook Flow & Application Data Flow:**
  1.  **`paymentService`** receives the `customer.subscription.updated` event.
  2.  **`subscriptionService`** is called to update the subscription.
  3.  The service updates the `plan_id` on the *existing* `user_subscriptions` record to point to the new yearly plan.
  4.  Crucially, the `current_period_start` and `current_period_end` dates are **not** changed.
  5.  The `SubscriptionRenewalsBatch` continues its monthly token allocation on the original, uninterrupted schedule. A `payments` record is created to log the prorated transaction.
  6.  A new `payments` record is created when the next billing takes place and is received by the webhook.

### Scenario 2.7: Monthly Token Renewal (via Batch Job)

This is an internal, application-driven process, independent of Stripe's billing cycle for users on yearly plans.

- **Trigger:** The `SubscriptionRenewalsBatch` runs on a schedule (e.g., daily).
- **System Flow:**
  1.  The batch job queries for all `user_subscriptions` where `status = 'active'` and the `current_period_end` (the token allocation date) is in the past.
  2.  For each subscription found, it calls `subscriptionService.renewSubscription`.
- **Application Data Flow:**
  1.  **`subscriptionService.renewSubscription` (Logic):**
      - It calculates the new token allocation period (e.g., advances `current_period_start` and `current_period_end` by one month).
      - It updates the subscription record with these new dates.
      - It calls the `token-service` logic to allocate the monthly tokens for the user's current plan, creating a new `token_transactions` record and updating the `tokens` balance.
      - This process does not create a `payments` record, as it is decoupled from the billing event.
