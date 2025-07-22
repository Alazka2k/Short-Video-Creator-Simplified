# Detailed Plan: Finalization of Stripe and Subscription Integration

## 1. Overview

This document outlines the final integration of the stripe and subscription integration to have an e2e working system for buying subscriptions / loading up tokens, logic for payment for different plans (yearly and monthly payments) and token alignment for each month with a paid plan, also correctly reducing the tokens of a user for a job and depending on what the user requires.

Loading up tokens with one-time payment as pay-as-you-go. Of course, also canceling a subscription needs to be working. Each service or job (summarize) run also has a cost that needs to be deducted. A lot of the backend implementation is already available in the subscription service but needs to be finalized and adapted after changing the auth flow completely. Frontend is not yet implemented.

**The Core Requirement:** 
- Update the Stripe integration with the new auth flow.
- Review all current implementation regarding subscription with the integration of payment and token loading.
- Subscribe to a paid plan and load up tokens with a one-time payment as pay-as-you-go with direct payment from the user.
- Review the token deduction and implementation for each service. Each service or job run also has a cost that needs to be deducted.
- Implement a pricing page for the user to see the current plan, buttons for changing the plan and canceling the subscription, token usage with the possibility to purchase more tokens and usage history.
- Implement a subscription management page for the user to manage their subscription and token usage after login (inside the protected pages)
- Implement a new general dashboard page in the protected pages, where the user is forwarded after login.
- Review and rework the current implementation of the batch integration for all further logic after the initial subscription (renewal, cancellation) and if or what is still required. 

**The Solution:** This plan will address these requirements by breaking down the finalization into five distinct phases: Backend Core Refinement, Frontend Implementation, Batch Job Enhancement, Business Logic Finalization, and finally, Testing & Deployment.

---

## 2. Success Criteria
- Users can successfully subscribe to different plans (monthly/yearly) via a Stripe Checkout flow.
- Users can purchase one-time token packages.
- The system correctly allocates tokens upon subscription and renewal.
- The system accurately deducts tokens based on service usage (e.g., video generation).
- Users can manage their subscription (change plan, cancel) through a customer portal.
- All backend services are decoupled from the old authentication system.
- Webhook handling is idempotent and robust.
- The user has a clear dashboard to view their subscription status, token balance, and billing history. The user has a clear dashboard for the general overview of the app after login. A subscription and token load up page is available for the user to buy a subscription and load up tokens with a one-time payment.

---

## Phase 1: Backend Core Refinement & Auth Integration ✅ Completed
**Objective:** Solidify the backend foundation by integrating the new authentication flow, ensuring robust webhook processing, and adapting existing data endpoints for the frontend.

### Task 1.1: Secure and Adapt Existing Endpoints with New Auth Flow ✅ Completed
- **Services:** `subscription-service`, `api-gateway`
- **Files Modified:** `subscription-service/controllers/checkoutController.js`, `subscription-service/controllers/paymentController.js`, `api-gateway/routes/subscription.js`
- **File Created:** `subscription-service/data/userDataAccess.js`
- **Action:** Refactored the authentication and user data retrieval logic to be secure and self-contained within the subscription service.
  - **Logic:**
    1.  **Create `userDataAccess.js`:** A new data access file was created within the `subscription-service` to handle all interactions with the `users` table, decoupling the service from the `auth-service`'s data layer.
    2.  **Refactor `checkoutController.js`:** The controller was updated to use the new `userDataAccess`. The `userId` is now securely retrieved from the JWT token (`req.user.userId`) instead of the request body.
    3.  **Secure Public Endpoints:** The API Gateway routes for fetching user-specific data were changed from insecure `/.../user/:userId` paths to secure `/.../me` paths (e.g., `GET /api/subscription/subscriptions/me`).
    4.  **Enhance Payments Endpoint:** Pagination (`limit` and `offset` query parameters) was added to the `/api/subscription/payments/me` endpoint to support a better user experience in the frontend.

### Task 1.2: Implement Webhook Idempotency & Fix Signature Verification ✅ Completed
- **Services:** `subscription-service`, `api-gateway`
- **Files to Modify:** `subscription-service/controllers/webhookController.js`, `subscription-service/services/paymentService.js`, `subscription-service/routes/webhookRoutes.js`, `api-gateway/server.js`, `subscription-service/utils/stripeService.js`, `subscription-service/index.js`, `subscription-service/data/paymentsDataAccess.js`
- **Files to Create:** `subscription-service/data/webhookEventsDataAccess.js`, `api-gateway/routes/webhook.js`
- **Action:** Refactored the entire webhook handling pipeline to ensure Stripe's signature could be verified correctly and to prevent duplicate event processing. This involved multiple rounds of debugging to fix the signature verification error, ultimately requiring a switch to Node.js's native `http` module for request forwarding.
- **Logic:**
    1.  **Create Dedicated Gateway Route (`api-gateway/routes/webhook.js`):** Create a new, specialized route file in the API Gateway to handle all incoming webhooks. This route is responsible for forwarding the **raw, unparsed request body** to the `subscription-service` to preserve the signature.
    2.  **Apply Raw Body Parser (`subscription-service`):** Modify the `webhookRoutes.js` in the `subscription-service` to use `express.raw({ type: 'application/json' })`. This ensures the controller receives the body as a buffer, which is required for signature verification.
    3.  **Create `webhookEventsDataAccess.js`:** Create a new data access file with methods to `findEventById`, `logEvent`, and `updateEvent` in the `webhook_events` table.
    4.  **Refactor `webhookController.js`:**
        *   Modify the controller to use the new `webhookEventsDataAccess`. It will now correctly receive the raw request body.
        *   It will construct the Stripe event using the raw body and signature.
        *   It will check if the event ID already exists and is marked as processed. If so, it will return `200 OK` immediately.
        *   If the event is new, it will log it to the database before processing.
    5.  **Refactor `paymentService.js`:**
        *   The `processWebhookEvent` method will continue to accept the verified `event` object and focus solely on the business logic.
- **Fix (Signature Verification):**
    1.  **Problem:** The `StripeSignatureVerificationError` was caused by the `StripeService` class not being initialized before its `constructEvent` method was called during a webhook request. The `webhookSecret` was never loaded.
    2.  **Solution:**
        *   **Refactor `stripeService.js`:** Converted the `StripeService` class into a self-initializing singleton. It now exports a single, ready-to-use instance with the `initialize()` method called in its constructor. This guarantees the Stripe SDK and webhook secret are loaded on application start.
        *   **Refactor `webhookController.js` & `index.js`:** Modified the `WebhookController` to receive the `StripeService` as an injected dependency (Dependency Injection pattern) rather than requiring the module directly. The main `index.js` for the service was updated to pass the `stripeService` singleton into the controller's constructor.
- **Fix (Signature Verification - Round 2):**
    1.  **Problem:** Despite the previous fix, the signature error persisted. Log analysis showed two new problems:
        *   The subscription service was applying the `express.raw()` middleware twice (in `server.js` and `webhookRoutes.js`), corrupting the request stream.
        *   The API Gateway's `axios` call was likely converting the raw request buffer to a string before forwarding.
    2.  **Solution:**
        *   **Correct Middleware:** Removed the redundant `express.raw()` call from `subscription-service/server.js`, leaving the correctly placed middleware in `webhookRoutes.js`.
        *   **Harden Forwarding:** Added a `Content-Length` header to the `axios` call in `api-gateway/routes/webhook.js` to ensure the forwarded request body is treated as a raw buffer, preventing it from being stringified.
- **Fix (Signature Verification - Round 3 / Final):**
    1.  **Problem:** The `axios` library in the API Gateway continued to stringify the request body, causing signature verification to fail.
    2.  **Solution:** Replaced the `axios`-based forwarding logic in `api-gateway/routes/webhook.js` entirely. The new implementation uses Node.js's native `http` module to create a proxy request. The incoming raw request body is now **piped** directly to the subscription service, guaranteeing the body is forwarded as an unaltered stream of bytes, which is the most robust solution for this problem.

---

## Phase 2: Frontend Implementation & UI/UX Refactor **STATUS: Not Started**
**Objective:** Build a clear, intuitive, and fully functional user interface for the pricing page, dashboard and subscription management, following the provided design guidelines.

### Task 2.1: Create `PricingPageComponent`  and page `pricing/page.tsx`
- **Location:** `frontend/src/components/marketing/pricing/`
- **Action:** Develop a reusable component that fetches data from our database or from stripe. Endpoints to get the data from application database is `/api/subscription/plans` and `/api/subscription/token-packages`. Is it best practice to fetch the data from stripe or from the application database? In the database table plans we have connected the plans to a stripe price id. Same for token packages in table token_packages. Open question is also how we differentiate the behaviour of the page and componentsbetween logged in user and only interested customer / visistor. Render all tiers (also free tier.)
Page should render the subscription tiers and one-time purchase options, each with a `StripeCheckoutButton`. Additionally also what each plan includes and what the price is.

### Task 2.2: Redesign and Implement ProtectedUser Dashboard (`/dashboard`)
- **File:** `frontend/src/app/(dashboard)/dashboard/page.tsx`
- **Action:** Overhaul the main dashboard page to serve as a central hub.
    - **Layout:** Feature quick-action cards to start content creation funnels.
    - **Subscription Overview:** Include a *summary* version of the refactored `TokenUsageDetails.tsx` component that displays the current token balance and a link to the full subscription management page.

### Task 2.3: Implement ProtectedSubscription Management Page (`/subscription`)
- **File:** `frontend/src/app/(dashboard)/subscription/page.tsx`, `frontend/src/components/billing/token-usage.tsx`
- **Action:** Create the detailed subscription management experience. Review, rename and revamp already existing token-usage.tsx component to TokenUsageDetails.tsx for better clarity and consistency. Refactor the component to accept props, allowing it to be used in both a "summary" view (for the dashboard) and a "detailed" view (for the subscription page). It will be responsible for fetching its own data from the backend.
    - **Data Source:** This page will rely on the secured `GET /api/subscription/status` and `GET /api/subscription/billing-history` endpoints.
    - **Components:**
        *   Display the full, detailed `TokenUsageDetails.tsx` card with a breakdown of plan vs. purchased tokens.
        *   Show a "Current Plan" card with renewal information.
        *   Integrate a "Manage Billing" button (`CustomerPortalButton`) that links to the Stripe Customer Portal.
        *   Include a "Billing History" section that lists past payments.

### Task 2.4: Finalize Payment Flow Pages
- **Files:** `frontend/src/app/subscription/success/page.tsx` and `frontend/src/app/subscription/cancel/page.tsx`.
- **Action:** Review and update these pages to ensure they provide clear user feedback after returning from a Stripe Checkout session.

---

## Phase 3: Batch Job Enhancement & Finalization **STATUS: Not Started**
**Objective:** Refactor the existing batch jobs to align with the Stripe-centric, event-driven payment model.

### Task 3.1: Deprecate/Simplify Payment Initiation Batches
- **Action:** Since Stripe now handles recurring billing, `CreatePaymentsBatch` and `CollectPaymentsBatch` will be either removed or repurposed into a simple reconciliation batch job to ensure data consistency between Stripe and the local DB.

### Task 3.2: Refactor `SubscriptionRenewalsBatch` & `ProcessPendingCancellationsBatch`
- **Action:** Adapt these jobs to be triggered by webhook events or to run on a schedule to process state changes. The `SubscriptionRenewalsBatch` logic (token allocation) will now be called by the `invoice.payment_succeeded` webhook handler. The `ProcessPendingCancellationsBatch` will run periodically to finalize downgrades and cancellations for subscriptions that have reached the end of their billing period.

---

## Phase 4: Business Logic Finalization (Post-Stripe E2E) **STATUS: Not Started**
**Objective:** Implement the token deduction and plan limitation logic now that the core subscription flow is complete.

### Task 4.1: Integrate Token Deduction
- **Action:** Modify the `job-service` processors (`scene-processor`, `music-processor`, etc.) to call the existing `POST /api/subscription/tokens/usage` endpoint *before* executing a token-consuming task. The job will fail gracefully if the user has an insufficient balance.

### Task 4.2: Enforce Plan Limitations
- **Action:** Before starting a job, the `job-pipeline-service` will call a new endpoint (e.g., `GET /api/subscription/limitations/usage` as described in your docs) to check usage against plan limits (e.g., `max_jobs_per_month`). The job will be rejected if limits are exceeded.

---

## Phase 5: Final Testing & Deployment **STATUS: Not Started**
**Objective:** Ensure the entire system is robust, secure, and ready for production.

### Task 5.1: Comprehensive E2E Testing
- **Action:** Perform end-to-end testing of all user flows in a staging environment connected to Stripe's test mode.

### Task 5.2: Production Deployment
- **Action:** Execute the production deployment, ensuring all environment variables, API keys, and webhook endpoints are correctly configured for the live environment.

### Task 5.3: Monitoring & Alerting
- **Action:** Set up monitoring and alerts for key metrics like webhook success rates and payment failures.