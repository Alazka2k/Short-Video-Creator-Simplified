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

## Phase 2: Frontend Implementation & UI/UX Refactor **STATUS: In Progress**
**Objective:** Build a clear, intuitive, and fully functional user interface for the pricing page, dashboard and subscription management, following the provided design guidelines.

### Task 2.1: Create `PricingPageComponent` and page `pricing/page.tsx` **STATUS: Testing**
- **Files to Create:** `frontend/src/app/(marketing)/pricing/page.tsx`, `frontend/src/components/marketing/pricing/`
- **Files to Review and Modify if necesseray :** `frontend/src/components/shared/buttons/`, `frontend/src/components/shared/label/`, `frontend/src/components/shared/switch/`
- **Action:** Develop a dynamic and responsive pricing page that caters to both visitors and authenticated users, ensuring a consistent look and feel with the existing UI.
- **Logic:**
    - **Authentication Strategy Clarification:**
        - **`jwtAuth` (User Authentication):** Used for endpoints accessed by the frontend after a user logs in (e.g., `/subscriptions/me`, `/transactions/calculate-job-cost`). It verifies the user's JWT.
        - **`serviceAuth` (Service-to-Service Authentication):** Used for internal endpoints called only by other backend services (e.g., `/tokens/usage`). It verifies a shared secret token.
        - **Public Endpoints:** Endpoints needed for the public-facing website (e.g., `/plans`, `/token-packages`, `/transactions/token-costs`) must not have authentication middleware.
    - **Data Source Strategy:**
        - The page will fetch all plan and token package information (including price amounts) from the application's backend via the `/api/subscription/plans` and `/api/subscription/token-packages` endpoints. The database remains the source of truth for offered products.
    - **User Flow Strategy:**
        - **Unauthenticated Visitors:** Call-to-action buttons will be `<Link>` components that redirect to the `/signup` page, passing the selected plan as a query parameter.
        - **Authenticated Users:** Call-to-action buttons will be functional `<StripeCheckoutButton>` components that initiate the Stripe Checkout flow immediately. The user's current plan will be visually highlighted.
        - **Free Tier Users:** Will be able to purchase one-time token packages.
- **Implementation Steps:**
    1.  **Fix Prerequisite Bugs:** Correct the middleware on the following API Gateway routes in `subscription.js`:
        -   `/api/subscription/token-packages` (all): Remove `serviceAuth` to make public.
        -   `/api/subscription/transactions/token-costs`: Remove `serviceAuth` to make public.
        -   `/api/subscription/transactions/calculate-job-cost`: Change `serviceAuth` to `jwtAuth({ requireUser: true })`.
    2.  **Create `StripeCheckoutButton.tsx`:** Develop a new reusable button component at `frontend/src/components/shared/buttons/`. This component will encapsulate the logic for calling the backend to create a Stripe session and redirecting the user.
    3.  **Create `PricingComponent.tsx`:** Build the main client component at `frontend/src/components/marketing/pricing/` that receives plan data via props. It will manage the monthly/annual toggle and render the four subscription tiers and four token packages, adapting its CTA buttons based on the user's authentication state.
    4.  **Create Pricing Page:** Implement the server component at `frontend/src/app/(marketing)/pricing/page.tsx`. It will fetch the necessary data (active plans only) and pass it to the `PricingComponent`.
  - **Fix (Round 1):**
    1.  **Problem:** The initial UI had several UX issues: an imbalanced layout for the yearly view, generic copywriting, and lack of visual hierarchy for features.
    2.  **Solution:**
        -   **Update Database Seeds:** The `03_update_plans.js` and `04_token_packages.js` seed files will be updated with new, benefit-driven marketing copy. The `marketing_description` JSON will be enhanced to include flags for highlighting key features and identifying the "Most Popular" plan.
        -   **Refactor `PricingComponent.tsx`:** The component will be refactored to consume the new data structure. It will always display the Free tier to maintain a balanced layout, dynamically highlight features based on the database flag, and ensure all cards have a consistent height and interactive hover effects.
  - **Fix (Round 2):**
    1.  **Problem (Frontend):** After a successful Stripe Checkout, the user was redirected to the success URL, but the frontend application crashed with a `500 Internal Server Error`. The console showed an error: `You cannot have two parallel pages that resolve to the same path. Please check /(dashboard)/subscription/success/page and /subscription/success/page.` This was caused by two page files (`frontend/src/app/(dashboard)/subscription/success/page.tsx` and `frontend/src/app/subscription/success/page.tsx`) trying to serve the same URL.
    2.  **Solution (Frontend):** The redundant, non-grouped page files (`/app/subscription/success/page.tsx` and `/app/subscription/cancel/page.tsx`) were deleted to resolve the routing conflict.
    3.  **Problem (Backend):** After a successful payment, the `subscription-service` logs showed multiple `TypeError` messages, such as `this.dataAccess.subscriptions.createOrUpdateSubscription is not a function`. This indicated that the `paymentService` was trying to call non-existent functions in the `subscriptionsDataAccess` layer when processing webhooks from Stripe.
    4.  **Solution (Backend):** The `paymentService.js` file will be refactored. The incorrect function calls (`createOrUpdateSubscription`, `updateSubscriptionStripeData`) will be replaced with the correct function names available in `subscriptionsDataAccess.js`. This will involve identifying the correct data access methods for creating a new subscription record and for updating it with Stripe-specific metadata.
  - **Fix (Round 3):**
    1.  **Problem (Backend Architecture):** The `paymentService` was incorrectly handling subscription business logic, leading to tight coupling and errors (`...is not a function`). It was violating the Single Responsibility Principle by acting as a payment processor *and* a subscription lifecycle manager. This tight coupling was the root cause of recent bugs, as any change to subscription data access logic required fragile changes in the payment service, making the system difficult to test and maintain.
    2.  **Solution (Backend Architecture):** The webhook handling will be refactored to respect service boundaries, creating a clean separation of concerns.
        - **`paymentService` (Role: Webhook Router & Payment Ledger):** This service will be simplified. Its sole responsibilities are to receive verified webhooks, route them based on event type, and manage the creation/updating of records in the `payments` table. It will no longer contain subscription business logic.
        - **`subscriptionService` (Role: Subscription & Token Authority):** This service becomes the single source of truth for all subscription business logic. It will expose high-level methods (e.g., `createSubscription`, `handleUpgrade`, `scheduleDowngrade`) that encapsulate the complex logic from our documentation. It will be the only service to interact with `subscriptionsDataAccess` and for token allocations in `tokenTransactionsDataAccess`.
        - **Implementation:** This will be achieved via **Dependency Injection**. An instance of `SubscriptionService` will be passed into the `PaymentService` constructor, allowing `paymentService` to delegate all subscription-related tasks.
    3.  **Problem (Frontend API):** The success page failed with a `404 Not Found` and a JSON parsing error because it made a `GET` request to `/api/subscription/checkout/verify-session/:sessionId`. A `GET` request cannot contain a request body, but the backend controller was incorrectly written to expect one, making the verification impossible as designed.
    4.  **Solution (Frontend API):** The API will be corrected to follow web standards.
        - **The Change:** The endpoint will be converted to `POST /api/subscription/checkout/verify-session`.
        - **Why `POST`?** The `POST` method is the correct verb for submitting data (the `sessionId`) to a resource for processing and verification.
        - **The Flow:**
            1. **Frontend (`success/page.tsx`):** The `fetch` call will be changed to `POST` and will send a JSON body containing the `sessionId`.
            2. **API Gateway (`subscription.js`):** The route will be changed from `router.get(...)` to `router.post(...)`.
            3. **Subscription Service (`checkoutController.js`):** The controller will now correctly receive the `sessionId` in the request body, allowing for secure verification against the `userId` from the JWT.
    5.  **Problem (Frontend UI):** The success page has a visual bug where the main sidebar is cut off.
    6.  **Solution (Frontend UI):** After the functional issues are resolved, the CSS for the main layout and the success page will be inspected and corrected to fix the visual layout bug.
  - **Fix (Round 4):**
    1.  **Problem (Success Page UX & Security):** The `/subscription/success` page was generic, displaying incorrect information (e.g., "subscription active" for a one-time token purchase). Furthermore, the API endpoint (`/verify-session`) was returning the entire raw Stripe session object, exposing more data than necessary to the frontend.
    2.  **Solution (Intelligent Success Page):** The success flow will be made context-aware and more secure.
        - **Backend (`checkoutController.js`):** The `verifyCheckoutSession` method will be refactored into a "Backend for Frontend" (BFF). It will still retrieve the full session from Stripe but will then transform it into a curated, minimal `purchaseDetails` object. This object will contain a `type` (`TOKEN_PACKAGE_PURCHASE`, `NEW_SUBSCRIPTION`, `SUBSCRIPTION_UPGRADE`) and only the necessary formatted data for display.
        - **Frontend (`success/page.tsx`):** The success page will be overhauled to receive the new `purchaseDetails` object. It will use the `type` to display a highly specific, context-aware confirmation message and summary, significantly improving the user experience and security.

### Task 2.2: Redesign and Implement ProtectedUser Dashboard (`/dashboard`) **STATUS: Not Started**
- **File:** `frontend/src/app/(dashboard)/dashboard/page.tsx`
- **Action:** Overhaul the main dashboard page to serve as a central hub.
    - **Layout:** Feature quick-action cards to start content creation funnels.
    - **Subscription Overview:** Include a *summary* version of the refactored `TokenUsageDetails.tsx` component that displays the current token balance and a link to the full subscription management page.

### Task 2.3: Implement ProtectedSubscription Management Page (`/subscription`) **STATUS: Not Started**
- **File:** `frontend/src/app/(dashboard)/subscription/page.tsx`, `frontend/src/components/billing/token-usage.tsx`
- **Action:** Create the detailed subscription management experience. Review, rename and revamp already existing token-usage.tsx component to TokenUsageDetails.tsx for better clarity and consistency. Refactor the component to accept props, allowing it to be used in both a "summary" view (for the dashboard) and a "detailed" view (for the subscription page). It will be responsible for fetching its own data from the backend.
    - **Data Source:** This page will rely on the secured `GET /api/subscription/status` and `GET /api/subscription/billing-history` endpoints.
    - **Components:**
        *   Display the full, detailed `TokenUsageDetails.tsx` card with a breakdown of plan vs. purchased tokens.
        *   Show a "Current Plan" card with renewal information.
        *   Integrate a "Manage Billing" button (`CustomerPortalButton`) that links to the Stripe Customer Portal.
        *   Include a "Billing History" section that lists past payments.
- **Sub-Task 2.3.2: Create Subscription Status Page for Portal Actions**
  - **File:** `frontend/src/app/(dashboard)/subscription/status/page.tsx`
  - **Action:** Create a new page to serve as the return URL for actions taken in the Stripe Customer Portal (e.g., downgrades, cancellations). This page will read a query parameter (e.g., `?action=managed`) and display a generic but appropriate confirmation message to the user, such as "Your subscription has been successfully updated."

### Task 2.4: Finalize Payment Flow Pages **STATUS: Not Started**
- **Files:** `frontend/src/app/subscription/success/page.tsx` and `frontend/src/app/subscription/cancel/page.tsx`.
- **Action:** Review and update these pages to ensure they provide clear user feedback after returning from a Stripe Checkout session.

---

## Phase 3: Batch Job Enhancement & Finalization **STATUS: Not Started**
**Objective:** Refactor the existing batch jobs to align with the Stripe-centric, event-driven payment model, ensuring our internal token allocation logic remains robust.

### Task 3.1: Deprecate Payment-Related Batch Jobs
- **Action:** Since Stripe now handles all payment collection, renewals, and retries, the `CreatePaymentsBatch`, `CollectPaymentsBatch`, and `RetryFailedPaymentsBatch` are redundant. They will be **deprecated and removed** from the system to eliminate legacy code and rely solely on Stripe webhooks for payment state changes.

### Task 3.2: Confirm and Refine `SubscriptionRenewalsBatch` for Token Allocation
- **Action:** This batch job is **critically important** for managing our application-specific **monthly token allocation cycle**, which is decoupled from Stripe's billing cycle (e.g., for yearly plans). The batch's logic will be reviewed and confirmed to perform the following scheduled task:
  - Query for all active subscriptions where the `current_period_end` (token allocation period) has passed.
  - For each subscription, call the `subscriptionService` to allocate the correct number of monthly tokens.
  - Update the subscription's `current_period_start` and `current_period_end` dates, advancing them by one month to schedule the next token allocation.

### Task 3.3: Refactor and Repurpose `ProcessPendingCancellationsBatch`
- **Action:** This batch job will be refactored to serve two primary functions:
  - **Scheduled Downgrades:** Its main job is to process subscriptions that have been canceled in Stripe and have reached the end of their paid billing period. It will query for subscriptions with a status of `pending_cancellation` where the `end_date` has passed and finalize the process by downgrading the user to the Free Tier.
  - **Data Reconciliation:** The batch will be enhanced to act as a reconciliation tool. It will periodically compare subscription statuses between our local database and Stripe to identify and correct any discrepancies that may have resulted from missed webhooks, ensuring long-term data integrity.

---

## Phase 4: Business Logic Finalization (Post-Stripe E2E) **STATUS: Not Started**
**Objective:** Implement the token deduction and plan limitation logic now that the core subscription flow is complete.

### Task 4.1: Integrate and test Token Deduction
- **Action:** Modify the `job-service` processors (`scene-processor`, `music-processor`, etc.) to call the existing `POST /api/subscription/tokens/usage` endpoint *before* executing a token-consuming task. The job will fail gracefully if the user has an insufficient balance.

#### Task 4.1.1: Review the current logic and implementation of the token deduction and the logic for the different services
- **Action:** Review the current classes of the token deduction and the logic for the different services.

#### Task 4.1.2: Implement token usage calculation for each job to show the user the cost of the job before execution in real time. Let a job fail (validation) if the user has an insufficient balance and tries to execute. Disable the button and show a message to the user if the user has an insufficient balance.

### Task 4.2: Enforce Plan Limitations
- **Action:** Before starting a job, the `job-pipeline-service` will call a new endpoint (e.g., `GET /api/subscription/limitations/usage` as described in your docs) to check usage against plan limits (e.g., `max_jobs_per_month` and `max_scenes_per_job` and `allowed_content_types`). The job will be rejected if limits are exceeded or the content type is is not included in the tier.

### Task 4.3: Enfore Frontend Plan Limitations
- **Action:** In the frontend the user can select different script settings, visual selection styles, voice styles and templates for the assembly. The frontend shall only render the options that are allowed for the current plan. The options are defined in visual_selection_count, voice_selection_count, template_selection_count and script_settings_count. In different json configuration files there are properties added to the json files for each option (e.g. template-select-option.json with property planId). Higher plans always include the lower plans ids.

### Task 4.4: Add watermark for free tier users
- **Action:** As defined in has_watermark different plans have watermark setting enabled or disabled. Depending on that a new backend service needs to add a watermark to the created content pieces (images).

---

## Phase 5: Final Testing & Deployment **STATUS: Not Started**
**Objective:** Ensure the entire system is robust, secure, and ready for production.

### Task 5.1: Comprehensive E2E Testing
- **Action:** Perform end-to-end testing of all user flows in a staging environment connected to Stripe's test mode.

### Task 5.2: Production Deployment
- **Action:** Execute the production deployment, ensuring all environment variables, API keys, and webhook endpoints are correctly configured for the live environment.

### Task 5.3: Monitoring & Alerting
- **Action:** Set up monitoring and alerts for key metrics like webhook success rates and payment failures.