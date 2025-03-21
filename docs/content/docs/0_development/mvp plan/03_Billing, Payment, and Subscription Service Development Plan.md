Subscription Service Development Plan (Renamed from Billing Service)

# 1. Service Architecture
## 1.1 Core Components
- ✅ Subscription Service: Central service managing subscriptions, payments, and token balances
- ⏳ Stripe Integration: Payment processing for one-time and recurring payments
- ⏳ Token Management: Track token usage, purchases, allocations and balances
- ⏳ Plan Management: Enforce limitations and features based on user's plan
## 1.2 Database Interaction Layers
- ✅ Payment Data Access: CRUD operations for payments table
- ✅ Plan Data Access: Operations for plans table
- ✅ Subscription Data Access: Operations for user_subscriptions table
- ✅ Token Transaction Data Access: Operations for token_transactions table
- ✅ Token Package Data Access: Operations for token_packages table
- ✅ Token Balance Data Access: Operations for tokens table

# 2. Implementation Plan

## Phase 1: Core Backend Services
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

## Phase 2: API Endpoints
### 2.1 Plan Management
- ✅ GET /plans - List available plans
- ✅ GET /plans/:planId - Get plan details
### 2.2 Subscription Management
- ✅ GET /subscriptions/user/:userId - Get user's current subscription
- ✅ POST /subscriptions - Create a new subscription
- ✅ PUT /subscriptions/:subscriptionId - Update a subscription
- ✅ POST /subscriptions/:subscriptionId/cancel - Cancel subscription
### 2.3 Token Management
- ✅ GET /tokens/balance/:userId - Get current token balance
- ✅ POST /tokens/allocate - Allocate tokens to a user
- ✅ POST /tokens/deduct - Deduct tokens for service usage
- ✅ POST /tokens/purchase - Purchase token package
- ✅ GET /transactions/user/:userId - Get token transaction history
- ✅ GET /token-costs - Get token costs for different services
- ✅ POST /calculate-job-cost - Calculate token cost for a job
### 2.4 Payment History
- ✅ GET /payments/user/:userId - Get payment history
- ✅ GET /payments/summary/:userId - Get payment summary
### 2.5 Additional Token Endpoints
- ⏳ POST /tokens/check - Check token availability without deducting (pre-authorization, also add to the response how many of each content type the user has used and is theoretically left for usage, add renewal date)
- ⏳ GET /jobs/count/:userId/monthly - Get monthly job count for a user (for this we need to enhance the job service to track the job count per user and the user database to track the job count per user)
- ⏳ POST /api/subscription/features/check - Check if a feature is available in user's plan
- ⏳ POST /api/subscription/limits/check - Check if user has exceeded usage limits

## Phase 3: API Gateway Integration
### 3.1 API Gateway Routes
- ✅ Set up subscription routes in API Gateway
- ✅ Implement user authentication and authorization
- ✅ Configure proper forwarding to subscription service
- ✅ Add security checks for user data access

## Phase 4: Service-Level Token Deduction
### 4.1 Token Deduction in Individual Services
- ⏳ Add token cost calculation to each service (LLM, Image, Voice, etc.)
- ⏳ Implement token pre-authorization checks before operations
- ⏳ Add token deduction after successful operations
- ⏳ Ensure proper error handling for insufficient tokens
### 4.2 Job Service Integration
- ⏳ Coordinate token checks across multiple services in a job
- ⏳ Track token usage per job and service
- ⏳ Add job-level token summary
### 4.3 API Endpoint Enhancements
- ⏳ Add detailed metadata for token transactions
- ⏳ Implement batch token operations for efficiency
- ⏳ Add transaction rollback capabilities

## Phase 5: Testing with Postman
### 5.1 Postman Collection Creation
- ⏳ Create comprehensive Postman collection for all endpoints
- ⏳ Document expected responses for each endpoint
- ⏳ Set up test scripts to validate responses
### 5.2 Test User Setup
- ⏳ Create test users for each subscription tier
- ⏳ Set up authentication tokens for testing
- ⏳ Document the test user credentials and limitations
### 5.3 Automated Testing
- ⏳ Create test scripts for common workflows
- ⏳ Test token deduction across services
- ⏳ Test error handling and edge cases

## Phase 6: Plan Limitation Enforcement (1-2 weeks) [REVISED PRIORITY]
### 6.1 Feature Restriction Logic
- ⏳ Implement middleware for checking subscription features
- ⏳ Add validation for content types based on plan
- ⏳ Restrict access to premium features
### 6.2 Usage Limits
- ⏳ Implement max scenes per job validation
- ⏳ Track and enforce monthly job count limits
- ⏳ Add token balance monitoring and alerts
### 6.3 Plan-Based Configuration
- ⏳ Create a centralized plan feature configuration
- ⏳ Implement recreation feature availability based on plan
- ⏳ Set up visual/voice selection limits

## Phase 7: Stripe Integration (2-3 weeks) [DEPRIORITIZED]
### 7.1 Stripe Setup
- ⏳ Configure Stripe account settings
- ⏳ Implement comprehensive Stripe service
- ⏳ Set up webhook handler for payment events
- ⏳ Configure products and prices in Stripe to match plans
### 7.2 Payment Processing
- ⏳ Implement credit card payment processing
- ⏳ Set up PayPal integration through Stripe
- ⏳ Implement subscription creation in Stripe
- ⏳ Handle subscription lifecycle events
### 7.3 Webhook Management
- ⏳ Process webhook events from Stripe
- ⏳ Handle successful payment events
- ⏳ Process subscription lifecycle events (created, updated, canceled)
- ⏳ Handle failed payment scenarios

## Phase 8: Frontend Components (4-5 days)
### 8.1 Dashboard Integration
- ⏳ Add token balance display to dashboard
- ⏳ Create token usage visualization
- ⏳ Implement low balance warnings
### 8.2 Plan Management UI
- ⏳ Create plan selection and comparison page
- ⏳ Implement subscription management interface
- ⏳ Add plan upgrade/downgrade flow
### 8.3 Token Purchase UI
- ⏳ Create token package selection interface
- ⏳ Implement Stripe Elements for payment forms
- ⏳ Add purchase confirmation and receipt views
### 8.4 Account History
- ⏳ Create transaction history view
- ⏳ Implement payment history display
- ⏳ Add subscription history visualization

# 3. Testing Plan
## 3.1 Unit Testing
- ⏳ Test data access layers
- ⏳ Test token calculation logic
- ⏳ Test plan restriction enforcement
## 3.2 Integration Testing
- ⏳ Test service-to-service token deduction
- ⏳ Test plan limitation enforcement
- ⏳ Test subscription functionality
## 3.3 End-to-End Testing
- ⏳ Test complete content creation workflow with token deduction
- ⏳ Test different subscription tiers and limitations
- ⏳ Test token package purchases

# 4. Deployment Plan
## 4.1 Staging Deployment
- ⏳ Deploy service to staging environment
- ⏳ Test with real service integrations
- ⏳ Validate token deduction in real workflows
## 4.2 Production Preparation
- ⏳ Prepare database migration scripts
- ⏳ Configure production service endpoints
- ⏳ Set up Stripe production integration (when ready)
## 4.3 Go-Live Strategy
- ⏳ Gradual rollout to select users
- ⏳ Monitor token usage and limitations
- ⏳ Track system performance

# 5. Current Status and Revised Implementation Strategy

## 5.1 What We've Accomplished
- ✅ Service architecture: Server structure, API routes, and data access layers
- ✅ Database schema: Tables for plans, subscriptions, token packages, token transactions, and payments
- ✅ Token calculation utility for determining costs of different services
- ✅ API Gateway integration with proper user authentication
- ✅ Basic Stripe service structure with webhook handling

## 5.2 Revised Implementation Strategy

### 5.2.1 Phase 1: Token Deduction System (1-2 weeks)
- Service-Specific Token Deduction:
  - Implement token deduction points in each individual service (LLM, Image, Voice, etc.)
  - Each service will call the token deduction API when resources are consumed
  - The job service will coordinate but not handle all deductions itself

- Comprehensive Postman Testing Suite:
  - Create a detailed Postman collection for testing all subscription endpoints
  - Test each endpoint individually with various scenarios
  - Document expected responses for each endpoint

- User Simulation Framework:
  - Develop a testing approach to simulate real frontend users through API requests
  - Create test users with different subscription tiers
  - Generate auth tokens that can be used in Postman to authenticate as real users

### 5.2.2 Phase 2: Plan Limitation Enforcement (1-2 weeks)
- Feature Restriction Logic:
  - Implement middleware to check subscription plan before processing requests
  - Create configuration-based feature flags tied to subscription plans
  - Add validation logic for allowed content types, voice options, and visual styles

- Usage Limits Implementation:
  - Add validation for maximum scenes per job based on subscription tier
  - Implement monthly job count tracking and limiting
  - Create token allocation and balance monitoring

- Testing with Different User Tiers:
  - Create test users for each subscription tier (Free, Basic, Creator, Professional)
  - Document the test users and their limitations
  - Develop a comprehensive test suite to verify limitations are enforced correctly

- Performance and Error Handling:
  - Test system behavior under load
  - Ensure proper error messages are returned when limits are reached
  - Validate that error states are properly communicated to users

### 5.2.3 Phase 3: Integration Testing (1 week)
- End-to-End Testing:
  - Test complete content creation workflows with token deduction
  - Verify that plan limitations are correctly enforced
  - Test edge cases like insufficient tokens, reaching monthly limits, etc.

- Performance and Error Handling:
  - Test system behavior under load
  - Ensure proper error messages are returned when limits are reached
  - Validate that error states are properly communicated to users

### 5.2.4 Phase 4: Stripe Integration (Only after core functionality is solid)
- Payment Processing:
  - Once core token system is working properly, begin Stripe integration
  - Implement subscription creation and management
  - Add token package purchases

## 5.3 Technical Implementation Details

### 5.3.1 Service-Level Token Deduction
```javascript
// Example approach for service-level token deduction

// In each service (e.g., imageService.js)
async function generateImage(params) {
  try {
    // Step 1: Calculate token cost
    const tokenCost = 10; // Fixed cost per image
    
    // Step 2: Check if user has sufficient tokens (pre-authorization)
    const tokenCheckResponse = await axios.post(
      `${config.services.subscription.url}/tokens/check`,
      {
        userId: params.userId,
        serviceName: 'image',
        tokenAmount: tokenCost
      },
      { headers: { 'x-service-auth': process.env.SERVICE_AUTH_TOKEN } }
    );
    
    if (!tokenCheckResponse.data.hasBalance) {
      throw new Error('Insufficient token balance for this operation');
    }
    
    // Step 3: Process the actual image generation
    const result = await actualImageGenerationLogic(params);
    
    // Step 4: Deduct tokens after successful generation
    await axios.post(
      `${config.services.subscription.url}/tokens/deduct`,
      {
        userId: params.userId,
        jobId: params.jobId,
        serviceName: 'image',
        tokenAmount: tokenCost,
        metadata: {
          imageId: result.imageId,
          sceneId: params.sceneId,
          prompt: params.prompt
        }
      },
      { headers: { 'x-service-auth': process.env.SERVICE_AUTH_TOKEN } }
    );
    
    return result;
  } catch (error) {
    // Handle errors appropriately
    logger.error('Image generation failed:', error);
    throw error;
  }
}
```

### 5.3.2 Plan Limitation Middleware
```javascript
// Example middleware for checking plan limitations

async function checkPlanLimitations(req, res, next) {
  try {
    const { userId, serviceType, contentType, sceneCount } = req.body;
    
    // Get user's current subscription
    const subscriptionResponse = await axios.get(
      `${config.services.subscription.url}/subscriptions/user/${userId}`,
      { headers: { 'x-service-auth': process.env.SERVICE_AUTH_TOKEN } }
    );
    
    const subscription = subscriptionResponse.data;
    if (!subscription || !subscription.plan) {
      return res.status(403).json({
        error: 'No active subscription',
        message: 'You need an active subscription to use this feature'
      });
    }
    
    // Check scene count limit
    if (sceneCount > subscription.plan.max_scenes_per_job) {
      return res.status(403).json({
        error: 'Scene limit exceeded',
        message: `Your plan allows maximum ${subscription.plan.max_scenes_per_job} scenes per job. Please upgrade your plan for more scenes.`
      });
    }
    
    // Check if content type is allowed
    const allowedContentTypes = JSON.parse(subscription.plan.allowed_content_types);
    if (!allowedContentTypes.includes(contentType)) {
      return res.status(403).json({
        error: 'Content type not allowed',
        message: `Your current plan does not support ${contentType} content. Please upgrade to access this feature.`
      });
    }
    
    // Check monthly job count for basic plans
    if (subscription.plan.max_jobs_per_month) {
      const jobCountResponse = await axios.get(
        `${config.services.subscription.url}/jobs/count/${userId}/monthly`,
        { headers: { 'x-service-auth': process.env.SERVICE_AUTH_TOKEN } }
      );
      
      if (jobCountResponse.data.count >= subscription.plan.max_jobs_per_month) {
        return res.status(403).json({
          error: 'Monthly job limit reached',
          message: `You've reached your monthly limit of ${subscription.plan.max_jobs_per_month} jobs. Please upgrade your plan or wait until next month.`
        });
      }
    }
    
    // If all checks pass, continue
    next();
  } catch (error) {
    logger.error('Error checking plan limitations:', error);
    res.status(500).json({
      error: 'Failed to verify subscription limitations',
      details: error.message
    });
  }
}
```

### 5.3.3 Testing with Real Users via Postman
To test with real users instead of API users:

1. Create test users in Auth0:
   - One user for each subscription tier (Free, Basic, Creator, Professional)
   - Set up subscriptions for each user in the database

2. Generate user tokens:
   - Create a small utility endpoint that generates a valid user token for testing
   - This endpoint would be protected and only used in development/testing environments

3. Postman collection setup:
   - Set environment variables for each user tier
   - Store tokens as variables in the Postman environment
   - Create requests that use the appropriate user token based on the test case

# 6. Milestones and Revised Timeline
| Milestone | Deliverable | Status | Estimated Completion |
|-----------|-------------|--------|----------------------|
| Core Backend | Functioning subscription service with data access | ✅ Complete | Done |
| API Gateway Integration | Subscription routes in API gateway | ✅ Complete | Done |
| Token Deduction System | Service-level token tracking and deduction | ⏳ In Progress | 1-2 weeks |
| Postman Testing Suite | Comprehensive API testing collection | ⏳ Not Started | 2-3 weeks |
| Plan Limitation Enforcement | Feature and usage restrictions | ⏳ Not Started | 3-4 weeks |
| Stripe Integration | Payment processing (deprioritized) | ⏳ On Hold | After core functionality |
| Frontend Components | User interfaces for subscription operations | ⏳ Not Started | After core functionality |