Subscription Management System Design

# 1. New User Registration

## User Steps:

1. Register user account
2. Assign free tier subscription
3. Allocate initial token allocation for free tier

## Data Flow:

- Create user record in users table
- Create subscription record in user_subscriptions table (free tier)
- Create initial token allocation in token_transactions table
- Update token balance in tokens table

## Database Operations:

INSERT into users
INSERT into user_subscriptions (status: active)
INSERT into token_transactions (allocation for free tier)
INSERT into tokens (initial balance)

## Current Gap:
- The user creation creates a new user records with free subscription but is not using the correct (new) implementation and therefore does not allocate tokens.
- Customer balance in tokens table is not updated.

# 2. Paid User Billing Period Renewal without plan change

## User Steps:

1. After billing period expiry (monthly or yearly), billing auto-renews
2. User pays the subscription fee via stripe

## Data Flow:

- Subscription is due for payment (can be equal to the time of token renewal (monthly) or yearly)
- Request money from user via stripe
- New payment is created

## Database Operations:
INSERT into payments (new payment)

## Current Gap:
- An automatic batch processing for payments is not implemented.
- Stripe webhook is not implemented.

# 3. Free User / Paid User Token Renewal without plan change

## User Steps:

1. After period expiry (1 month), subscription auto-renews
2. User receives new token allocation

## Data Flow:

- Subscription is due for token renewal
- Request money from user via stripe
- Subscription renews
- Allocate new tokens for the period
- Update the token balance

## Database Operations:

UPDATE user_subscriptions (update current_period_start and current_period_end)
UPDATE updated_at timestamp
INCREMENT subscription_period_count
INSERT into token_transactions for new token allocation
UPDATE tokens table to reflect new balance

## Current Gap:
- The automatic token allocation is not implemented.
- The automatic token balance update is not implemented.

# 4. Upgrade from Free to Paid Plan

## User Steps:

User initiates upgrade from free to paid tier
Payment processed through payment service (Stripe)
User granted paid tier benefits

## Data Flow:

Process payment through payment gateway
Create new subscription record
Mark old subscription as cancelled
Allocate new tokens based on paid plan

## Database Operations:

INSERT into user_subscriptions (new paid plan)
UPDATE previous subscription to status=cancelled
INSERT into payments table
INSERT into token_transactions for new allocation
UPDATE tokens balance

## Current Gap:
- The automatic token balance update is not implemented.
- The payment service is not implemented (we currently create payments entries which are not really paid)

# 5. Downgrade Paid Plan to cheaper Paid Plan

## User Steps:

1. User initiates downgrade but retains current plan until billing period ends
2. Until billing period ends, tokens are allocated based on the current subscriptionplan
3. At billing period end, new downgraded plan activates

## Data Flow:

- Flag current subscription with cancellation date
- Create new subscription record with future start date
- When billing period ends, activate new subscription
- Request money from user via stripe for the new plan
- Allocate new tokens for the new plan
- Update the token balance

## Database Operations:

UPDATE current subscription with cancelled_date
INSERT new subscription with status=cancelled and next period start date

### When billing period ends:
UPDATE old subscription to status=cancelled
UPDATE new subscription to status=active
INSERT token_transaction for new plan allocation
INSERT payment record for new plan
UPDATE tokens balance

## Current Gap:
- The automatic token balance update is not implemented.
- The logic has to be adapted for downgrades (user has to keep the advantages for the time he paid for)
- Token balance should be first updated when the new plan is actived (otherwise the user gets additional tokens when downgrading)
- The payment service is not implemented (we currently create payments entries which are not really paid)

# 6. Cancel Paid Plan

## User Steps:

1. User cancels paid subscription
2. Service continues until end of billing period
3. User reverts to free tier afterward

## Data Flow:

Mark current subscription with cancellation date
Create new free tier subscription to activate after current period

## Database Operations:

UPDATE current subscription with cancelled_date
INSERT new free tier subscription with status=cancelled
When paid period ends:

UPDATE old subscription to status=cancelled
UPDATE free subscription to status=active
INSERT token_transaction for free tier allocation
UPDATE tokens balance

## Current Gap:
- The automatic token balance update is not implemented.
- The logic has to be adapted for cancellation (user has to keep the advantages for the time he paid for then switches to free tier, currently subscription entry is just cancelled immediately)

# Batch Jobs

## 1. Recurring Payment Collection

Frequency: Daily

### Requirements:

Process for users with active paid subscriptions
No cancellation date set

### Process:

Identify subscriptions where next payment is due
Send payment request to payment processor (Stripe)
Create payment record
Update subscription status based on payment result

## 2. Token Allocation
Frequency: Daily
### Requirements:

Check for subscription periods that have ended
Allocate new tokens based on subscription plan
Update balance of user tokens

### Process:

Identify subscriptions where current period has ended
Create token transaction records for new allocations
Update subscription period dates (new start/end)
Increment subscription period counter
Update user token balance

## 3. Plan Downgrades

Frequency: Daily

### Requirements:

Check for subscriptions with payments that are due for a downgrade

### Process:

Identify subscriptions where downgrade is due
Update subscription to new plan
Create token transaction for new allocation
Update user token balance
