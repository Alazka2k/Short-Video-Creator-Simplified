# Stripe Integration Plan for Short-Video-Creator-Simplified

## Current System Overview

The application currently has a subscription and payment system with the following components:

### Payment Processing:
- Payment records are stored in the `payments` table
- Payments can be for subscriptions or token packages
- Payment `status` includes: 'open', 'completed', 'failed'
- A mock Stripe service exists but is not fully integrated

### Subscription Management:
- Subscriptions are stored in the `user_subscriptions` table (`plan_id`, `status`, `start_date`, `end_date`, etc.)
- Plans (`plans` table) define `price`, `billing_frequency` (monthly/yearly), features, and limits.
- Payments (`payments` table) track initial and renewal payments, linked to subscriptions.
- A local concept of `billing_period_start`/`end` exists on payments.
- Subscription `status` includes: `active`, `pending_cancellation`, `cancelled`.

### Token Packages:
- Token packages (`token_packages` table) allow one-time token purchases.
- Payments for packages are stored in the `payments` table.
- Token transactions (`token_transactions`) and balances (`tokens`) are tracked.

### Batch Jobs (Current State):
- `CreatePaymentsBatch.js`: Creates local 'open' payment records for renewals based on local subscription state.
- `CollectPaymentsBatch.js`: Attempts to process local 'open' payments via Stripe.
- `RetryFailedPaymentsBatch.js`: Retries failed payments via Stripe based on local state.
- `ProcessPendingCancellationsBatch.js`: Handles local state changes for downgrades/cancellations based on `upcoming_plan_id`.
- `SubscriptionRenewalsBatch.js`: Updates local subscription periods and allocates tokens, decoupled from payment status.

**(Note: The roles of these batch jobs will be significantly revised or eliminated with the Stripe integration, as detailed below.)**

## Payment Flow with Stripe (Using Stripe Checkout)

The integration with Stripe will follow this secure payment flow:

### 1. Frontend Initiates Payment
- User selects a product (subscription plan or token package).
- Frontend calls our backend API (`POST /api/subscription/checkout/create-session`) to create a checkout session.

### 2. Backend Creates Checkout Session
- Our backend, using the `StripeService`, creates a checkout session with Stripe.
- This requires our Stripe secret key.
- The checkout session contains the product (`priceId`), customer info (`stripe_customer_id` if known), mode (`subscription` or `payment`), and success/cancel URLs.

### 3. Frontend Redirects to Stripe Checkout
- Backend returns the checkout session `url` to the frontend.
- Frontend redirects the user to Stripe's hosted checkout page.
- User enters their payment information directly on Stripe's secure page.

### 4. Stripe Processes Payment & Subscription
- Stripe handles the actual payment processing and, if applicable, creates the Stripe Subscription object.
- Stripe sends webhook events (e.g., `checkout.session.completed`, `customer.subscription.created`, `invoice.paid`) to our backend webhook endpoint.

### 5. Backend Updates Database via Webhooks
- Our backend webhook handler (`WebhookController`) receives and verifies the webhook.
- It processes the event (e.g., `invoice.paid`) and updates our local database accordingly (creates `payments` record, updates `user_subscriptions` status and billing dates, allocates tokens).

### 6. User Returns to Application
- After payment completion, Stripe redirects the user back to our `successUrl`.
- Frontend displays a success message and updates the UI based on the expected state change (confirmation often relies on backend updates via webhooks).

Using Stripe Checkout is preferred because:
- It provides a secure, pre-built, and optimized payment flow.
- It handles 3D Secure and various payment methods automatically.
- It significantly reduces our PCI compliance burden.

## Stripe Customers and Storage

Creating and storing Stripe customers is essential:

### Why Store Stripe Customer IDs:
- **Recurring Payments:** Essential for Stripe Subscriptions.
- **Payment Method Management:** Allows users to manage saved methods via Stripe Customer Portal.
- **Subscription Management:** Links our users to their Stripe Subscriptions for updates/cancellations via API or Portal.
- **Unified View:** Connects payments, invoices, and subscriptions within Stripe.
- **Analytics:** Enables tracking of customer LTV within Stripe.

### Database Storage Requirements (Revised):

We need to store the following Stripe-related information in our database:

1.  **`users` Table:**
    *   `stripe_customer_id` (VARCHAR, Nullable, Indexed): Links to the Stripe Customer object.
2.  **`user_subscriptions` Table:** (Represents the *local application view* of the subscription)
    *   `stripe_subscription_id` (VARCHAR, Nullable, Indexed): Links to the active Stripe Subscription object.
    *   `stripe_price_id` (VARCHAR): The Stripe Price ID currently active for this subscription.
    *   `stripe_status` (VARCHAR): Mirrors Stripe's subscription status (e.g., `active`, `past_due`, `canceled`, `incomplete`, `trialing`). Updated via webhooks.
    *   `cancel_at_period_end` (BOOLEAN): Mirrors Stripe's setting. Updated via webhooks.
    *   `current_period_start` (TIMESTAMP): Mirrors Stripe's current billing period start. Updated via webhooks.
    *   `current_period_end` (TIMESTAMP): Mirrors Stripe's current billing period end. Updated via webhooks.
3.  **`payments` Table:** (Represents *payment events*)
    *   `stripe_payment_intent_id` (VARCHAR, Nullable, Indexed): From the payment event.
    *   `stripe_invoice_id` (VARCHAR, Nullable, Indexed): Crucial link for subscription payments.
    *   `stripe_charge_id` (VARCHAR, Nullable, Indexed): Link to the specific charge.
    *   `receipt_url` (VARCHAR): Link to the Stripe receipt.
    *   `payment_method_details` (JSONB): e.g., card brand, last4.
4.  **`plans` Table:**
    *   `stripe_product_id` (VARCHAR): Links to the Stripe Product representing the plan/tier.
    *   `stripe_price_id` (VARCHAR, Indexed): Links to the specific Stripe Price (e.g., monthly vs. yearly). *Crucial:* Ensure you have separate Stripe Price IDs for monthly vs. yearly options, even if they belong to the same conceptual tier.
5.  **`token_packages` Table:**
    *   `stripe_product_id` (VARCHAR): Links to the Stripe Product for the package.
    *   `stripe_price_id` (VARCHAR, Indexed): Links to the specific Stripe Price for the package.

This data links our application state to Stripe, allowing synchronization via webhooks and enabling API calls when needed (e.g., for subscription changes).

## Recurring Payments & Synchronization (Revised)

Stripe will manage the recurring billing cycle automatically.

1.  **Stripe Initiates Renewal:** Stripe creates an invoice and attempts payment before the period ends.
2.  **Webhooks are Key:** Our application listens for:
    *   `invoice.paid`: Confirms successful payment. Our webhook handler **must**:
        *   Create/update the local `payments` record (status='completed').
        *   Update the `user_subscriptions` record with the new `current_period_start`/`end` from the webhook data.
        *   Trigger token allocation for the new period (likely signaling `SubscriptionRenewalsBatch`).
    *   `invoice.payment_failed`: Logs the failure. Stripe handles retries (configure Smart Retries in Stripe).
    *   `customer.subscription.updated`/`deleted`: Reflects status changes (e.g., `past_due`, `canceled` after final retry failure) or user actions (cancellation via Portal). Our webhook handler updates the local `user_subscriptions` status, potentially reverting the user to the free tier upon final cancellation.

## Stripe Integration Plan (Revised)

### 1. Stripe Service (`utils/stripeService.js`)

Enhance/Implement to handle:
*   Stripe client initialization.
*   Customer management: `createCustomer`.
*   Checkout Sessions: `createCheckoutSession` (for subscriptions and one-time payments).
*   Customer Portal: `createCustomerPortalSession`.
*   Subscription Management: `updateSubscription` (for plan changes), `cancelSubscription`.
*   Webhook Handling: `constructWebhookEvent` (signature verification).
*   Implement robust error handling and **deterministic idempotency keys**.

### 2. Database Schema Updates (Revised)

Implement the changes detailed in the "Database Storage Requirements (Revised)" section above, ensuring Stripe IDs are added to the correct tables (`users`, `user_subscriptions`, `payments`, `plans`, `token_packages`) and subscription state fields are primarily on `user_subscriptions`.

### 3. API Endpoints (Revised)

Focus on these key endpoints:
*   `POST /api/subscription/checkout/create-session`: For initiating all paid subscriptions and token package purchases.
*   `POST /api/subscription/portal/create-session`: For redirecting users to manage their existing subscriptions.
*   `POST /api/subscription/webhooks/stripe`: **Critical endpoint** for receiving all Stripe events. Must call `WebhookController`.
*   `PUT /api/subscription/subscriptions/:subscriptionId`: For user-initiated plan changes (upgrades, downgrades, frequency changes). Triggers calls to `StripeService.updateSubscription`.
*   `POST /api/subscription/subscriptions/:subscriptionId/cancel`: For user-initiated cancellations. Triggers calls to `StripeService.cancelSubscription`.
*   Keep existing GET endpoints for listing plans, packages, checking balances, and viewing history.
*   Remove API endpoints made redundant by Checkout/Portal/automated billing (e.g., explicit payment confirmation/cancellation, adding payment methods).

### 4. Batch Job Strategy (Revised)

*   **Eliminate:** `CreatePaymentsBatch`, `CollectPaymentsBatch` (core logic), `RetryFailedPaymentsBatch`.
*   **Eliminate/Re-evaluate:** `ProcessPendingCancellationsBatch`. Aim to handle downgrades/cancellations via API calls updating the *existing* Stripe subscription and reacting to webhooks, rather than creating new local subscriptions for changes.
*   **Keep & Refine:** `SubscriptionRenewalsBatch`. Focus *only* on **token allocation**. Trigger its processing logic *after* a successful `invoice.paid` webhook has been processed for a subscription renewal. It should not manage billing dates itself.
*   **Optional (Low Priority):** Consider a `ReconciliationBatch` to periodically compare local state with Stripe API state as a fallback for missed webhooks.

### 5. Frontend Integration (Revised)

Update frontend components:
*   `CheckoutButton`: Calls backend `/checkout/create-session` endpoint and redirects to Stripe.
*   `CustomerPortalButton`: Calls backend `/portal/create-session` endpoint and redirects to Stripe.
*   `PlanSelection`, `TokenPackagePurchase`: Display options and use `CheckoutButton`.
*   `UserDashboard`, Subscription Management UI: Display information fetched from the backend (which is kept in sync via webhooks) and include `CustomerPortalButton`. Handle user actions to trigger backend API calls for plan changes/cancellations.

### 6. Webhook Implementation (`WebhookController`)

*   **Central Component:** Implement handlers for all relevant events (`checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, etc.).
*   **Idempotency:** Crucial to check event IDs to prevent duplicate processing.
*   **Synchronization:** Update local database tables (`users`, `user_subscriptions`, `payments`) accurately based on event data.
*   **Trigger Actions:** Initiate token allocations upon successful payment confirmation (`invoice.paid`).

## Implementation Timeline

The estimated timeline of 11 days remains a reasonable starting point, but acknowledge that robust webhook handling might require significant testing and refinement.

*   **Phase 1: Setup and Configuration (2 days)**: Stripe account, products/prices, webhooks (endpoint setup), basic environment vars, DB schema migration script creation.
*   **Phase 2: Backend Implementation (5 days)**: Implement `StripeService`, revised API endpoints, critical `WebhookController` logic (handling key events like `checkout.session.completed`, `invoice.paid`, `customer.subscription.*`), update data access layer. Implement revised `SubscriptionRenewalsBatch`.
*   **Phase 3: Frontend Implementation (3 days)**: Implement `CheckoutButton`, `CustomerPortalButton`, integrate into existing plan/package selection flows. Update dashboard display.
*   **Phase 4: Testing and Deployment (2+ days)**: **Crucial focus on end-to-end testing**, especially webhook scenarios, subscription lifecycle events (renewals, changes, cancellations), and error handling. Deploy to staging, UAT, then production.

## Security Considerations

1.  **API Key Security**: Use environment variables; never expose secret keys client-side; rotate keys; use distinct keys per environment.
2.  **Webhook Security**: **Verify signatures** using `STRIPE_WEBHOOK_SECRET`; use HTTPS; ensure **idempotent handlers**; monitor for failures.
3.  **Data Protection**: Rely on Stripe Checkout/Portal to avoid handling raw card data; comply with PCI DSS; encrypt sensitive data.
4.  **Error Handling**: Implement robust error handling for Stripe API calls and webhook processing; log errors thoroughly; provide user feedback where appropriate.