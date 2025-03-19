Subscription Service Development Plan (Renamed from Billing Service)

# 1. Service Architecture
## 1.1 Core Components
- ✅ Subscription Service: Central service managing subscriptions, payments, and token balances
- ⏳ Stripe Integration: Payment processing for one-time and recurring payments
- ⏳ Token Management: Track token usage, purchases, and allocations
- ⏳ Plan Management: Enforce limitations and features based on user's plan
## 1.2 Database Interaction Layers
- ✅ Payment Data Access: CRUD operations for payments table
- ✅ Plan Data Access: Operations for plans table
- ✅ Subscription Data Access: Operations for user_subscriptions table
- ✅ Token Transaction Data Access: Operations for token_transactions table
- ✅ Token Package Data Access: Operations for token_packages table
- ✅ Token Balance Data Access: Operations for tokens table

# 2. Implementation Plan

## Phase 1: Core Backend Services (3-4 days)
### 2.1 Subscription Service Setup
- ✅ Create service directory structure
- ✅ Set up Express server with standard middleware
- ✅ Configure endpoint routing
- ✅ Implement service initialization
### 2.2 Data Access Layers
- ✅ Implement planDataAccess.js (plans table operations)
- ✅ Implement subscriptionDataAccess.js (user_subscriptions operations)
- ✅ Implement tokenTransactionDataAccess.js (token_transactions operations)
- ✅ Implement tokenPackageDataAccess.js (token_packages operations)
- ✅ Implement tokenBalanceDataAccess.js (tokens table operations)
- ✅ Implement paymentDataAccess.js (payments table operations)
### 2.3 Utility Components
- ✅ Create tokenCalculator.js for usage calculations
- ⏳ Implement service restriction logic based on plan limits
- ⏳ Develop helper functions for token allocation and deduction

## Phase 2: Stripe Integration (2-3 days)
### 2.1 Stripe Setup
- ⏳ Configure Stripe account settings
- ⏳ Implement stripeService.js for API interactions
- ⏳ Set up webhook handler for payment events
- ⏳ Configure products and prices in Stripe to match plans
### 2.2 Payment Processing
- ⏳ Implement credit card payment processing
- ⏳ Set up PayPal integration through Stripe
- ⏳ Implement subscription creation in Stripe
- ⏳ Handle subscription lifecycle events
### 2.3 Webhook Management
- ⏳ Create webhook endpoints for Stripe events
- ⏳ Handle successful payment events
- ⏳ Process subscription lifecycle events (created, updated, canceled)
- ⏳ Handle failed payment scenarios

## Phase 3: API Endpoints (2-3 days)
### 3.1 Plan Management
- ✅ GET /plans - List available plans
- ✅ GET /plans/:planId - Get plan details
### 3.2 Subscription Management
- ✅ GET /subscriptions/user/:userId - Get user's current subscription
- ✅ POST /subscriptions - Create a new subscription
- ✅ PUT /subscriptions/:subscriptionId - Update a subscription
- ✅ POST /subscriptions/:subscriptionId/cancel - Cancel subscription
### 3.3 Token Management
- ✅ GET /tokens/balance/:userId - Get current token balance
- ✅ POST /tokens/allocate - Allocate tokens to a user
- ✅ POST /tokens/deduct - Deduct tokens for service usage
- ✅ POST /tokens/purchase - Purchase token package
- ✅ GET /transactions/user/:userId - Get token transaction history
- ✅ GET /token-costs - Get token costs for different services
- ✅ POST /calculate-job-cost - Calculate token cost for a job
### 3.4 Payment History
- ✅ GET /payments/user/:userId - Get payment history
- ✅ GET /payments/summary/:userId - Get payment summary

## Phase 4: API Gateway Integration (1-2 days)
### 4.1 API Gateway Routes
- ✅ Set up subscription routes in API Gateway
- ✅ Implement user authentication and authorization
- ✅ Configure proper forwarding to subscription service
- ✅ Add security checks for user data access

## Phase 5: Service Integration (2-3 days)
### 5.1 Token Deduction Integration
- ⏳ Connect job service to token deduction API
- ⏳ Implement pre-job token availability check
- ⏳ Add post-job token deduction logic
### 5.2 Plan Limitation Enforcement
- ⏳ Implement middleware for checking plan limitations
- ⏳ Integrate max scenes validation
- ⏳ Add content type restriction logic
- ⏳ Configure recreation feature availability
### 5.3 Limit Tracking
- ⏳ Track monthly job count for basic plans
- ⏳ Monitor token usage vs allocation
- ⏳ Implement notification system for limit approaches

## Phase 6: Frontend Components (4-5 days)
### 6.1 Dashboard Integration
- ⏳ Add token balance display to dashboard
- ⏳ Create token usage visualization
- ⏳ Implement low balance warnings
### 6.2 Plan Management UI
- ⏳ Create plan selection and comparison page
- ⏳ Implement subscription management interface
- ⏳ Add plan upgrade/downgrade flow
### 6.3 Token Purchase UI
- ⏳ Create token package selection interface
- ⏳ Implement Stripe Elements for payment forms
- ⏳ Add purchase confirmation and receipt views
### 6.4 Account History
- ⏳ Create transaction history view
- ⏳ Implement payment history display
- ⏳ Add subscription history visualization

# 3. Testing Plan
## 3.1 Unit Testing
- ⏳ Test data access layers
- ⏳ Test token calculation logic
- ⏳ Test plan restriction enforcement
## 3.2 Integration Testing
- ⏳ Test Stripe webhook handling
- ⏳ Test subscription lifecycle
- ⏳ Test token deduction in job creation
## 3.3 End-to-End Testing
- ⏳ Test complete subscription flow
- ⏳ Test token package purchase
- ⏳ Test plan limitation enforcement

# 4. Deployment Plan
## 4.1 Staging Deployment
- ⏳ Deploy service to staging environment
- ⏳ Configure Stripe test mode
- ⏳ Validate webhooks with test events
## 4.2 Production Preparation
- ⏳ Set up Stripe production keys
- ⏳ Configure production webhook endpoints
- ⏳ Prepare database migration scripts
## 4.3 Go-Live Strategy
- ⏳ Gradual rollout to select users
- ⏳ Monitor initial transactions
- ⏳ Track system performance

# 5. Current Status and Next Steps for the Subscription Service
## 5.1 What We've Accomplished
1. Infrastructure and Architecture
- ✅ Renamed the service from "billing-service" to "subscription-service" for clarity
- ✅ Created a solid foundation with proper service architecture following project patterns
- ✅ Implemented data access layers for all necessary database tables
- ✅ Developed token calculator utility for consistent token cost calculations
- ✅ Set up comprehensive API endpoints for all subscription-related operations
API Gateway Integration
✅ Integrated subscription routes in the API Gateway
✅ Implemented proper user authentication with security checks
✅ Added user context extraction to identify users from various token types
✅ Created comprehensive error handling and logging
Database Schema
✅ Designed and implemented database tables for plans, subscriptions, tokens, and payments
✅ Added migrations for token costs, plan features, and subscription management
✅ Created seed data for subscription plans and token packages
Stripe Service Framework
✅ Set up base Stripe service structure
✅ Created webhook handlers for payment notifications
✅ Added mock implementation for development and testing

## 5.2 What We Need to Complete
### 5.2.1 Stripe Integration
Create and configure Stripe products to match our subscription plans
Implement credit card payment processing
Complete subscription creation flow in Stripe
Fully implement webhook handlers for all payment events
Job Service Integration
Connect the job service to the token deduction API
Implement pre-job token availability checks
Add post-job token deduction logic
Track token usage per service and user
Plan Limitation Enforcement
Implement middleware to enforce plan limitations
Add validation for maximum scenes per job
Restrict content types based on subscription tier
Configure feature availability based on plan

### 5.2.4 Frontend Components
Create subscription management interface
Build token purchase UI with Stripe Elements
Add token balance and usage visualizations to dashboard
Implement plan comparison and upgrade/downgrade flows

### 5.2.5 Testing and Deployment
Develop unit tests for all components
Create integration tests for Stripe webhooks and payment flows
Test subscription lifecycles and token deduction
Deploy to staging environment with Stripe test mode

## 5.3 Implementation Strategy
### 5.3.1 Phase 1: Core Functionality (1-2 weeks)
Complete the token deduction system and connect it to the job service
Implement plan limitation enforcement to restrict features based on subscription tier
Finish Stripe payment processing for subscriptions and token packages

### 5.3.2 Phase 2: Frontend Integration (1-2 weeks)
Develop the subscription management UI
Create token purchase interface with Stripe Elements
Add token balance and usage visualizations to the dashboard

### 5.3.3 Phase 3: Testing and Refinement (1-2 weeks)
Develop comprehensive unit and integration tests
Test the entire subscription flow from purchase to usage
Refine the user experience based on testing feedback

### 5.3.4 Phase 4: Deployment (1 week)
Deploy to staging environment with Stripe test mode
Configure webhooks for the production environment
Prepare for gradual rollout to users

# 6. Progress Summary
## 6.1 Completed Components
- ✅ Service architecture: Server structure, API routes, and data access layers
- ✅ Database schema: Tables for plans, subscriptions, token packages, token transactions, and payments
- ✅ Token calculation utility for determining costs of different services
- ✅ API Gateway integration with proper user authentication
- ✅ Basic Stripe service structure with webhook handling

## 6.2 In Progress Components
- ⏳ Stripe integration for payment processing
- ⏳ Token deduction system connected to job service
- ⏳ Unit testing for core components

## 6.3 Next Steps
- Connect job service to token deduction API
- Implement plan limitation enforcement
- Develop frontend components for subscription management
- Complete Stripe payment processing integration
- Setup comprehensive testing

# 7. Milestones and Deliverables
| Milestone | Deliverable | Status | Estimated Completion |
|-----------|-------------|--------|----------------------|
| Core Backend | Functioning subscription service with data access | ✅ Complete | Done |
| API Gateway Integration | Subscription routes in API gateway | ✅ Complete | Done |
| Stripe Integration | Working payment processing | ⏳ In Progress | 1-2 weeks |
| Service Integration | Connected token system with job service | ⏳ In Progress | 1-2 weeks |
| Frontend Components | User interfaces for subscription operations | ⏳ Not Started | 2-3 weeks |
| Testing | Comprehensive test suite | ⏳ In Progress | 2-3 weeks |
| Deployment | Production-ready service | ⏳ Not Started | 3-4 weeks |