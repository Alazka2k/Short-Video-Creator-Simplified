# Detailed Plan: Finalization of Stripe and Subscription Integration

## 1. Overview

This document outlines the final integration of the stripe and subscription integration to have an e2e working system for buying subscriptions / loading up tokens, logic for payment for different plans and token alignment for each month with a paid plan, also correctly reducing the tokens of a user for a job and depending on what the user requires.

Loading up tokens with one-time payment as pay-as-you-go. Of course, also canceling a subscription needs to be working. Each service needs or job (summarize) run also has a cost that needs to be deducted. A lot of the backend implementation is already available in the subscription service but needs to be finalized and adapted after changing the auth flow completely. Frontend is not yet implemented.

**The Core Requirement:**
- Update the Stripe integration with the new auth flow.
- Review all current implementation regarding subscription with the integration of payment and token loading.
- Subscribe to a paid plan and load up tokens with a one-time payment as pay-as-you-go with direct payment from the user.
- Review the token deduction and implementation for each service. Each service or job run also has a cost that needs to be deducted.
- Implement a pricing page for the user to see the current plan, buttons for changing the plan and canceling the subscription, token usage with the possibility to purchase more tokens and usage history.
- Implement a new dashboard page (design and information needs to be discussed).

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
- The user has a clear dashboard to view their subscription status, token balance, and billing history.

---

## Phase 1: Backend Core Refinement & Auth Integration **STATUS: Not Started**
**Objective:** Solidify the backend foundation by integrating the new authentication flow, ensuring robust webhook processing, and adapting existing data endpoints for the frontend.

### Task 1.1: Secure and Adapt Existing Endpoints with New Auth Flow
- **Services:** `subscription-service`
- **Action:** Review all existing endpoints, especially `GET /subscriptions/user/:userId` and `GET /payments/user/:userId`. Remove all direct calls to `authDataAccess`. Modify the logic so that the `userId` is always taken from the authenticated user's JWT token (`req.user.userId`), ensuring a user can only ever access their own data (unless they are an admin).

### Task 1.2: Implement Webhook Idempotency
- **Service:** `subscription-service`
- **Action:** Fully implement webhook idempotency using the `webhook_events` table. Before processing, check if the `event.id` exists. If so, skip. If not, insert it and process the event. This prevents duplicate subscription creations or token allocations.

---

## Phase 2: Frontend Implementation & UI/UX Refactor **STATUS: Not Started**
**Objective:** Build a clear, intuitive, and fully functional user interface for the dashboard and subscription management, following the provided design guidelines.

### Task 2.1: Rename and Refactor Token Usage Component
- **File:** `frontend/src/components/billing/token-usage.tsx`
- **Action:** Rename the file to `TokenUsageDetails.tsx` for better clarity and consistency. Refactor the component to accept props, allowing it to be used in both a "summary" view (for the dashboard) and a "detailed" view (for the subscription page). It will be responsible for fetching its own data from the backend.

### Task 2.2: Create Reusable `PricingPageComponent`
- **Location:** `frontend/src/components/marketing/pricing/`
- **Action:** Develop a reusable component that fetches data from `/api/subscription/plans` and `/api/subscription/token-packages`. It will render the subscription tiers and one-time purchase options, each with a `StripeCheckoutButton`.

### Task 2.3: Redesign and Implement User Dashboard (`/dashboard`)
- **File:** `frontend/src/app/(dashboard)/dashboard/page.tsx`
- **Action:** Overhaul the main dashboard page to serve as a central hub.
    - **Layout:** Feature quick-action cards to start content creation funnels.
    - **Subscription Overview:** Include a *summary* version of the refactored `TokenUsageDetails.tsx` component that displays the current token balance and a link to the full subscription management page.

### Task 2.4: Implement Subscription Management Page (`/subscription`)
- **File:** `frontend/src/app/(dashboard)/subscription/page.tsx`
- **Action:** Create the detailed subscription management experience.
    - **Data Source:** This page will rely on the secured `GET /api/subscription/status` and `GET /api/subscription/billing-history` endpoints.
    - **Components:**
        *   Display the full, detailed `TokenUsageDetails.tsx` card with a breakdown of plan vs. purchased tokens.
        *   Show a "Current Plan" card with renewal information.
        *   Integrate a "Manage Billing" button (`CustomerPortalButton`) that links to the Stripe Customer Portal.
        *   Include a "Billing History" section that lists past payments.

### Task 2.5: Finalize Payment Flow Pages
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