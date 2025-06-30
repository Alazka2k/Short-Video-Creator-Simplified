---
title: Payment Testing
description: Test cases for payment and subscription functionality
weight: 2
---

# Payment Testing

This section contains test cases for payment and subscription functionality including Stripe integration, checkout flows, webhook processing, and subscription management.

## Test Cases

- [TC-PAY-001: Technical Stripe Checkout Flow](TC-PAY-001_technical_stripe_checkout_flow) - Admin comprehensive testing of the Stripe checkout and payment process
- [TC-PAY-002: User E2E Stripe Checkout Flow](TC-PAY-002_user_e2e_stripe_checkout_flow) - User end to end testing of the Stripe checkout and payment process for users

## Test Data

### Successful Payment
   Card: 4242 4242 4242 4242
   Expiry: Any future date (e.g., 12/34)
   CVC: Any 3 digits (e.g., 123)
   ZIP: Any 5 digits (e.g., 12345)

### Failed Payment
   Card: 4000 0000 0000 0002

### With Authorization
   Card: 4000 0025 0000 3155

## Test Coverage Areas

### Technical Checkout Flow 
- Admin triggers a checkout session
- Admin selects link from checkout session response
- Browser tab opens to Stripe Checkout URL
- Admin enters test card details
- Admin completes payment process
- Admin verifies redirect to success page

### User E2E Checkout Flow

- User can selects a package or plan and click on checkout button
- User is navigated to Stripe Checkout URL
- User can enter test card details
- User can complete payment process
- User is redirected to success page
- User has a subscription or load up of tokens with the selected plan or package