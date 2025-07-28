# User Subscription Flow Scenarios

This document outlines the key user flows for subscription management, including signup, upgrades, downgrades, and cancellations, and describes the system behavior at each step.

---

## 1. New User Signup

**Scenario:**  
A new user registers for the service.

**System Behavior:**
- The `auth-service`'s `createUser` function is called.
- A new record is created in the `users` table with `subscription_plan_id` explicitly set to `1` (the Free Tier).
- Simultaneously, an initial subscription is created in the `user_subscriptions` table for the Free Tier.

**Result:**  
From the first login, the user's authentication token (JWT) contains `subscription_plan_id: 1`. The pricing page displays "Free" as their current plan.

---

## 2. Upgrading a Plan (e.g., Free to Basic, or Basic to Creator)

**Scenario:**  
A user upgrades to a higher-value plan.

**Action:**  
The user clicks "Get Started" on a higher-tier plan on the pricing page and completes the Stripe Checkout.

**System Behavior:**
- Stripe sends a `checkout.session.completed` webhook.
- The `subscription-service` receives this event.
- The `createSubscriptionFromStripeEvent` function executes a transaction that:
  - Cancels the user's previous active subscription (e.g., Free plan).
  - Creates a new, active subscription for the higher tier (e.g., Basic).
  - Allocates the initial tokens for the new plan.
  - Updates the `users` table, setting `subscription_plan_id` to the new, higher plan ID.

**Result:**  
After redirection to the success page, the `refreshUser()` function issues a new authentication token containing the upgraded `plan_id`. The pricing page now correctly shows the new plan as "Current Plan".

---

## 3. Downgrading a Plan (e.g., Creator to Basic)

**Scenario:**  
A user schedules a downgrade to a lower-tier plan via the Stripe Customer Portal.

**System Behavior:**

- **Immediate:**
  - Stripe sends a `customer.subscription.updated` webhook.
  - The `subscription-service` sets the `upcoming_plan_id` field on the user's current subscription to the new, lower-tier plan ID.
  - No other changes are made; `users.subscription_plan_id` remains unchanged.

- **At the End of the Billing Period:**
  - Stripe sends a `customer.subscription.deleted` webhook for the old, higher-tier plan.
  - The `cancelSubscriptionFromStripeEvent` function runs:
    - Reads the `upcoming_plan_id` from the canceled subscription.
    - Creates a new, active subscription for the lower tier.
    - Updates `users.subscription_plan_id` to the new, lower plan ID.

**Result:**  
The user retains higher-tier benefits until the paid period ends. At the exact moment the period ends, their plan and authentication token are atomically updated to reflect the new, downgraded plan.

---

## 4. Canceling a Subscription (Paid to Free)

**Scenario:**  
A user cancels their paid subscription via the Stripe Customer Portal. This is handled as a downgrade to the Free Tier.

**System Behavior:**

- **Immediate:**
  - Stripe sends a `customer.subscription.updated` webhook.
  - The `subscription-service` sets the `upcoming_plan_id` on the user's current subscription to `1` (the Free Tier).
  - `users.subscription_plan_id` remains unchanged; the user keeps all paid features.

- **At the End of the Billing Period:**
  - Stripe sends a `customer.subscription.deleted` webhook.
  - The `cancelSubscriptionFromStripeEvent` function runs:
    - Detects that `upcoming_plan_id` is `1`.
    - Creates a new, active subscription for the Free Tier.
    - Updates `users.subscription_plan_id` to `1`.

**Result:**  
The user enjoys paid benefits for the full duration they paid for, then is seamlessly transitioned to the Free Tier.

---