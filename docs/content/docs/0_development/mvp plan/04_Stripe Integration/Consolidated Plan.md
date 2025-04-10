Consolidated Stripe Integration Plan from Gemini Chat https://aistudio.google.com/prompts/1dYmdVZ-XDSbC-CJKL9TI6odKBX_fOU4V?model=gemini-2.5-pro-exp-03-25&utm_source=deepmind.google&utm_medium=referral&utm_campaign=gdm&utm_content=

I. Overall Approach & Philosophy

Stripe Checkout & Customer Portal: Utilize Stripe's hosted Checkout for all user-facing payment collections (new subscriptions, token packages) and Stripe's Customer Portal for user self-service management of subscriptions and payment methods. This simplifies frontend development and minimizes PCI scope.

Stripe Subscriptions as Source of Truth: Leverage Stripe's subscription engine as the primary driver and source of truth for recurring billing cycles, payment attempts, retries, and subscription status (active, past_due, canceled).

Webhook-Driven Synchronization: Rely heavily on Stripe webhooks (invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted, checkout.session.completed, etc.) as the primary mechanism to update the local application database state in near real-time.

Update Existing Subscriptions: For plan changes (downgrades, frequency changes, cancellations to free tier), the primary mechanism should be updating the existing Stripe Subscription via API calls, triggered by user actions in your application. Avoid creating new local/Stripe subscriptions for simple modifications where possible.

Simplified Batch Processing: Significantly reduce reliance on custom batch jobs for core payment collection and retries. Repurpose or retain batches only for tasks Stripe doesn't handle or for specific application logic (like token allocation post-payment or optional reconciliation).

II. Data Model / Database Schema Updates

users Table:

Add stripe_customer_id (VARCHAR, Nullable, Indexed): Stores the corresponding Stripe Customer ID. Created before the first payment action for a user.

user_subscriptions Table: (Represents the local application subscription)

Add stripe_subscription_id (VARCHAR, Nullable, Indexed): Links to the active Stripe Subscription object.

Add stripe_price_id (VARCHAR): Stores the Stripe Price ID currently associated with this subscription.

Add stripe_status (VARCHAR): Mirrors the Stripe subscription status (e.g., active, past_due, canceled, incomplete, trialing). Updated via webhooks.

Add cancel_at_period_end (BOOLEAN): Mirrors the Stripe setting, indicating if cancellation is scheduled. Updated via webhooks or API response.

Add current_period_start (TIMESTAMP): Mirror the current billing period start date from Stripe. Updated via webhooks (invoice.paid, customer.subscription.updated).

Add current_period_end (TIMESTAMP): Mirror the current billing period end date from Stripe. Updated via webhooks (invoice.paid, customer.subscription.updated).

Keep plan_id (FK to plans): Links to your local plan definition.

Keep status: Your local application status (e.g., active, cancelled, pending_cancellation - though pending_cancellation might become less necessary if relying on Stripe's cancel_at_period_end).

Keep upcoming_plan_id (FK to plans): Still potentially useful if you need to process a local state change before the Stripe change takes effect (e.g., for UI display), but ideally the change is reflected after the customer.subscription.updated webhook confirms the Stripe change.

Keep ended_at (TIMESTAMP).

Keep canceled_at (TIMESTAMP).

Keep cancellation_reason.

payments Table: (Represents payment events)

Add stripe_payment_intent_id (VARCHAR, Nullable, Indexed): For one-off charges or the underlying intent of an invoice payment.

Add stripe_invoice_id (VARCHAR, Nullable, Indexed): Links to the Stripe Invoice, especially important for subscription renewals.

Add stripe_charge_id (VARCHAR, Nullable, Indexed): Links to the specific Stripe Charge object.

Add receipt_url (VARCHAR): URL to the Stripe-hosted receipt.

Add payment_method_details (JSONB): Stores details like card brand, last4 (obtained from Stripe event).

Remove/Re-evaluate: stripe_subscription_id, subscription_status, cancel_at_period_end (these belong on user_subscriptions).

Keep user_id, subscription_id (FK to user_subscriptions), package_id, amount, currency, status ('completed', 'failed'), payment_type.

Keep billing_period_start/end if they represent the period covered by this specific payment event.

plans Table:

Add stripe_product_id (VARCHAR): Links to the Stripe Product.

Add stripe_price_id (VARCHAR, Indexed): Links to the specific Stripe Price object (e.g., the monthly price for the 'Creator' plan). Crucial: Ensure you have separate Stripe Price IDs for monthly vs. yearly options, even if they belong to the same conceptual tier.

token_packages Table:

Add stripe_product_id (VARCHAR).

Add stripe_price_id (VARCHAR, Indexed).

III. Core Backend Logic

StripeService (utils/stripeService.js):

Acts as the sole interface to the Stripe SDK.

Methods:

createCustomer(email, name, metadata)

createCheckoutSession(customerId, lineItems, mode, successUrl, cancelUrl, metadata, ...) (Handles both subscription and one-time payment modes)

createCustomerPortalSession(customerId, returnUrl)

updateSubscription(stripeSubscriptionId, params) (Used for upgrades, downgrades, frequency changes)

cancelSubscription(stripeSubscriptionId, cancelAtPeriodEnd)

constructWebhookEvent(payload, signature) (Verifies signature)

Potentially methods to retrieve specific Stripe objects if needed (e.g., getSubscription, getInvoice).

Implement robust error handling for all Stripe API calls.

Use deterministic idempotency keys for mutating operations (createCustomer, updateSubscription, cancelSubscription).

Webhook Handler (controllers/webhookController.js):

Critical Component. Receives events from Stripe via POST /api/subscription/webhooks/stripe.

Must: Verify the webhook signature using StripeService.constructWebhookEvent.

Must: Be idempotent (e.g., check if event.id has already been processed before acting).

Key Event Handlers:

checkout.session.completed: Handle initial subscription creation or one-time token package purchase. Retrieve session details, create/update local user, user_subscriptions, payments records. Allocate tokens for packages. Note: For subscriptions, the customer.subscription.created event often follows closely and might be a better place to finalize local subscription record creation/activation.

invoice.paid: Crucial for renewals. Update local payments record (mark as 'completed', store stripe_invoice_id, receipt_url, etc.). Update the corresponding user_subscriptions record with the new current_period_start/end from the invoice/subscription data within the event. Trigger token allocation for the new period here (either directly or by signaling the SubscriptionRenewalsBatch).

invoice.payment_failed: Log the failure. Update local payments record to 'failed'. Potentially notify the user. Stripe handles retries based on your settings. Only take drastic action (like canceling local access) on final failure events.

customer.subscription.updated: Handle changes initiated via API or Customer Portal (plan changes, cancellations scheduled/unscheduled, status changes like past_due). Update the local user_subscriptions record accordingly (sync stripe_status, plan_id, stripe_price_id, cancel_at_period_end, billing dates).

customer.subscription.deleted: Handle subscriptions that are definitively canceled (either immediately or at period end). Update the local user_subscriptions record (e.g., change plan_id to free tier, set status to 'cancelled', set ended_at, clear Stripe IDs).

IV. API Endpoints (Revised)

NEW/Essential:

POST /api/subscription/checkout/create-session: Body includes { type: 'subscription' | 'token_package', priceId: 'price_...' }. Calls StripeService.createCheckoutSession. Returns { sessionId: 'cs_...', url: 'https://checkout.stripe...' }. Handles initial subscription creation and token package purchases.

POST /api/subscription/portal/create-session: Body includes { returnUrl: '...' }. Calls StripeService.createCustomerPortalSession. Returns { url: 'https://billing.stripe...' }.

POST /api/subscription/webhooks/stripe: Receives webhook events. No auth needed (signature verification). Calls WebhookController.

REVISED PURPOSE (Manage Local State & Trigger Stripe Actions):

POST /api/subscription/subscriptions: Handles creating the initial local free tier subscription on user signup. Maybe handles triggering an upgrade flow by calling createCheckoutSession? Clarify if this endpoint initiates paid plans or if that's solely via the checkout/create-session endpoint after plan selection.

PUT /api/subscription/subscriptions/:subscriptionId: Handles requests to change a plan (upgrade, downgrade, frequency change). Backend logic here should:

Determine the change type (upgrade/downgrade/frequency).

Call the appropriate StripeService method (updateSubscription).

Optionally update local state immediately (e.g., set upcoming_plan_id) for faster UI feedback, or wait for the customer.subscription.updated webhook to confirm and update the local state. Waiting for the webhook is safer for consistency.

POST /api/subscription/subscriptions/:subscriptionId/cancel: Handles requests to cancel a subscription. Backend logic here should:

Call StripeService.cancelSubscription (likely with cancel_at_period_end=true).

Update local state based on API response or wait for the customer.subscription.updated webhook.

EXISTING (Largely Unchanged Purpose):

Plan listing (GET /plans), Token Package listing (GET /token-packages), Balance check (GET /tokens/balance/:userId), History (GET /payments/user/:userId, GET /transactions/user/:userId).

REMOVED/REDUNDANT:

Endpoints specifically for confirming/canceling payments (/confirm, /cancel).

Endpoints for adding payment methods (/customers/payment-methods) - handled by Checkout/Portal.

Internal batch job endpoints like /collect, /retry if those jobs are removed/repurposed.

V. Batch Job Strategy (Revised)

ProcessPendingCancellationsBatch:

Reduced Importance/Potentially Eliminate: If subscription changes (downgrades, cancellations) are handled by calling the Stripe API immediately when the user requests them, and the local state is updated via the resulting webhooks, this batch job's primary purpose (acting on pending_cancellation status at period end) becomes redundant. Stripe handles the "at period end" logic.

CreatePaymentsBatch:

Eliminate. Create local payments records based on invoice.paid webhook.

CollectPaymentsBatch:

Eliminate core collection logic.

Optional: Repurpose as a daily Reconciliation Batch to compare local subscription statuses/periods against Stripe API data and flag discrepancies. Lower priority.

RetryFailedPaymentsBatch:

Eliminate. Configure Stripe Smart Retries. Handle final failure webhooks (invoice.payment_failed after retries, customer.subscription.updated to past_due or canceled, customer.subscription.deleted).

SubscriptionRenewalsBatch:

Keep, but Refine Trigger/Scope. Focus solely on local application logic needed upon successful renewal (primarily token allocation).

Trigger: This batch should process subscriptions where a successful renewal payment (invoice.paid webhook) has just occurred for the relevant period. It should not run based purely on its own date checks decoupled from payment status. It could query for subscriptions needing token allocation based on the current_period_start date that was updated by the invoice.paid webhook handler.

Action: Allocate tokens for the newly paid-for period.

VI. Frontend Components

CheckoutButton: Initiates backend call to /checkout/create-session and redirects to the received Stripe URL.

CustomerPortalButton: Initiates backend call to /portal/create-session and redirects to the received Stripe URL.

PlanSelection, TokenPackagePurchase: Display options, trigger CheckoutButton.

SubscriptionManagement, UserDashboard: Display status based on data fetched from your backend (which is kept in sync by webhooks). Include the CustomerPortalButton.

VII. Key Flows (Simplified View)

New Paid Subscription: User selects Plan -> Frontend calls POST /checkout/create-session -> Backend calls Stripe -> Frontend redirects User to Stripe Checkout -> User pays -> Stripe sends checkout.session.completed & customer.subscription.created & invoice.paid webhooks -> Backend Webhook Handler updates local DB (users, user_subscriptions, payments), allocates initial tokens -> User redirected back to success URL.

Token Package Purchase: Similar to above, but uses mode: 'payment' in Checkout and allocates tokens upon checkout.session.completed.

Subscription Renewal: Stripe automatically attempts payment -> Stripe sends invoice.paid webhook -> Backend Webhook Handler updates local payments & user_subscriptions (updates billing dates) -> Handler (or triggered Batch) allocates tokens.

Subscription Change (e.g., Downgrade): User selects new plan -> Frontend calls PUT /subscriptions/:id -> Backend calls StripeService.updateSubscription -> Stripe sends customer.subscription.updated webhook -> Backend Webhook Handler updates local user_subscriptions. (Stripe handles the billing change at the appropriate time).

Subscription Cancel: User clicks cancel -> Frontend calls POST /subscriptions/:id/cancel -> Backend calls StripeService.cancelSubscription(..., true) -> Stripe sends customer.subscription.updated (with cancel_at_period_end=true) -> Handler updates local record -> At period end, Stripe sends customer.subscription.deleted -> Handler updates local record (sets to free tier, etc.).

Manage Payment Methods: User clicks Manage -> Frontend calls POST /portal/create-session -> Backend calls Stripe -> Frontend redirects User to Customer Portal -> User updates card -> Stripe handles updates internally (no specific webhook usually needed just for card change unless it affects an immediate payment).

VIII. Security & Testing

Reiterate points from previous plans: API key security, webhook signature verification, PCI compliance via Checkout/Portal, data protection.

Testing remains crucial, especially focusing on webhook handling, subscription state transitions, and edge cases (failed payments, cancellations).