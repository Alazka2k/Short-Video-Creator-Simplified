# Subscription Management System - Implementation Status

This document outlines the current implementation state of our subscription management system, detailing the workflows, data flows, and database operations for various subscription scenarios.

## Current Use Cases

### 1. New User Registration (Implemented)

#### User Flow:
1. User registers a new account
2. System assigns free tier subscription automatically
3. System allocates initial token allocation for free tier

#### Data Flow:
- Create user record in users table
- Create subscription record in user_subscriptions table (plan_id=1, free tier)
- Create initial token allocation in token_transactions table
- Update token balance in tokens table

#### Database Operations:
```sql
INSERT INTO users (user_id, email, name, ...)
INSERT INTO user_subscriptions (user_id, plan_id=1, status='active', ...)
INSERT INTO token_transactions (user_id, transaction_type='allocation', amount=300, ...)
INSERT INTO tokens (user_id, balance=300)
```

### 2. Subscription Creation (Implemented)

#### User Flow:
1. User selects a subscription plan
2. System processes payment (if paid plan)
3. System creates subscription record
4. System allocates tokens based on plan

#### Data Flow:
- Process payment through payment gateway (if paid plan)
- Create subscription record
- Allocate tokens based on plan
- Update token balance

#### Database Operations:
```sql
INSERT INTO user_subscriptions (user_id, plan_id, status='active', ...)
INSERT INTO payments (user_id, amount, payment_type='subscription_initial', ...)
INSERT INTO token_transactions (user_id, transaction_type='allocation', ...)
UPDATE tokens SET balance = balance + allocation_amount WHERE user_id = ?
```

### 3. Subscription Plan Change Scenarios (Implemented)

We've implemented a unified approach to handle all plan change scenarios through a single endpoint. The system automatically determines the type of change based on plan comparison using the `comparePlans()` helper method.

#### 3.1 Tier Upgrade (Higher Tier Plan)

##### User Flow:
1. User initiates upgrade to a higher tier plan
2. System immediately cancels the current subscription
3. System creates a new subscription with the higher tier plan
4. System allocates tokens for the new plan

##### Data Flow:
- Cancel the current subscription (immediate)
- Set `ended_at` date on the old subscription
- Create a new subscription with higher tier
- Process payment for the new plan
- Allocate tokens for the new plan

##### Database Operations:
```sql
-- Cancel current subscription
UPDATE user_subscriptions 
SET status = 'cancelled', 
    cancellation_reason = 'CANCEL_FOR_UPGRADE',
    canceled_at = NOW(),
    ended_at = NOW()
WHERE subscription_id = ?

-- Create new subscription with higher tier
INSERT INTO user_subscriptions (user_id, plan_id, status='active', ...)

-- Create payment record
INSERT INTO payments (user_id, subscription_id, plan_id, ...)

-- Allocate tokens
INSERT INTO token_transactions (user_id, transaction_type='allocation', ...)

-- Update token balance
UPDATE tokens SET balance = balance + allocation_amount WHERE user_id = ?
```

#### 3.2 Tier Downgrade (Lower Tier Plan)

##### User Flow:
1. User initiates downgrade to a lower tier plan
2. System marks current subscription for cancellation at the end of billing period
3. When billing period ends, system creates a new subscription with the lower tier plan

##### Data Flow:
- Mark current subscription as pending cancellation
- Store the upcoming plan ID for later activation
- When billing period ends, batch job:
  - Finalizes cancellation of old subscription
  - Sets `ended_at` date
  - Creates new subscription with lower tier
  - Processes payment for the new plan
  - Allocates tokens for the new plan

##### Database Operations:
```sql
-- Mark current subscription for cancellation at period end
UPDATE user_subscriptions 
SET status = 'pending_cancellation', 
    cancellation_reason = 'CANCEL_FOR_DOWNGRADE',
    upcoming_plan_id = ?,
    canceled_at = NOW()
WHERE subscription_id = ?

-- At end of billing period (via batch job)
UPDATE user_subscriptions 
SET status = 'cancelled',
    ended_at = NOW()
WHERE subscription_id = ? AND status = 'pending_cancellation'

-- Create new subscription with lower tier
INSERT INTO user_subscriptions (user_id, plan_id, status='active', ...)

-- Create payment record for new plan
INSERT INTO payments (user_id, subscription_id, plan_id, ...)

-- Allocate tokens for new plan
INSERT INTO token_transactions (user_id, transaction_type='allocation', ...)

-- Update token balance
UPDATE tokens SET balance = balance + allocation_amount WHERE user_id = ?
```

#### 3.3 Frequency Change (Same Tier, Different Billing Frequency)

##### User Flow:
1. User changes billing frequency (e.g., monthly to yearly or vice versa)
2. System marks current subscription for cancellation at the end of billing period
3. When billing period ends, system creates a new subscription with the same tier but different frequency

##### Data Flow:
- Mark current subscription as pending cancellation
- Store the upcoming plan ID for later activation
- When billing period ends, batch job:
  - Finalizes cancellation of old subscription
  - Sets `ended_at` date
  - Creates new subscription with new frequency
  - Processes payment for the new plan
  - Allocates tokens for the new plan

##### Database Operations:
```sql
-- Mark current subscription for cancellation at period end
UPDATE user_subscriptions 
SET status = 'pending_cancellation', 
    cancellation_reason = 'CANCEL_FOR_FREQUENCY_CHANGE',
    upcoming_plan_id = ?,
    canceled_at = NOW()
WHERE subscription_id = ?

-- At end of billing period (via batch job)
UPDATE user_subscriptions 
SET status = 'cancelled',
    ended_at = NOW()
WHERE subscription_id = ? AND status = 'pending_cancellation'

-- Create new subscription with new frequency
INSERT INTO user_subscriptions (user_id, plan_id, status='active', ...)

-- Create payment record for new plan
INSERT INTO payments (user_id, subscription_id, plan_id, ...)

-- Allocate tokens for new plan
INSERT INTO token_transactions (user_id, transaction_type='allocation', ...)

-- Update token balance
UPDATE tokens SET balance = balance + allocation_amount WHERE user_id = ?
```

### 4. Subscription Cancellation (Implemented)

#### User Flow:
1. User cancels paid subscription
2. System marks subscription for cancellation at the end of billing period
3. At the end of billing period, system cancels the subscription and creates a free tier subscription

#### Data Flow:
- Mark current subscription as pending cancellation
- Set upcoming plan ID to free tier (plan_id=1)
- When billing period ends, batch job:
  - Finalizes cancellation of old subscription
  - Sets `ended_at` date
  - Creates new free tier subscription
  - Allocates tokens for free tier

#### Database Operations:
```sql
-- Mark current subscription for cancellation at period end
UPDATE user_subscriptions 
SET status = 'pending_cancellation', 
    cancellation_reason = 'CANCEL_PAID_PLAN',
    upcoming_plan_id = 1, -- Free tier
    canceled_at = NOW()
WHERE subscription_id = ?

-- At end of billing period (via batch job)
UPDATE user_subscriptions 
SET status = 'cancelled',
    ended_at = NOW()
WHERE subscription_id = ? AND status = 'pending_cancellation'

-- Create new free tier subscription
INSERT INTO user_subscriptions (user_id, plan_id=1, status='active', ...)

-- Allocate tokens for free tier
INSERT INTO token_transactions (user_id, transaction_type='allocation', ...)

-- Update token balance
UPDATE tokens SET balance = balance + 300 WHERE user_id = ? -- Free tier allocation
```

### 5. Token Allocation and Renewal (Implemented)

#### User Flow:
1. User reaches end of subscription period
2. System allocates new tokens based on subscription plan
3. System updates token balance

#### Data Flow:
- Check if subscription period has ended
- Calculate tokens to allocate based on plan
- Create token allocation transaction
- Update token balance

#### Database Operations:
```sql
-- Update subscription period
UPDATE user_subscriptions 
SET current_period_start = ?,
    current_period_end = ?
WHERE subscription_id = ?

-- Allocate tokens
INSERT INTO token_transactions (
    user_id, 
    transaction_type='allocation', 
    amount=?,
    description='Monthly token allocation for subscription'
)

-- Update token balance
UPDATE tokens SET balance = balance + ? WHERE user_id = ?
```

## Batch Job Implementation

### 1. Process Pending Cancellations (Started but needs refactoring)

This batch job processes subscriptions marked for cancellation that have reached their end date.

#### Job Responsibilities:
1. Identify subscriptions with `status='pending_cancellation'` and `end_date <= current_date`
2. Change their status to `cancelled`
3. Set the `ended_at` timestamp to the current date/time
4. Create new subscriptions based on the `upcoming_plan_id` value:
   - For downgrades: Create with the specified lower-tier plan
   - For frequency changes: Create with the same tier but different frequency
   - For cancellations to free tier: Create with plan_id=1 (free tier)

#### Database Operations:
```sql
-- Find pending cancellations ready to process
SELECT * FROM user_subscriptions 
WHERE status = 'pending_cancellation' 
AND end_date <= NOW() 
AND end_date IS NOT NULL;

-- For each subscription found:
-- 1. Finalize cancellation
UPDATE user_subscriptions 
SET status = 'cancelled',
    ended_at = NOW()
WHERE subscription_id = ?;

-- 2. If there's an upcoming plan, create new subscription
INSERT INTO user_subscriptions (
    user_id, 
    plan_id, -- upcoming_plan_id from old subscription
    status = 'active',
    start_date = NOW(),
    current_period_start = NOW(),
    -- Calculate current_period_end based on plan billing frequency
    ...
)
```

### 2. Token Allocation Job (Planned)

This batch job will allocate tokens to subscriptions at the beginning of each new period.

#### Job Responsibilities (To Be Implemented):
1. Identify subscriptions where `current_period_end <= current_date`
2. Allocate tokens based on plan
3. Update subscription periods
4. Update token balances

### 3. Payment Renewal and Follow up processing (Planned)

This batch job will process payments and follow up on any failed payments.

#### Job Responsibilities (To Be Implemented):
1. Identify payments that are due for renewal
2. Process payments
3. Follow up on any failed payments (mark them for retry, retry failed payments, switch to free tier if too many retries)

## Validation Rules and Restrictions

The following validation rules have been implemented:

1. **Free Tier Restrictions**:
   - Free tier subscriptions (plan_id=1) cannot be downgraded
   - Free tier subscriptions cannot be cancelled except for upgrading to a paid plan
   - These restrictions are enforced at multiple levels:
     - Service layer (`subscriptionService.js`)
     - Data access layer (`subscriptionsDataAccess.js`)
     - API Gateway (`subscription.js` routes)

2. **Plan Change Validation**:
   - Plans are compared using `tier_id` to determine upgrade/downgrade scenarios
   - The system prevents invalid operations (e.g., downgrading a free tier subscription)
   - User can only manage their own subscriptions unless they have admin permissions

3. **Subscription Status Validation**:
   - Subscriptions can only be cancelled once
   - Only active subscriptions can be upgraded/downgraded
   - Status transitions are strictly controlled:
     - `active` → `pending_cancellation` or `cancelled`
     - `pending_cancellation` → `cancelled`
