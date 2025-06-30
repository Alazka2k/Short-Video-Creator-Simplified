# TC-PAY-001: Stripe Checkout Flow

## Description
Verify that users can successfully complete subscription payments using Stripe Checkout with test payment methods.

## Prerequisites
- Valid user account (userId: 30 for testing)
- Stripe test environment configured
- Stripe CLI running with webhook forwarding
- Backend services running (API Gateway + Subscription Service)

## Test Steps

### Happy Path
1. Create checkout session via API endpoint
2. Navigate to Stripe Checkout URL
3. Enter test card details (4242424242424242, 12/25, 123)
4. Complete payment process
5. Verify redirect to success page

### Expected Results
- Checkout session created successfully
- Payment completed in Stripe
- User redirected to success URL
- Webhooks processed without errors
- Subscription created in database
- Customer record updated with Stripe customer ID
- Tokens allocated to user account

## Edge Cases

### Declined Payment
1. Follow happy path steps with declined test card (4000000000000002)
2. Verify payment declined handling
3. Verify user returned to checkout
4. Verify no subscription created

### Authentication Required (3D Secure)
1. Follow happy path steps with 3D Secure card (4000002500003155)
2. Complete additional authentication step
3. Verify payment succeeds after authentication
4. Verify normal webhook flow continues

### User Cancels Payment
1. Start checkout flow
2. Click "Back" or close browser tab
3. Verify user redirected to cancel URL
4. Verify no subscription created

### Error Scenarios

#### Invalid Plan ID
1. Create checkout session with non-existent planId
- Expected: 404 error with clear message
- No checkout session created

#### Invalid User ID
1. Create checkout session with non-existent userId
- Expected: 404 error "User not found"
- No checkout session created

#### Network Issues During Payment
1. Simulate network interruption during payment
- Expected: Stripe handles gracefully
- User can retry payment
- No partial subscriptions created

## Acceptance Criteria
- [ ] Successful payment with test cards
- [ ] Proper error handling for declined cards
- [ ] 3D Secure authentication works
- [ ] Webhook signature verification passes
- [ ] Success/cancel pages exist and work
- [ ] Subscription created in database
- [ ] Customer record updated
- [ ] Tokens allocated correctly
- [ ] Clear error messages for all failure scenarios
- [ ] Responsive design works on mobile
- [ ] Loading states properly displayed

## Notes
- Always use test environment and test cards
- Monitor both Stripe Dashboard and backend logs
- Verify webhook signature verification is working
- Test on multiple browsers and devices
- Check mobile responsiveness of Stripe Checkout
- Verify all error scenarios return appropriate messages

### Test Data
**Successful Test Cards:**
- Visa: 4242424242424242
- Mastercard: 5555555555554444
- American Express: 378282246310005

**Declined Test Cards:**
- Generic decline: 4000000000000002
- Insufficient funds: 4000000000009995

**Expiry:** Any future date (e.g., 12/25)
**CVC:** Any 3-digit number (e.g., 123)

### Test Subscription Plans
```json
{
  "planId": 1,
  "name": "Free Tier",
  "price": "€0/month",
  "tokens": 300,
  "note": "Cannot be purchased via Stripe"
}

{
  "planId": 2,
  "name": "Basic Tier", 
  "price": "€24.99/month",
  "tokens": 2500,
  "stripeProductId": "prod_SWOGHXCAw5ggqL",
  "stripePriceId": "price_1RbLUVLNIN3RdSe9NYWTUWQ6"
}

{
  "planId": 3,
  "name": "Creator Tier",
  "price": "€39.99/month", 
  "tokens": 6500
}

{
  "planId": 4,
  "name": "Professional Tier",
  "price": "€59.99/month",
  "tokens": 10000
}
```

## Test Environment Setup

### Required Services
```bash
# 1. Start Stripe CLI webhook forwarding
stripe listen --forward-to localhost:3000/api/subscription/webhooks/stripe

# 2. Start backend services
cd backend && npm start

# 3. Environment variables required
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SERVICE_AUTH_TOKEN=your_token
```

### Database Verification Queries
```sql
-- Check subscription creation
SELECT * FROM user_subscriptions WHERE user_id = 30;

-- Check customer record
SELECT stripe_customer_id FROM users WHERE user_id = 30;

-- Check token allocation
SELECT * FROM tokens WHERE user_id = 30;

-- Check payment record
SELECT * FROM payments WHERE user_id = 30 ORDER BY created_at DESC;
```

## Webhook Events Expected
```
✅ checkout.session.completed
✅ customer.subscription.created  
✅ invoice.payment_succeeded
✅ invoice_payment.paid
```

## Current Issues (To Fix)

### 🔴 Success URL Not Found
- URL: `http://localhost:3000/dashboard/subscription/success?session_id=...`
- Error: `{"error": "Not Found", "message": "The requested resource does not exist."}`
- **Fix Required**: Create success page component

### 🔴 Webhook Signature Verification Failing
- Error: "No signatures found matching the expected signature for payload"
- **Root Cause**: API Gateway forwarding issue with raw body
- **Fix Required**: Ensure raw body preservation in forwarding

## Notes
- Always use test environment and test cards
- Monitor both Stripe Dashboard and backend logs
- Verify webhook signature verification is working
- Test on multiple browsers and devices
- Check mobile responsiveness of Stripe Checkout
- Verify all error scenarios return appropriate messages 