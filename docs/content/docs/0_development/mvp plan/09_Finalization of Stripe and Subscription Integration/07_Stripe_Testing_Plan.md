# Stripe Integration Testing Plan

## Overview
This testing plan covers the new Stripe-specific functionality added to the subscription service. It focuses on checkout sessions, webhook processing, and Stripe customer management - the core components that integrate our platform with Stripe's payment processing.

## Test Data

Use the following official Stripe test card numbers to simulate different payment scenarios on the Stripe Checkout page.

**For all cards:**
- **Expiration Date:** Any valid future date (e.g., `12/34`).
- **CVC:** Any random 3-digit number (or 4 digits for American Express).
- **Name/Address:** Any value.

**Common Scenarios:**
- **Successful Payment (Visa):** `4242 4242 4242 4242`
- **Successful Payment (Mastercard):** `5555 5555 5555 4444`
- **Successful Payment (American Express):** `3782 8224 6310 005`

**Decline Scenarios:**
- **Generic Decline:** `4000 0000 0000 0002`
- **Insufficient Funds:** `4000 0000 0000 9995`
- **Lost Card:** `4000 0000 0000 9987`
- **Stolen Card:** `4000 0000 0000 9979`
- **Expired Card:** `4000 0000 0000 0069`
- **Incorrect CVC:** `4000 0000 0000 0127`

**Fraud Prevention Scenarios:**
- **Card that will be blocked by Radar:** `4100 0000 0000 0019`
- **CVC check fails:** `4000 0000 0000 0101` (You must enter a CVC for this to fail).
- **Postal code check fails:** `4000 0000 0000 0036` (You must enter a postal code for this to fail).
---

## Test Cases

### Phase Testing

#### Phase 1: Backend Core Refinement & Auth Integration ✅ Successful

##### Task 1.1: Secure and Adapt Existing Endpoints with New Auth Flow ✅ Successfu

###### Test Case 1.1.1: Fetch Current User's Subscription ✅ Successful
**Objective**: Verify that an authenticated user can fetch their own subscription data using the `/me` endpoint.
**Preconditions**:
- User is authenticated and has a valid JWT.
- User has an active subscription in the database.
**Test Steps**:
1. Make a `GET` request to `/api/subscription/subscriptions/me`.
2. Include the `Authorization: Bearer <JWT>` header.
**Expected Results**:
- The request returns a `200 OK` status.
- The response body contains the subscription data for the authenticated user.

###### Test Case 1.1.2: Fetch Current User's Paginated Payments ✅ Successful
**Objective**: Verify that an authenticated user can fetch their own paginated payment history.
**Preconditions**:
- User is authenticated and has a valid JWT.
- User has multiple payment records in the database.
**Test Steps**:
1. Make a `GET` request to `/api/subscription/payments/me?limit=2&offset=0`.
2. Include the `Authorization: Bearer <JWT>` header.
3. Make a second `GET` request to `/api/subscription/payments/me?limit=2&offset=2`.
**Expected Results**:
- Both requests return a `200 OK` status.
- The first response contains the first two payment records.
- The second response contains the next two payment records.

###### Test Case 1.1.3: Prevent Access Without Authentication ✅ Successful
**Objective**: Verify that unauthenticated requests to the `/me` endpoints are rejected.
**Preconditions**: None.
**Test Steps**:
1. Make a `GET` request to `/api/subscription/subscriptions/me` *without* an `Authorization` header.
**Expected Results**:
- The request is rejected with a `401 Unauthorized` status.

###### Test Case 1.1.4: Verify Old User-Specific Endpoints are Disabled ✅ Successful
**Objective**: Verify that the old, insecure `.../user/:userId` endpoints are no longer accessible through the API gateway.
**Preconditions**:
- User is authenticated and has a valid JWT.
**Test Steps**:
1. Make a `GET` request to `/api/subscription/subscriptions/user/123` (where 123 is any user ID).
2. Include the `Authorization: Bearer <JWT>` header.
**Expected Results**:
- The request is rejected with a `404 Not Found` status.

##### Task 1.2: Implement Webhook Idempotency ✅ Successfu

###### Test Case 1.2.1: Process a New Webhook Event ✅ Successful
**Objective**: Verify that a new, unique webhook event is processed and logged correctly.
**Preconditions**:
- Stripe CLI is listening and forwarding to `localhost:3000`.
**Test Steps**:
1. Trigger a new Stripe event using `stripe trigger checkout.session.completed`.
2. Observe the application logs in the api-gateway and in the subscription-service.
3. Check the `webhook_events` table in the database.
**Expected Results**:
- The application logs show the event was received and processed successfully.
- A new row is created in the `webhook_events` table with the corresponding `event_id`.
- The `processed_at` column for the new row is populated with a timestamp.
- The business logic (e.g., creating a subscription) is executed once.

###### Test Case 1.2.2: Reject a Duplicate Webhook Event ✅ Successful
**Objective**: Verify that resending the same webhook event is ignored and does not trigger business logic a second time.
**Preconditions**:
- Test Case 1.2.1 has been successfully executed.
- The event ID from the first test is known.
**Test Steps**:
1. Resend the event from Test Case 1.2.1 using `stripe events resend <event_id>`.
2. Observe the application logs.
3. Check the `webhook_events` table in the database.
**Expected Results**:
- The application logs show a message like "Webhook event already processed. Skipping."
- No logs from the `paymentService` business logic are present for this second request.
- No new row is created in the `webhook_events` table. The existing row is unchanged.

###### Test Case 1.2.3: Handle a Failed Webhook Event ✅ Successful
**Objective**: Verify that if processing fails, the error is logged correctly in the `webhook_events` table.
**Preconditions**:
- Modify the `paymentService` to temporarily throw an error for a specific event type (e.g., `invoice.payment_failed`).
**Test Steps**:
1. Trigger the failing event using `stripe trigger invoice.payment_failed`.
2. Observe the application logs.
3. Check the `webhook_events` table in the database.
**Expected Results**:
- The application logs show an error during processing.
- A new row is created in the `webhook_events` table.
- The `processed_at` column is `NULL`.
- The `last_error` column contains the error message.
- The `processing_attempts` is 1.

#### Phase 2: Frontend Integration & UI/UX Refactor

##### Task 2.1: Create `PricingPageComponent`, button, adapt endpoints and a page `pricing/page.tsx` ✅ Successful

##### Test Case 2.1.1.: Test adapted endpoints in subscription.js with postman (/token-packages, /token-packages/:packageId, /transactions/token-costs, /transactions/calculate-job-cost) ✅ Successful

###### Test Case 2.1.2: Not logged in visitor ✅ Successful
**Objective**: Verify the user flow for an unauthenticated visitor.
**Preconditions**:
- Visitor is not logged in.
**Test Steps**:
1. Navigate to the `/pricing` page.
2. Verify all plans (including the inactive "Professional" tier) and token packages are displayed correctly.
3. Click the "Get Started" button on the "Creator" plan.
4. Click the "Purchase Now" button on a token package.
**Expected Results**:
- All "Get Started" and "Purchase" buttons are `<Link>` components.
- Clicking the "Get Started" button on the "Creator" plan redirects the user to `/signup?plan=<creator_plan_stripe_price_id>`.
- Clicking the "Purchase Now" button on a token package redirects the user to `/signup?redirect=/pricing`.

###### Test Case 2.1.3: Logged in user in free tier with intention to buy token package ✅ Successful
**Objective**: Verify the user flow and token package purchase for an authenticated user in a free tier.
**Preconditions**:
- User is logged in and is on the free tier.
**Test Steps**:
1. Navigate to the `/pricing` page.
2. Verify the "Free Tier" card is correctly highlighted as the "Current Plan" and its button is disabled.
3. Go to token packages page.
4. Click the "Purchase Now" button on the "Creator Pack" token package.
**Expected Results**:
- The user is redirected to a Stripe Checkout session for the "Creator Pack" token package.
- After successful payment for the token package, redirection to the successful payment page, the user's token balance is increased accordingly. Token transaction and payment record are created in the database. Token balance is updated.
- In the success page the user sees a correct message "Tokens Added!"

###### Test Case 2.1.4: Logged in user in free tier with intention to upgrade from free to paid tier ✅ Successful

####### Sub Test 2.1.4.1: User without stripe customer id ✅ Successful
**Objective**: Verify the user flow and subscription upgrade to paid tier for an authenticated user on the Free tier. User has no stripe customer id - so the customer is not created in stripe yet.
**Preconditions**:
- User is logged in and is on the Free tier (plan_id: 1).
**Test Steps**:
1. Navigate to the `/pricing` page.
2. Verify the "Free Tier" card is correctly highlighted as the "Current Plan" and its button is disabled.
3. Click the "Get Started" button on the "Basic" plan.
**Expected Results**:
- A new stripe customer is created in stripe and added to the application database under stripe_customer_id.
- The user is redirected to a Stripe Checkout session for the "Creator" monthly subscription.
- After successful payment for the "Basic" plan, the user is redirected to the successful payment page.
- The user's subscription record in the database is updated to the new plan. A new plan entry is created, to old entry is cancelled
- After successful upgrade the tokens are allocated to the user's account.

####### Sub Test 2.1.4.2: User with stripe customer id ✅ Successful
**Objective**: Verify the user flow and subscription upgrade to paid tier for an authenticated user on the Free tier. User has a stripe customer id - so the customer is already created in stripe.
**Preconditions**:
- User is logged in and is on the Free tier (plan_id: 1).
**Test Steps**:
1. Navigate to the `/pricing` page.
2. Verify the "Free Tier" card is correctly highlighted as the "Current Plan" and its button is disabled.
3. Click the "Get Started" button on the "Basic" plan.
**Expected Results**:
- Since the user has a stripe customer id, the customer is not created in stripe again.
- The user is redirected to a Stripe Checkout session for the "Creator" monthly subscription.
- After successful payment for the "Basic" plan, the user is redirected to the successful payment page.
- The user's subscription record in the database is updated to the new plan. A new plan entry is created, to old entry is cancelled
- After successful upgrade the tokens are allocated to the user's account.

###### Test Case 2.1.5: Logged in user in paid tier with intention to buy token package ✅ Successful
**Objective**: Verify the user flow and token package purchase for an authenticated user in a paid tier.
**Preconditions**:
- User is logged in and is on the "Basic" monthly plan.
**Test Steps**:
1. Navigate to the `/pricing` page.
2. Verify the "Basic" plan card is correctly highlighted as the "Current Plan" and its button is disabled.
3. Go to token packages page.
4. Click the "Purchase Now" button on the "Creator Pack" token package.
**Expected Results**:
- The user is redirected to a Stripe Checkout session for the "Creator Pack" token package.
- After successful payment for the token package, redirection to the successful payment page, the user's token balance is increased accordingly.

###### Test Case 2.1.6: Check the pricing page after succesful upgrade to a paid plan ✅ Successful
**Objective**: Verify the user flow and token package purchase for an authenticated user in a paid tier. The user has upgraded to a paid plan and is now on the "Basic" monthly plan. The label "Current Plan" should be updated to the new plan.
**Preconditions**:
- User is logged in and is on the "Basic" monthly plan.
**Test Steps**:
1. Navigate to the `/pricing` page.
**Expected Results**:
- Verify the "Basic" plan card is correctly highlighted as the "Current Plan" and its button is disabled.

###### Test Case 2.1.7: Logged in user in paid tier with intention to upgrade the plan ✅ Successful
**Objective**: Verify the user flow for an authenticated user already on a paid plan.
**Preconditions**:
- User is logged in and is on the "Basic" monthly plan.
**Test Steps**:
1. Navigate to the `/pricing` page.
2. Verify the "Basic" plan card is correctly highlighted as the "Current Plan" and its button is disabled.
3. Click the "Get Started" button on the "Creator" plan (a upgrade).
**Expected Results**:
- The button for the "Get Started" plan should initiate the Stripe Customer Portal flow to manage the subscription upgade.
- After successful payment for the "Creator" plan, the user is redirected to the successful payment page.
- The user's subscription record in the database is updated to the new plan. A new plan entry is created, to old entry is cancelled
- After successful upgrade the tokens are allocated to the user's account.

##### Task 2.2: Redesign and Implement ProtectedUser Dashboard (`/dashboard`)

##### Task 2.3: Implement ProtectedSubscription Management Page (`/subscription`)

##### Task 2.4: Finalize Payment Flow Pages

#### Phase 3: Batch Job Enhancement & Finalization

#### Phase 4: Business Logic Finalization (Post-Stripe E2E)

### E2E Testing

####  1. Stripe Checkout Session Creation

##### Test Case 1.1: Subscription Checkout Session Creation
**Objective**: Verify that users can create Stripe checkout sessions for subscription plans
**Preconditions**: 
- User is authenticated
- Valid subscription plans exist in database with Stripe price IDs
- Stripe service is configured

**Test Steps**:
1. User requests to create a subscription checkout session for Basic Monthly plan
2. System creates Stripe checkout session with correct price ID
3. System returns checkout session URL to user
4. User is redirected to Stripe's hosted checkout page

**Expected Results**:
- Checkout session is created successfully in Stripe
- Session URL is returned to frontend
- Stripe checkout page displays correct plan details and pricing
- User can complete payment on Stripe's secure checkout page

##### Test Case 1.2: Token Package Checkout Session Creation
**Objective**: Verify that users can purchase additional token packages through Stripe
**Preconditions**:
- User is authenticated
- Token packages exist with Stripe price IDs
- User has an existing subscription or account

**Test Steps**:
1. User selects "Creator Pack" token package (2,500 tokens for €24.99)
2. System creates Stripe checkout session for one-time payment
3. User completes payment on Stripe checkout page
4. System processes successful payment

**Expected Results**:
- One-time payment checkout session created
- Correct token package pricing displayed
- Payment processed successfully
- Tokens added to user account after payment confirmation

##### Test Case 1.3: Customer Portal Session Creation
**Objective**: Verify that users can access Stripe's customer portal for subscription management
**Preconditions**:
- User has active subscription
- User is Stripe customer

**Test Steps**:
1. User clicks "Manage Subscription" in dashboard
2. System creates customer portal session
3. User is redirected to Stripe customer portal
4. User can view/modify subscription, download invoices, update payment methods

**Expected Results**:
- Customer portal session created successfully
- User redirected to Stripe's customer portal
- All subscription details visible and manageable
- Changes in Stripe portal sync back to our system

#### 2. Stripe Webhook Processing

##### Test Case 2.1: Successful Subscription Payment Processing
**Objective**: Verify that successful subscription payments are processed correctly
**Preconditions**:
- User completes subscription checkout
- Webhook endpoint is configured and accessible

**Test Steps**:
1. User completes payment for Professional Monthly subscription
2. Stripe sends `checkout.session.completed` webhook
3. System processes webhook and creates subscription record
4. System allocates monthly tokens (10,000 for Professional plan)
5. System creates Stripe customer record in database

**Expected Results**:
- Subscription created with correct plan and billing cycle
- User receives full token allocation for their plan
- Stripe customer ID stored in user record
- Subscription status set to "active"

##### Test Case 2.2: Failed Payment Processing
**Objective**: Verify that failed payments are handled gracefully
**Preconditions**:
- User attempts payment with invalid card
- Webhook endpoint configured

**Test Steps**:
1. User submits payment with declined card
2. Stripe sends `payment_intent.payment_failed` webhook
3. System processes failed payment webhook
4. System updates payment status to "failed"
5. User is notified of payment failure

**Expected Results**:
- Payment status updated to "failed" in database
- No tokens allocated for failed payment
- User subscription remains in previous state
- Appropriate error handling and user notification

##### Test Case 2.3: Subscription Renewal Processing
**Objective**: Verify that monthly subscription renewals are processed automatically
**Preconditions**:
- User has active monthly subscription
- Subscription renewal date has arrived

**Test Steps**:
1. Stripe automatically charges customer for monthly renewal
2. Stripe sends `invoice.payment_succeeded` webhook
3. System processes renewal webhook
4. System allocates new monthly tokens
5. System updates subscription period dates

**Expected Results**:
- Monthly tokens allocated successfully
- Subscription period dates updated for next month
- Payment recorded in system
- User can continue using service without interruption

##### Test Case 2.4: Subscription Cancellation Processing
**Objective**: Verify that subscription cancellations are processed correctly
**Preconditions**:
- User has active subscription
- User cancels through Stripe customer portal

**Test Steps**:
1. User cancels subscription in Stripe customer portal
2. Stripe sends `customer.subscription.deleted` webhook
3. System processes cancellation webhook
4. System updates subscription status to "cancelled"
5. User retains access until current period ends

**Expected Results**:
- Subscription status updated to "cancelled"
- User retains access through current billing period
- No future charges processed
- User can resubscribe if desired

#### 3. Stripe Customer Management

##### 3.1: Customer Creation and Linking
**Objective**: Verify that Stripe customers are created and linked to user accounts
**Preconditions**:
- New user signs up for subscription
- User has no existing Stripe customer record

**Test Steps**:
1. User completes first subscription purchase
2. System creates new Stripe customer with user's email
3. System stores Stripe customer ID in user record
4. Future transactions use existing customer ID

**Expected Results**:
- Stripe customer created with correct email and metadata
- Customer ID stored in user database record
- Customer can be retrieved for future transactions
- Payment methods can be saved for customer

##### 3.2: Customer Data Synchronization
**Objective**: Verify that customer data stays synchronized between our system and Stripe
**Preconditions**:
- User exists as Stripe customer
- User updates profile information

**Test Steps**:
1. User updates email address in our system
2. System updates Stripe customer record with new email
3. User changes subscription plan
4. System updates Stripe subscription with new price

**Expected Results**:
- Customer email synchronized in Stripe
- Subscription changes reflected in both systems
- Billing information remains consistent
- Invoice delivery to correct email address

#### 4. Error Handling and Edge Cases

##### 4.1: Webhook Signature Verification
**Objective**: Verify that only authentic Stripe webhooks are processed
**Preconditions**:
- Webhook endpoint configured with signature verification
- Invalid webhook signature sent

**Test Steps**:
1. Malicious actor sends fake webhook with invalid signature
2. System verifies webhook signature
3. System rejects webhook with invalid signature
4. No data changes made to system

**Expected Results**:
- Invalid webhooks rejected
- No unauthorized data changes
- Security logs record rejected webhook attempts
- System remains secure against webhook spoofing

###### Test Case 4.2: Duplicate Webhook Handling
**Objective**: Verify that duplicate webhooks don't cause data corruption
**Preconditions**:
- Webhook idempotency system in place
- Same webhook sent multiple times

**Test Steps**:
1. Stripe sends `checkout.session.completed` webhook
2. System processes webhook successfully
3. Stripe resends same webhook (duplicate)
4. System detects duplicate and ignores it

**Expected Results**:
- First webhook processed normally
- Duplicate webhook ignored
- No duplicate subscriptions or token allocations created
- Database integrity maintained

###### Test Case 4.3: Service Downtime Recovery
**Objective**: Verify that missed webhooks during downtime are handled
**Preconditions**:
- System experiences temporary downtime
- Webhooks sent during downtime

**Test Steps**:
1. System goes offline temporarily
2. User completes payment during downtime
3. Stripe attempts webhook delivery (fails)
4. System comes back online
5. Missed webhooks are retrieved and processed

**Expected Results**:
- Missed webhook events identified
- Payment and subscription data synchronized
- User account updated correctly despite downtime
- No data loss or corruption

#### 5. Integration with Existing Systems

##### Test Case 5.1: Token System Integration
**Objective**: Verify that Stripe payments correctly trigger token allocation
**Preconditions**:
- Token allocation system exists
- User purchases subscription or token package

**Test Steps**:
1. User purchases Creator Monthly subscription (6,500 tokens)
2. Stripe webhook processed successfully
3. Token allocation service called
4. Tokens added to user's balance
5. Token transaction recorded

**Expected Results**:
- Correct number of tokens allocated
- Token balance updated in real-time
- Transaction history shows token allocation
- User can immediately use allocated tokens

##### Test Case 5.2: Batch Job Integration
**Objective**: Verify that Stripe integration works with existing batch processing
**Preconditions**:
- Batch job system exists for payment processing
- Stripe becomes primary payment processor

**Test Steps**:
1. Batch job runs to process subscription renewals
2. System creates invoices in Stripe for upcoming renewals
3. Stripe processes automatic payments
4. Webhooks update local system with payment results
5. Failed payments trigger retry logic

**Expected Results**:
- Batch jobs work seamlessly with Stripe
- Automatic renewals processed correctly
- Failed payments handled appropriately
- Manual intervention only needed for edge cases

## Success Criteria

### Primary Success Criteria
- All checkout sessions create successfully and redirect to Stripe
- All webhook events process correctly and update database
- Customer data remains synchronized between systems
- No duplicate payments or token allocations occur
- Security measures prevent unauthorized webhook processing

### Performance Criteria
- Checkout session creation completes within 3 seconds
- Webhook processing completes within 10 seconds
- Customer portal sessions create within 2 seconds
- System handles webhook bursts during high traffic

### Reliability Criteria
- 99.9% webhook processing success rate
- Zero data corruption from webhook processing
- All payment failures handled gracefully
- System recovers from temporary outages without data loss

## Post-Testing Actions

### If Tests Pass
1. Document any discovered edge cases or limitations
2. Create monitoring alerts for webhook processing failures
3. Set up Stripe dashboard monitoring for payment issues
4. Proceed with frontend integration development

### If Tests Fail
1. Identify root cause of failures
2. Fix issues in webhook handlers or checkout logic
3. Re-run failed test cases
4. Update error handling based on discovered issues
5. Repeat testing cycle until all tests pass

This testing approach ensures that the Stripe integration works reliably and securely before users interact with it through the frontend interface. 