# Stripe Integration Development Plan (Revised)

## Overview

This document outlines the development plan for implementing Stripe payment processing in the Short-Video-Creator-Simplified application, focusing on **Stripe Checkout**, **Stripe Customer Portal**, and **Webhook-driven synchronization**. It covers necessary components, code changes, database updates, API endpoints, and revised batch job roles.

## Components to Develop

### 1. Stripe Service (`utils/stripeService.js`)

**Purpose:** A dedicated class acting as the sole interface with the Stripe Node.js SDK, encapsulating all direct API interactions.

**Key Responsibilities & Methods:**
*   Initialize the Stripe client with the secret key.
*   Store and use the webhook secret for signature verification.
*   Implement methods for:
    *   `createCustomer`: Creates a customer in Stripe.
    *   `createCheckoutSession`: Creates Stripe Checkout sessions for both subscription initiations and one-time token package purchases. Handles necessary parameters like customer ID, line items (price IDs), mode, success/cancel URLs, and metadata.
    *   `createCustomerPortalSession`: Creates Stripe Customer Portal sessions for user self-service.
    *   `updateSubscription`: Updates an existing Stripe subscription (used for plan changes like upgrades/downgrades/frequency changes). Handles parameters like items, proration behavior, and cancellation flags.
    *   `cancelSubscription`: Cancels a Stripe subscription, either immediately or at the period end.
    *   `constructWebhookEvent`: Verifies the signature of incoming webhooks and constructs the event object.
    *   (Optional) Helper methods to retrieve Stripe objects like `getSubscription`, `getInvoice` if needed for webhook processing or reconciliation.
*   Implement robust error handling for all Stripe API calls.
*   Support passing **deterministic idempotency keys** for mutating operations.

### 2. Frontend Integration

**Approach:** Utilize simple button components that trigger backend API calls to create Stripe sessions and then redirect the user to Stripe's hosted pages (Checkout or Customer Portal).

**Components:**
*   **`CheckoutButton` Component:**
    *   Takes parameters like `priceId`, `type` ('subscription'/'token_package'), `packageId`.
    *   Calls the backend endpoint (`/checkout/create-session`) to get a Stripe Checkout URL.
    *   Redirects the user's browser to the received Stripe URL.
    *   Handles loading states and displays appropriate button text.
*   **`PlanSelection` Component:**
    *   Fetches available plans (including their `stripe_price_id`) from the backend.
    *   Displays plan details.
    *   Integrates the `CheckoutButton` for each selectable plan, passing the correct `stripe_price_id` and type 'subscription'.
*   **`TokenPackagePurchase` Component:**
    *   Fetches available token packages (including their `stripe_price_id`) from the backend.
    *   Displays package details.
    *   Integrates the `CheckoutButton` for each package, passing the correct `stripe_price_id`, type 'token_package', and `packageId`.
*   **`CustomerPortalButton` Component:**
    *   Calls the backend endpoint (`/portal/create-session`) to get a Stripe Customer Portal URL.
    *   Redirects the user's browser to the received Stripe URL.
    *   Handles loading states.
*   **UI Updates:** Update `UserDashboard`, `SubscriptionManagement` pages to display subscription status and token balance fetched from the backend (kept in sync via webhooks) and include the `CustomerPortalButton`.

### 3. Backend Integration

#### Webhook Controller (`controllers/webhookController.js`)

**Purpose:** Central component responsible for receiving, verifying, and processing incoming Stripe webhook events to keep the application state synchronized.

**Key Responsibilities:**
*   Define the handler function for the `POST /webhooks/stripe` route.
*   Retrieve the raw request body and `Stripe-Signature` header.
*   Call `StripeService.constructWebhookEvent` to verify the signature and get the event object. Handle signature verification errors.
*   **Implement idempotency:** Check if the `event.id` has already been processed before taking action (requires a persistent store for event IDs).
*   Use a `switch` statement on `event.type` to route to specific handler methods within the controller.
*   Implement handler methods for key events:
    *   `handleCheckoutSessionCompleted`: Identify purpose (subscription vs. token package) based on session mode and metadata. Potentially create initial 'pending' payment record or update user with customer ID. Actual activation/allocation often relies on subsequent events.
    *   `handleInvoicePaid`: **Crucial for renewals and initial payments.** Create/update local `payments` record to 'completed'. Update `user_subscriptions` with new `current_period_start`/`end`. Trigger token allocation logic (e.g., signal `SubscriptionRenewalsBatch`).
    *   `handleInvoicePaymentFailed`: Log failure, update local `payments` record to 'failed'. Rely on Stripe Smart Retries and subsequent subscription events for final state.
    *   `handleSubscriptionUpdated`: Update the corresponding local `user_subscriptions` record based on changes in the Stripe subscription object (status, plan, `cancel_at_period_end`, etc.).
    *   `handleSubscriptionDeleted`: Update the local `user_subscriptions` record to reflect cancellation (e.g., switch to free tier plan, set status to 'cancelled', set `ended_at`).
*   Log events received and processing outcomes (success/failure).
*   Return `200 OK` promptly to Stripe upon successful receipt and verification (even if processing takes longer or fails, unless a retry is desired for processing failures).

#### Controller Enhancements (`PaymentController`, `SubscriptionController`, `TokenPackageController`)

*   **`PaymentController` / `TokenPackageController`:** Refocus to handle requests for creating Checkout sessions by calling `StripeService.createCheckoutSession`.
*   **`SubscriptionController`:**
    *   Handle requests for creating Customer Portal sessions by calling `StripeService.createCustomerPortalSession`.
    *   Handle requests to update plans (`PUT /subscriptions/:subscriptionId`) by validating the request, determining the new `stripe_price_id`, and calling `StripeService.updateSubscription`.
    *   Handle requests to cancel subscriptions (`POST /subscriptions/:subscriptionId/cancel`) by calling `StripeService.cancelSubscription`.

### 4. Batch Job Enhancements (Revised Roles)

*   **Eliminate/Deprecate:** `CreatePaymentsBatch`, `CollectPaymentsBatch`, `RetryFailedPaymentsBatch`. These functions are superseded by Stripe's automated billing and webhook events.
*   **Eliminate/Re-evaluate:** `ProcessPendingCancellationsBatch`. Handling plan changes/cancellations via direct Stripe API calls and reacting to webhooks is the preferred, more synchronized approach.
*   **Refine:** `SubscriptionRenewalsBatch`:
    *   **New Focus:** Primarily responsible for **allocating tokens** upon successful subscription renewal.
    *   **Trigger:** Should be triggered or informed by the processing of `invoice.paid` webhooks, not run independently based on dates. It processes subscriptions confirmed to have entered a new, paid period.
    *   **Action:** Calls `TokenService` to allocate tokens based on the subscription's current plan. Marks the allocation as complete for that period.

## Database Schema Updates (Revised)

Implement the necessary schema changes via migrations to support the integration.

### Required Schema Changes:

1.  **`users` Table:**
    *   Add `stripe_customer_id` (VARCHAR, Nullable, Indexed)
2.  **`user_subscriptions` Table:**
    *   Add `stripe_subscription_id` (VARCHAR, Nullable, Indexed)
    *   Add `stripe_price_id` (VARCHAR, Nullable) - Stores the *currently active* Stripe Price ID.
    *   Add `stripe_status` (VARCHAR, Nullable) - Mirrors Stripe status (e.g., `active`, `past_due`).
    *   Add `cancel_at_period_end` (BOOLEAN, Default: false) - Mirrors Stripe flag.
    *   Add `current_period_start` (TIMESTAMP, Nullable) - Synced from Stripe via webhooks.
    *   Add `current_period_end` (TIMESTAMP, Nullable) - Synced from Stripe via webhooks.
3.  **`payments` Table:** (Represents Payment Events)
    *   Add `stripe_payment_intent_id` (VARCHAR, Nullable, Indexed)
    *   Add `stripe_invoice_id` (VARCHAR, Nullable, Indexed) - Key link for subscription payments.
    *   Add `stripe_charge_id` (VARCHAR, Nullable, Indexed)
    *   Add `payment_method_details` (JSONB, Nullable) - e.g., card brand, last4.
    *   Add `receipt_url` (VARCHAR, Nullable)
    *   *Ensure previous incorrect Stripe fields are removed.*
4.  **`plans` Table:**
    *   Add `stripe_product_id` (VARCHAR, Nullable)
    *   Add `stripe_price_id` (VARCHAR, Nullable, Indexed) - The *default* Price ID for this plan/frequency.
5.  **`token_packages` Table:**
    *   Add `stripe_product_id` (VARCHAR, Nullable)
    *   Add `stripe_price_id` (VARCHAR, Nullable, Indexed)

### Migration Script Example (`YYYYMMDDHHMMSS_add_stripe_integration_fields.js`):

*(Generate a migration script based on the schema changes detailed above. Ensure both `up` and `down` functions correctly add/remove the necessary columns and indexes.)*

*   Add `stripe_customer_id` to `users`.
*   Add `stripe_subscription_id`, `stripe_price_id`, `stripe_status`, `cancel_at_period_end`, `current_period_start`, `current_period_end` to `user_subscriptions`.
*   Add `stripe_payment_intent_id`, `stripe_invoice_id`, `stripe_charge_id`, `payment_method_details`, `receipt_url` to `payments`. Remove any incorrectly placed subscription fields from `payments`.
*   Add `stripe_product_id`, `stripe_price_id` to `plans`.
*   Add `stripe_product_id`, `stripe_price_id` to `token_packages`.

### Data Access Layer Updates

*   Update Data Access Object (DAO) or repository files (e.g., `userDataAccess.js`, `subscriptionDataAccess.js`, `paymentDataAccess.js`, etc.) to support the new schema.
*   Implement methods to read and write the new Stripe ID fields.
*   Implement lookup methods to find local records using Stripe IDs (e.g., `findSubscriptionByStripeId`, `findUserByStripeCustomerId`).
*   Ensure DAO methods used by webhook handlers correctly update the mirrored Stripe status and period fields on the `user_subscriptions` table based on data received from Stripe.

## API Endpoints (Revised Summary)

### New/Primary Endpoints:

1.  **Create Checkout Session:**
    *   `POST /api/subscription/checkout/create-session`
    *   Handles requests for both new subscriptions and token package purchases.
    *   Requires `type` ('subscription' | 'token_package') and `priceId` in the request body.
    *   Returns a Stripe Checkout session URL for frontend redirection.
2.  **Create Customer Portal Session:**
    *   `POST /api/subscription/portal/create-session`
    *   Requires `returnUrl` in the request body.
    *   Returns a Stripe Customer Portal session URL for frontend redirection.
3.  **Webhook Handler:**
    *   `POST /api/subscription/webhooks/stripe`
    *   Receives all events from Stripe. Requires signature verification. Triggers internal processing via `WebhookController`.

### Endpoints Triggering Stripe Actions:

4.  **Update Subscription (Plan Change):**
    *   `PUT /api/subscription/subscriptions/:subscriptionId`
    *   Handles user requests to change their current subscription plan (upgrade, downgrade, frequency change).
    *   Requires the target `planId` (or `stripe_price_id`) in the request body.
    *   Triggers `StripeService.updateSubscription` call.
5.  **Cancel Subscription:**
    *   `POST /api/subscription/subscriptions/:subscriptionId/cancel`
    *   Handles user requests to cancel their subscription.
    *   Triggers `StripeService.cancelSubscription` call (typically with `cancel_at_period_end=true`).

### Supporting/Existing Endpoints (Ensure Relevant Stripe IDs Included Where Applicable):

*   `GET /api/subscription/plans`: Return plans including `stripe_price_id`.
*   `GET /api/subscription/token-packages`: Return packages including `stripe_price_id`.
*   `GET /api/subscription/tokens/balance/:userId`
*   `GET /api/subscription/payments/user/:userId`: Return payment history.
*   `GET /api/subscription/transactions/user/:userId`: Return token transaction history.

### Removed/De-emphasized Endpoints:

*   Endpoints previously designed for direct payment collection (`/collect`).
*   Endpoints previously designed for payment retries (`/retry`).
*   Endpoints for manually adding/managing payment methods (handled by Checkout/Portal).

## Error Handling

*   Implement comprehensive try/catch blocks and error handling within the `StripeService` for all Stripe API interactions. Log detailed error information from Stripe.
*   Ensure the `WebhookController` gracefully handles errors during event processing. Log errors thoroughly. Return appropriate HTTP status codes (200 for successful receipt acknowledgement, 500 for internal processing errors where a Stripe retry might be appropriate).
*   Implement user-facing error handling on the frontend for failures during the creation of Checkout or Customer Portal sessions.

## Monitoring and Logging

*   Log all incoming webhook events (including `event.type` and `event.id`).
*   Log the start and successful completion or failure of processing for each significant webhook event type. Include relevant IDs (subscription ID, invoice ID, user ID).
*   Log any errors encountered during `StripeService` API calls.
*   Monitor the health of the `POST /api/subscription/webhooks/stripe` endpoint (response times, error rates - especially 5xx errors which might indicate processing failures).
*   Monitor the execution status, duration, and any errors from the revised `SubscriptionRenewalsBatch` (Token Allocation).

## Idempotency Implementation

*   **Webhook Handling:** Implement a mechanism within the `WebhookController` to check if a Stripe `event.id` has already been successfully processed before executing the main logic. This requires storing processed event IDs persistently (e.g., in a database table or cache like Redis) with a suitable TTL. If an event ID is found, log it as a duplicate and return 200 OK immediately.
*   **API Calls:** For backend-initiated mutating calls to the Stripe API (e.g., via `StripeService` methods like `updateSubscription`, `cancelSubscription`, `createCustomer`) that might be retried due to network issues or timeouts, generate and pass a **deterministic** `Idempotency-Key` header. The key should be unique for each distinct logical operation attempt but the same across retries of that *same* attempt. (e.g., use a UUID generated for the specific user action).