# Stripe Integration Architecture

## Integration Architecture (Revised)

Our Stripe integration architecture leverages Stripe's hosted solutions (Checkout, Customer Portal) and automated subscription engine, minimizing custom logic for payment collection and retries. Synchronization is primarily driven by Stripe Webhooks.

### 1. Frontend Integration

1.  **Stripe Checkout Initiation**:
    *   Uses Stripe Checkout for capturing payment details for new subscriptions and one-time token package purchases.
    *   `CheckoutButton` component triggers a backend API call (`/checkout/create-session`) to get a Stripe Checkout session URL.
    *   Redirects the user to the Stripe-hosted Checkout page.
    *   Handles redirection back to the application's success/cancel URLs.
2.  **Stripe Customer Portal Initiation**:
    *   Uses Stripe Customer Portal for user self-management of existing subscriptions (payment methods, cancellations, viewing invoices).
    *   `CustomerPortalButton` component triggers a backend API call (`/portal/create-session`) to get a Stripe Customer Portal session URL.
    *   Redirects the user to the Stripe-hosted Customer Portal.
3.  **UI Components**:
    *   `PlanSelection` & `TokenPackagePurchase`: Display product offerings and integrate `CheckoutButton`.
    *   `UserDashboard` & `SubscriptionManagement`: Display current subscription status and token balance (data sourced from backend, synchronized via webhooks). Integrate `CustomerPortalButton`.

### 2. Backend Integration

1.  **`StripeService` (`utils/stripeService.js`)**:
    *   Encapsulates all direct Stripe SDK interactions.
    *   Responsibilities: Creating Stripe Customers, creating Checkout Sessions, creating Customer Portal Sessions, updating/cancelling Stripe Subscriptions via API, verifying webhook signatures.
    *   Implements **deterministic idempotency keys** for mutating API calls.
2.  **Controllers (`SubscriptionController`, `PaymentController`, `TokenPackageController`)**:
    *   Handle API requests from the frontend.
    *   `SubscriptionController`: Handles requests to change/cancel plans, calling `StripeService` to update/cancel the corresponding Stripe Subscription. Manages initial free tier creation locally.
    *   `PaymentController`/`TokenPackageController`: Handle requests to initiate Checkout sessions via `StripeService`.
3.  **`WebhookController`**:
    *   **Central synchronization point.** Receives verified events from Stripe via `/webhooks/stripe` endpoint.
    *   Verifies webhook signatures using `StripeService`.
    *   **Must be idempotent** (e.g., check Stripe Event ID).
    *   Processes key events (e.g., `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`).
    *   Triggers updates to the local database (via Data Access Layer) and initiates application-specific logic (like token allocation).
4.  **Data Access Layer**:
    *   Handles reads/writes to local database tables (`users`, `user_subscriptions`, `payments`, `plans`, `token_packages`, `tokens`, `token_transactions`).
    *   Stores/retrieves Stripe IDs (`stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `stripe_invoice_id`, etc.) in the appropriate tables.
    *   Updates local subscription status, billing periods (`user_subscriptions`), and payment records (`payments`) based on data received from webhook handlers.
5.  **Database Schema**:
    *   Includes specific columns for Stripe IDs on relevant tables.
    *   `user_subscriptions` table stores mirrored Stripe subscription state (`stripe_status`, `stripe_price_id`, `cancel_at_period_end`, `current_period_start`/`end`).
    *   `payments` table records payment *events* linked via `stripe_invoice_id` or `stripe_payment_intent_id`.

### 3. Batch Processing (Revised Roles)

1.  **`SubscriptionRenewalsBatch` (Token Allocation)**:
    *   **Primary Role**: Allocates tokens based on the user's active plan.
    *   **Trigger**: Runs periodically but acts based on successful renewals confirmed by `invoice.paid` webhooks (e.g., processes subscriptions whose token allocation period corresponds to the just-paid-for billing period). Does *not* manage billing cycles or initiate payments.
2.  **Eliminated/Repurposed Batches**:
    *   Payment creation (`CreatePaymentsBatch`), collection (`CollectPaymentsBatch`), and retry (`RetryFailedPaymentsBatch`) logic is handled by Stripe's automated subscription engine and webhook events.
    *   Pending cancellation processing (`ProcessPendingCancellationsBatch`) is largely replaced by direct Stripe API calls for cancellations/updates triggered by user actions and subsequent webhook handling.
3.  **Optional Batch**:
    *   `ReconciliationBatch`: Could be implemented later to periodically compare local DB state against Stripe API data to catch any synchronization discrepancies (lower priority).

## Component Interactions (Revised Flows)

### Checkout Flow (New Subscription / Token Package)

1.  User selects plan/package in Frontend.
2.  Frontend calls Backend (`POST /checkout/create-session`).
3.  Backend (`StripeService`) creates Stripe Checkout Session.
4.  Backend returns session URL to Frontend.
5.  Frontend redirects User to Stripe Checkout.
6.  User completes payment on Stripe's page.
7.  Stripe sends `checkout.session.completed` webhook (and others like `invoice.paid`, `customer.subscription.created` if applicable) to Backend (`/webhooks/stripe`).
8.  Backend (`WebhookController`) verifies signature, processes event(s), updates local DB (creates `payments`, updates `user_subscriptions`, allocates tokens for packages).
9.  Stripe redirects User back to application's `successUrl`. Frontend displays success.

### Subscription Management Flow (via Customer Portal)

1.  User clicks "Manage Subscription" (`CustomerPortalButton`) in Frontend.
2.  Frontend calls Backend (`POST /portal/create-session`).
3.  Backend (`StripeService`) creates Stripe Customer Portal Session.
4.  Backend returns portal URL to Frontend.
5.  Frontend redirects User to Stripe Customer Portal.
6.  User updates payment methods, cancels subscription, views invoices, etc.
7.  Stripe sends relevant webhooks (e.g., `customer.subscription.updated`, `customer.subscription.deleted`) for *any changes made* to Backend (`/webhooks/stripe`).
8.  Backend (`WebhookController`) verifies signature, processes event, updates local `user_subscriptions` table to reflect the changes.
9.  User clicks "Return to App" link in Portal (configured in Stripe settings). Frontend UI should reflect updated state (may require refresh or polling if webhook processing isn't instant).

### Subscription Change Flow (via Application UI - e.g., Downgrade)

1.  User selects a new plan in Frontend UI.
2.  Frontend calls Backend (`PUT /subscriptions/:subscriptionId`).
3.  Backend (`SubscriptionController`) validates request and calls `StripeService.updateSubscription` with the new `priceId` and appropriate parameters (e.g., `proration_behavior='none'`).
4.  Stripe updates the subscription (potentially scheduled for the period end).
5.  Stripe sends `customer.subscription.updated` webhook to Backend (`/webhooks/stripe`).
6.  Backend (`WebhookController`) verifies signature, processes event, updates the existing local `user_subscriptions` record with new `plan_id`, `stripe_price_id`, etc.
7.  Frontend UI reflects the change (either optimistically or after confirmation).

### Subscription Renewal Flow

1.  Stripe's subscription engine automatically creates an invoice and attempts payment before the current period ends.
2.  **If Payment Succeeds:**
    *   Stripe sends `invoice.paid` webhook to Backend (`/webhooks/stripe`).
    *   Backend (`WebhookController`) verifies, processes event:
        *   Creates/updates local `payments` record (status 'completed').
        *   Updates local `user_subscriptions` with new `current_period_start`/`end`.
        *   Triggers logic (e.g., via `SubscriptionRenewalsBatch`) to allocate tokens for the new period.
3.  **If Payment Fails:**
    *   Stripe sends `invoice.payment_failed` webhook.
    *   Backend (`WebhookController`) logs failure, potentially updates local payment status.
    *   Stripe automatically retries based on **Smart Retry settings**.
    *   If retries fail permanently, Stripe sends `customer.subscription.updated` (status `past_due` or `canceled`) or `customer.subscription.deleted`.
    *   Backend (`WebhookController`) processes final failure event, updates local `user_subscriptions` status, potentially downgrades user to free tier locally.

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Customer Portal Documentation](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Subscriptions Overview](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Idempotency Keys](https://stripe.com/docs/api/idempotent_requests)
- [Stripe Security Best Practices](https://stripe.com/docs/security)