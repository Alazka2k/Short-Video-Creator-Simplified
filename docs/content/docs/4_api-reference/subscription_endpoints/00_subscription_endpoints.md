# Subscription Service API Reference

The Subscription Service provides endpoints for managing subscription plans, user subscriptions, token transactions, and payment history. This document outlines all available endpoints with request and response examples.

**Base URL**: `/api/subscription`

All endpoints include proper authentication and authorization checks.

---

## Coming Soon Endpoints

The following endpoints are currently in development:

### 1. Enhance calculate job cost endpoint as a precheck for the job processing
**Endpoint**: `POST /limitations/calculate-job-cost`

**Use Case**:
- Pre-authorization of token usage before processing a job or other API call that consumes tokens. We can already calculate the cost of the job, but need to check if the user has enough tokens.
- Calculation of theoretical token usage (how many images, voices, etc. can be generated with the remaining tokens)

### 2. Get Feature Availability (to check if a feature is available in user's plan, to check how many jobs user executed in the current period)
**Endpoint**: `GET limitations/usage`

**Use Case**: 
- Get information about current period (of the subscription)
- Get count of jobs executed by user in the current period
- To compare the users selected plan with the available features

### 3. Change Token Package Details (Admin Only)
**Endpoint**: `POST /token-packages/change`

### 4. Change Subscription Plan Details (Admin Only)
**Endpoint**: `POST /subscriptions/change`

### 5. Get Count for token renewal and payment renewal
**Endpoint**: `GET /subscriptions/count`

### 6. Get different metrics for business analytics
**Endpoint**: `GET /subscriptions/metrics`

**Use Case**:
- Get different metrics for business analytics
- Revenue Metrics: Total Revenue, MRR, ARR, ARPU (Average revenue per user), ARPPU (Average revenue per paid user)
- Customer Metrics: Free Subscription Rate, Paid Subscription Rate, Paid Plan Distribution, Free to Paid Conversion Rate, Churn Rate, Retention Rate, LTV, CAC, LTV Ratio
- Growth Metrics: Growth Rate (Procentual increase MRR/ARR), Net Revenue Retention (NRR)
- User Metrics: MAU (Monthly Active Users), WAU (Weekly Active Users), DAUs (Daily Active Users), Stickiness (DAU / MAU), Activation Rate for each service (Token spend for each service / Total Tokens spend)
