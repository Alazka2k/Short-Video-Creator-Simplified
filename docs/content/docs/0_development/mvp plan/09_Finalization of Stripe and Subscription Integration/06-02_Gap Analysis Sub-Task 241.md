# Gap Analysis: Sub-Task 2.4.1 - Build Cancel Subscription with Stripe Integration

## 🔍 Current State Analysis

### ✅ Backend Infrastructure (Already Available)
- ✅ **API Route**: `POST /api/subscription/subscriptions/:subscriptionId/cancel` exists in API Gateway
- ✅ **Controller Method**: `subscriptionController.cancelSubscription()` is implemented
- ✅ **Service Logic**: `subscriptionService.cancelSubscription()` with proper business logic
- ✅ **Data Access**: `subscriptionsDataAccess.cancelSubscription()` with pending cancellation logic
- ✅ **Stripe Integration**: `stripeService.cancelSubscription()` for Stripe API calls
- ✅ **Cancellation Reasons**: Standardized reasons including `CANCEL_PAID_PLAN`

### ❌ Frontend Gaps (Missing)
- ❌ **Modal Component**: No cancellation confirmation modal exists
- ❌ **Cancellation Hook**: No React Query mutation hook for cancellation API
- ❌ **UI Feedback**: No success/error handling in subscription page
- ❌ **Status Updates**: No automatic refresh of subscription data after cancellation
- ❌ **Status Display**: No pending cancellation status visualization

## 🎯 Requirements from Sub-Task 2.4.1
1. **Cancellation Modal**: Create modal popup for subscription cancellation confirmation
2. **In-Page Feedback**: Show cancellation status without leaving subscription page
3. **Real-time Updates**: Hook integration to refresh subscription data after cancellation
4. **Pending Cancellation Logic**: Show "Cancelled" status but maintain benefits until period end
5. **Stripe Integration**: Ensure proper Stripe webhook handling for `cancel_at_period_end`
6. **Status Display**: Clear visualization of different subscription states

## 🚀 Solution Design

### **Phase 1: API Endpoint Alignment**
**Objective**: Align cancellation endpoint with established `/me` pattern for consistency and security

**Current Inconsistency**:
```
GET /api/subscription/subscriptions/me        ✅ Secure
GET /api/subscription/tokens/balance/me       ✅ Secure  
GET /api/subscription/transactions/me         ✅ Secure
POST /api/subscription/subscriptions/73/cancel ❌ Inconsistent
```

**Proposed Alignment**:
```
POST /api/subscription/subscriptions/me/cancel ✅ Consistent
```

**Benefits**:
- **Security**: No subscription ID exposure in URL
- **Consistency**: Matches established `/me` pattern  
- **Simplicity**: Frontend doesn't need to manage subscription IDs
- **JWT-Based**: Relies on authenticated user context

**Implementation**:
1. **Add New Endpoint**: `POST /api/subscription/subscriptions/me/cancel`
2. **Update Controllers**: Modify to extract user from JWT instead of URL params
3. **Frontend Migration**: Update React Query mutation to use new endpoint
4. **Deprecate Old**: Mark `/subscriptions/:id/cancel` as deprecated

### Phase 2: Create Cancellation Modal Component
- **File:** frontend/src/components/subscription/CancellationModal.tsx
- **Features:**
  - **Confirmation Dialog:** Using existing Dialog UI components
  - **Clear Messaging:** Explain benefits retention until period end
  - **Feedback Collection:** Structured reason selection from configurable JSON and free-text comments (500 chars)
  - **Enhanced UX:** Character counter, proper validation, accessibility
  - **Loading States:** Show processing during API calls

### Phase 2.5: Database Integration for Feedback Storage
- **Objective:** Create backend infrastructure to store user cancellation feedback
- **Database Changes:**
  - **New Table:** `subscription_feedback` for user feedback storage
  - **Migration Script:** Create table with proper indexes and constraints
  - **Data Separation:** Keep user feedback separate from system cancellation reasons (`CANCEL_PAID_PLAN`)
- **Backend Integration:**
  - **Enhanced Controller:** Update `cancelUserSubscription` to store feedback
  - **Data Access Layer:** Add feedback storage methods
  - **API Enhancement:** Accept feedback data in cancellation request

### Phase 3: Create Subscription Mutation Hook
- **File:** frontend/src/lib/hooks/useSubscriptionMutations.ts
- **Features:**
  - **React Query Mutations:** useCancelSubscription and usePauseSubscription
  - **Automatic Cache Invalidation:** Refresh subscription data after successful cancellation
  - **Error Handling:** Proper error states and user feedback
  - **Success Callbacks:** Allow parent components to react to successful operations

### Phase 4: Integrate Modal into Subscription Page
- **File:** frontend/src/app/(dashboard)/subscription/page.tsx
- **Changes:**
  - **Modal State Management:** Add showCancellationModal state
  - **Handler Implementation:** Replace TODO with actual modal trigger
  - **Success Feedback:** Toast notifications for user feedback
  - **Data Refresh:** Automatic subscription data refresh after operations

### Phase 4.5: Fix Stripe Data Synchronization
- **Objective:** Resolve missing renewal payment records and subscription period sync issues to ensure accurate cancellation date display
- **Problem Analysis:**
  - **Missing Payment Records:** Only initial payment exists (July 28), missing August 28 and September 28 renewal payments despite Stripe showing 3 paid invoices
  - **Outdated Subscription Period:** `current_period_end` shows "2025-08-28" instead of "2025-10-28" after renewals
  - **Webhook Processing Gap:** `handleInvoicePaymentSucceeded` updates existing payments but doesn't create new payment records for renewals
- **Implementation Actions:**
  - **Action 4.5.1 - Fix Webhook Payment Record Creation:**
    - **Enhance `handleInvoicePaymentSucceeded`:** Create new payment record for every successful invoice (not just update existing)
    - **Payment Record Structure:** Include `stripe_invoice_id`, billing periods, and proper payment type classification
    - **Sync Subscription Periods:** Update `current_period_start/end` from Stripe subscription data as source of truth
  - **Action 4.5.2 - Implement Stripe Reconciliation:**
    - **Reconciliation Function:** Query Stripe API for all paid invoices and sync missing payment records
    - **Data Backfill:** Create missing payment records for August 28 and September 28 renewals using Stripe invoice data
    - **Subscription Period Update:** Sync current subscription period to match Stripe's current state (October 28)
  - **Action 4.5.3 - Update Cancellation End Date Logic:**
    - **End Date Source:** Use `billing_period_end` from latest payment record for cancellation modal display
    - **Backend Enhancement:** Set `end_date` from Stripe's current billing period when cancelling (not from local outdated data)
    - **Modal Data:** Query payments table for most recent billing period end to show accurate cancellation date
- **Expected Results:**
  ```sql
  -- payments table (after reconciliation)
  payment_id | amount | payment_type        | billing_period_end | stripe_invoice_id
  63         | 39.99  | subscription_initial| 2025-08-28        | in_initial_123
  64         | 39.99  | subscription_renewal| 2025-09-28        | FB431E4E-0064
  65         | 39.99  | subscription_renewal| 2025-10-28        | FB431E4E-0066
  
  -- user_subscriptions table
  current_period_end: '2025-10-28'  -- Synced from Stripe
  ```
- **Modal Display:** "You'll keep access to all features until October 28, 2025" (from latest payment's billing_period_end)

### Phase 5: Enhance UI Status Display
- **Files:** CurrentPlanCard.tsx, subscription page
- **Features:**
  - **Pending Cancellation Display:** Show "Cancels on [date]" for pending cancellations
  - **Status Badges:** Visual indicators for different subscription states
  - **Conditional Buttons:** Hide/show buttons based on subscription status
  - **Period End Display:** Clear messaging about benefit retention

### Technical Implementation Details:
- **API Integration:**
  - **Use existing POST /api/subscription/subscriptions/:subscriptionId/cancel endpoint**
  - **Follow established pattern from useTransactionHistory and other hooks**
  - **Implement proper error handling and loading states**
- **Stripe Logic:**
  - **Backend will call stripeService.cancelSubscription() with cancel_at_period_end: true**
  - **Webhook customer.subscription.updated will update local database**
  - **User retains access until current_period_end date**

### **Database Updates:**
- `status` → `'pending_cancellation'`
- `cancel_at_period_end` → `true`
- `upcoming_plan_id` → `1` (Free Tier)
- `cancellation_reason` → `'CANCEL_PAID_PLAN'`
- `end_date` → Stripe subscription's current period end (billing period end)
- `current_period_end` → Remains unchanged (token allocation cycle)

### UI Flow:
- **User clicks "Cancel Subscription" → Modal opens**
- **User selects cancellation reason → Confirms action**
- **API call processes → Success feedback shown**
- **Subscription data refreshes → UI updates to show pending cancellation status**
- **Modal closes → User stays on subscription page with updated information**

### Implementation Plan:
- **Create CancellationModal.tsx - Confirmation dialog with cancel/pause options**
- **Create useSubscriptionMutations.ts - React Query mutations for cancellation API**
- **Update subscription/page.tsx - Integrate modal and implement handlers**
- **Enhance CurrentPlanCard.tsx - Add pending cancellation status display**
- **Test Integration - Verify webhook handling and UI updates**
**Estimated Complexity**: Medium (leverages existing infrastructure, mainly frontend work)

---

## Subscription Lifecycle Scenarios

### Date Column Definitions

**`end_date`**: 
- **Purpose**: Defines when the subscription will actually end/transition
- **Set When**: Subscription is cancelled or scheduled for change
- **Value**: The date until which the customer has paid (billing period end from Stripe)

**`current_period_end`**: 
- **Purpose**: Defines the next monthly token allocation date
- **Cycle**: Always monthly, independent of billing frequency
- **Value**: Next token allocation date (managed by SubscriptionRenewalsBatch)

### Cancellation Scenarios

#### Scenario 1: User Requests Cancellation (Status: `pending_cancellation`)

**Trigger**: User clicks "Cancel Subscription" and confirms

**Database Changes**:
```sql
status = 'pending_cancellation'
cancel_at_period_end = true
cancellation_reason = 'CANCEL_PAID_PLAN'
end_date = stripe_subscription.current_period_end  
-- Billing period end
-- current_period_end remains unchanged (token cycle continues)
```

**What Happens**:
- User retains all subscription benefits until `end_date`
- Monthly token allocations continue until `end_date`
- Stripe subscription marked with `cancel_at_period_end: true`
- UI shows "Cancels on [end_date]" but subscription remains active

#### Scenario 2: End Date Reached - Pending Cancellation

**Trigger**: `ProcessPendingCancellationsBatch` runs and finds `end_date <= NOW()` with status `pending_cancellation`

**Actions Taken**:
1. **Mark Old Subscription**: Status → `'cancelled'`, `ended_at` → `NOW()`
2. **Create Free Subscription**: New record with `plan_id = 1` (Free Tier)
3. **Update User**: `subscription_plan_id = 1` in users table
4. **Token Allocation**: Allocate Free Tier tokens (via SubscriptionRenewalsBatch)

#### Scenario 3: End Date Reached - Active Subscription

**Trigger**: `end_date <= NOW()` with status `active` (should not happen in normal flow)

**What Happens**:
- This scenario indicates a data inconsistency
- Active subscriptions should not have `end_date` set
- System should log warning and investigate
- May indicate missed webhook or batch job failure

#### Scenario 4: Same Date - End Date = Current Period End

**When This Occurs**:
- Monthly subscriptions where billing cycle aligns with token cycle
- User cancels exactly at the end of both billing and token periods

**What Happens**:
1. **Final Token Allocation**: SubscriptionRenewalsBatch processes final monthly tokens
2. **Subscription Transition**: ProcessPendingCancellationsBatch creates Free Tier subscription
3. **Timing**: Both processes coordinate to ensure smooth transition
4. **User Experience**: Seamless transition from paid to free tier

### Cancellation Reasons

**`CANCEL_PAID_PLAN`**: User-initiated cancellation to Free Tier
- **Trigger**: User clicks "Cancel Subscription" in UI
- **Behavior**: Pending cancellation until period end
- **Outcome**: Downgrade to Free Tier

**`CANCEL_FOR_UPGRADE`**: System-initiated for plan upgrades
- **Trigger**: User upgrades to higher tier
- **Behavior**: Immediate cancellation
- **Outcome**: Replaced by new higher-tier subscription

**`CANCEL_FOR_DOWNGRADE`**: System-initiated for plan downgrades
- **Trigger**: User downgrades to lower tier
- **Behavior**: Pending cancellation until period end
- **Outcome**: Replaced by new lower-tier subscription

**`CANCEL_FOR_FREQUENCY_CHANGE`**: System-initiated for billing frequency changes
- **Trigger**: User changes from monthly to yearly (or vice versa)
- **Behavior**: Pending cancellation until period end
- **Outcome**: Replaced by new same-tier subscription with different billing

### Batch Job Coordination (Implementation in next Step)

**SubscriptionRenewalsBatch**:
- Processes `current_period_end` for monthly token allocations
- Continues processing until `end_date` is reached
- Ignores subscriptions with status `cancelled`

**ProcessPendingCancellationsBatch**:
- Processes `end_date` for subscription transitions
- Handles final subscription state changes
- Creates new subscriptions for downgrades/changes

**Coordination Logic**:
- Both batches check their respective date fields independently
- SubscriptionRenewalsBatch stops processing when status becomes `cancelled`
- ProcessPendingCancellationsBatch ensures clean transition to new subscription state