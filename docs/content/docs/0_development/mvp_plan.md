# MVP Development Plan

## Current Status (Updated Feb 19, 2025)
- ✅ Basic authentication with Auth0 is working
  - ✅ M2M token flow implemented (Initial implementation for /job endpoint)
  - ✅ API proxy for CORS handling
  - ✅ Token verification and refresh
  - ✅ Fix user ID handling between Auth0 and database
  - ✅ Extend M2M token flow to all services
- ✅ Core AI services are implemented (LLM, Voice, Image, Animation, Video)
  - ✅ Basic job creation pipeline
  - ✅ Content generation service integration
  - ✅ Job service with metadata handling
  - ✅ Fix user ID association with jobs
- ✅ Image accessibility and error handling improved in Animation and Video services
- ✅ Job service updated with metadata-based configuration
- ✅ Landing page modernization completed
  - ✅ Modern hero section with auto-rotating carousel
  - ✅ Responsive layout and animations
  - ✅ How It Works section with process steps
  - ✅ Features section with modern grid layout and animations
  - ✅ Showcase page with real examples
  - ✅ Testimonials section with success stories
  - ⏳ Pricing Preview
  - ⏳ FAQ Section
- ✅ Features page implementation completed
  - ✅ Interactive demo components for each feature
  - ✅ Modern layout with animated transitions
  - ✅ Responsive design and animations
  - ✅ Benefits visualization for each feature
- ✅ Authentication system enhancement completed
  - ✅ Social login integration with Google
  - ✅ Debug logging system for auth flow
  - ✅ Token refresh handling
  - ✅ API proxy implementation for CORS
  - ✅ Email registration flow
  - ✅ User database schema and migrations
  - ✅ Session management with JWT
  - ✅ Role and permission system
  - ✅ Auth0 integration for social and email auth
  - ✅ Fix M2M vs user authentication handling
- ✅ Dashboard implementation completed
  - ✅ Main dashboard layout
  - ✅ Video creation navigation
  - ✅ Project/video list view (prototype)
  - ✅ Quick actions menu
- ✅ Content Creation Dashboard & Details
  - ✅ Basic job creation and processing
  - ✅ Job service integration
  - ✅ Content generation pipeline
  - ✅ Basic workbench page layout (/workbench)
  - ✅ Pagination for job listing
  - ✅ Filtering and sorting options
  - ✅ Initial job listing implementation
  - ✅ Basic routing structure
  - ✅ Fix user ID association with jobs
  - ✅ Job details page (/workbench/:jobId)
  - ✅ Content preview functionality
  - ✅ Scene transition selection
  - ✅ Content download functionality
  - ✅ Loading states and animations
  - ✅ Enhanced job status tracking
  - ✅ Download all scenes as zip file
- ✅ Video creation flow in progress
  - ✅ Basic video creation form
  - ✅ Script settings with categories
  - ✅ Visual settings with style options
  - ✅ Format selection interface
  - ✅ Visual style selection
  - ✅ Content type selection
  - ✅ Visualization type selection
  - ✅ Real-time settings summary
  - ✅ Video assembly options in job details page
  - ✅ Scene transitions with tooltips
  - ✅ Multiple aspect ratio support


## MVP Goals
1. Create usable content for marketing
2. Test the platform's core functionality
3. Improve user experience
4. Enable basic subscription/payment system

## Phase 1: Frontend Enhancement

### 1.1 Landing Page Modernization (✅ Completed)
- ✅ Modern, responsive design implemented
- ✅ Compelling hero section with auto-rotating demo carousel
- ✅ Improved navigation and CTAs
- ✅ Process section with animated steps
- ✅ Feature highlights with modern grid layout
- ✅ Showcase page with real examples
- ✅ Testimonials with success stories

### ✅ 1.2 Authentication System Enhancement (✅ Completed)
- ✅ Integrate new backend authentication endpoints
- ✅ Implement Google social login
- ✅ Add comprehensive auth debugging
- ✅ Implement token refresh mechanism
- ✅ Add API proxy for CORS handling
- ✅ Add email registration flow
- ✅ Implement database schema and migrations
- ✅ Set up session management with JWT
- ✅ Implement role and permission system
- ✅ Complete Auth0 integration

### ✅ 1.3 Dashboard Implementation (✅ Completed)
- ✅ Create main dashboard layout
- ✅ Add video creation navigation
- ✅ Add project/video list view
- ✅ Add quick actions menu
- ✅ Implement workbench layout
- ✅ Add job details view
- ✅ Implement scene transitions
- ✅ Add content preview functionality

### ✅ 1.4 Video Creation Flow (✅ Completed)
- ✅ Implement basic video creation form
- ✅ Add script settings with categorized options
  - ✅ Character perspective selection
  - ✅ Pacing structure options
  - ✅ Script tone configuration
  - ✅ Vocabulary settings
- ✅ Add visual settings
  - ✅ Visualization type selection
  - ✅ Artist style options
  - ✅ Aspect ratio configuration
  - ✅ Format selection interface
  - ✅ Visual style selection with carousel
  - ✅ Content type selection
- ✅ Add settings overview panel
  - ✅ Real-time settings summary
  - ✅ Format preview
  - ✅ Style preview
- ✅ Basic job creation and processing
  - ✅ Job service integration
  - ✅ Content generation pipeline
  - ✅ Job status tracking
  - ✅ User ID association with jobs
- ✅ Content Creation Workbench & Job Details Page
  - ✅ Overview Dashboard called Workbench for all jobs
  - ✅ Job details page with transitions
  - ✅ Loading states and animations
  - ✅ Content Workbench implementation
  - ✅ Visual content preview (job details page)
  - ✅ Enhanced / Possibility to download options (download all, download single scene)
  - ✅ Improve the grid view of the workbench (align the sizes of the grids to the images aspect ratio)
  - ✅ Video Assembly
    - ✅ Fix the backend for the video assembly and enhance the functionality so we get a final video
    - ✅ Add a working frontend for the video assembly and select options to send the correct request when pressing the data
    - ✅ Refactor the videos section to show all created videos

## Phase 2: Implement Missing Core Features

### 2.1 Payment / Billing / Subscription Integration System as a new Service (Backend)

#### 2.1.1. Subscription Service (Renamed from Billing Service)
- ✅ Create subscription service
- ✅ Rename "billing-service" to "subscription-service" for clarity
- ✅ Implement subscription service endpoints 
  - ✅ Plan Management: GET /plans, GET /plans/:planId
  - ✅ Subscription Management: GET /subscriptions/user/:userId, POST /subscriptions, PUT /subscriptions/:subscriptionId, POST /subscriptions/:subscriptionId/cancel
  - ✅ Token Management: GET /tokens/balance/:userId, POST /tokens/allocate, POST /tokens/deduct, POST /tokens/purchase, GET /transactions/user/:userId, GET /token-costs, POST /calculate-job-cost
  - ✅ Payment History: GET /payments/user/:userId, GET /payments/summary/:userId
  - ⏳ Additional Token Endpoints: POST /tokens/check (pre-authorization), GET /jobs/count/:userId/monthly
- ✅ Set up subscription service data access layers
  - ✅ Plan Data Access (plans table)
  - ✅ Subscription Data Access (user_subscriptions table)
  - ✅ Token Transaction Data Access (token_transactions table)
  - ✅ Token Package Data Access (token_packages table)
  - ✅ Token Balance Data Access (tokens table)
  - ✅ Payment Data Access (payments table)
- ✅ Implement token calculator utility
- ✅ Create service initialization logic
- ✅ Set up proper error handling and logging

#### 2.1.2. Database Schema
- ✅ Design and implement subscription plans table
- ✅ Create user_subscriptions table for tracking active subscriptions
- ✅ Implement tokens table for user token balances
- ✅ Create token_transactions table for tracking token usage
- ✅ Implement token_packages table for additional token purchases
- ✅ Create payments table for tracking payment history

#### 2.1.3. API Gateway Routes
- ✅ Create subscription routes in API Gateway
- ✅ Implement authentication middleware for subscription routes
- ✅ Set up proper forwarding to subscription service
- ✅ Add logging for subscription-related requests

#### 2.1.4. Enhance structure of the backend
- ✅ Create a new folder called "services" and move all the services into it
- ✅ Create a new folder called "utils" and move all the utils into it
- ✅ Create a new folder called "config" and move all the config into it
- ✅ Create a new folder called "tests" and move all the tests into it

### 2.2. Backend API Endpoints for Token and Billing Management

#### 2.2.1. Plan Management Endpoints
- ✅ GET /api/subscription/plans - Get available subscription plans
- ✅ GET /api/subscription/plans/:planId - Get details of a specific plan
- ✅ POST /api/subscription/plans/add - Add a new subscription plan

#### 2.2.2. Subscription Management Endpoints
- ✅ GET /api/subscription/plans - Get available subscription plans
- ✅ GET /api/subscription/plans/:planId - Get details of a specific plan
- ✅ GET /api/subscription/subscriptions/user/:userId - Get user's active subscription
- ✅ POST /api/subscription/subscriptions - Downgrade or Upgrade a subscription for a user / Create a new subscription for a user -> Direct Integration of Stripe is needed depending on the use case
- ✅ PUT /api/subscription/subscriptions/:subscriptionId - Update a subscription
- ✅ POST /api/subscription/subscriptions/:subscriptionId/cancel - Cancel a subscription
- ✅ POST /api/subscription/subscriptions/::userId/renew - Renew a subscription (update current periods start and end date and allocate new tokens)

#### 2.2.1. Token Management Endpoints
- ✅ GET /api/subscription/tokens/balance/:userId - Get user's current token balance
- ✅ POST /api/subscription/tokens/allocate - Allocate new tokens to a user (different use cases e.g. initial allocation for plan, allocation for token package purchase, allocation for renewal of billing period)
- ✅ POST /api/subscription/tokens/deduct - Deduct tokens for service usage

#### 2.2.2. Transaction Endpoints
- ✅ POST /api/subscription/transactions/calculate-job-cost - Calculate token cost for a job (based on scene amount and selected options)
- ✅ GET /api/subscription/token-costs - Get token costs for various service usage (LLM, Image, Voice, Animation, Video, Assembly)
- ✅ GET /api/subscription/transactions/user/:userId - Get complete token transaction history

#### 2.2.3. Token Package Endpoints
- ✅ POST /api/subscription/token-packages/buy - Buy a token package (creates a new payment entry in status paid and loads up the tokens to the user's balance) -> Direct Integration of Stripe is needed
- ✅ GET /api/subscription/token-packages - Get all token packages
- ✅ GET /api/subscription/token-packages/:packageId - Get details of a specific token package
- ✅ POST /api/subscription/token-packages - Create a new token package

#### 2.2.4. Payment Management Endpoints
- ✅ GET /api/subscription/payments/user/:userId - Get user's payment history
- ✅ GET /api/subscription/payments/summary/:userId - Get summary of user's payments
- ✅ POST /api/subscription/payments - Create a new payment for a new billing period after the current billing ended in status open for subscription payment renewal -> Used for the batch job of the payment collection
- ✅ POST /api/subscription/payments/update - Update a payment with status property and payment id (open -> completed for a payment with payment provider and external payment id) after the payment is completed



### 2.3. Batch Processing Integration
#### 2.3.0. Batch Processing for Payment Management
- ✅ Implement batch processing for creation of recurring payments
- ✅ Implement batch processing for collection of recurring payments
- ✅ Implement batch processing for retry failed payments

#### 2.3.1. Batch Processing for Subscription Management
- ✅ Implement batch processing for plan downgrades / pending cancellations
- ✅ Implement batch processing for subscription renewals (token addition)

#### 2.3.2 Add missing endpoints for batch processing
- ✅ Add missing endpoints for batch processing in the subscription service
  - ✅ TESTING NEEDED GET /api/subscription/subscriptions/pending-cancellations -> Get subscriptions to cancel
  - ✅ TESTING NEEDED GET /api/subscription/subscriptions/renewal -> Get subscriptions to renew -> New token allocation
- ✅ Add missing endpoints for batch processing in the payment service
  - ✅ GET /api/subscription/payments/renewal -> Get payments to renew
  - ✅ GET /api/subscription/payments/collect -> Get payments to collect
  - ✅ POST /api/subscription/payments/:paymentId/collect -> Collect a payment
  - ✅ TESTING NEEDED GET /api/subscription/payments/failed -> Get failed payments
  - ✅ TESTING NEEDED POST /api/subscription/payments/:paymentId/retry -> Retry a payment

#### 2.3.3 Add missing endpoints for batch processing in the admin service
- ✅ Add missing endpoints for batch processing in the admin service
  - ✅ POST /api/admin/batches/run/create-payments -> Create payments batch (in status open)
  - ✅ POST /api/admin/batches/run/collect-payments -> Collect payments batch (collect all payments in status open)
  - ✅ TESTING NEEDED POST /api/admin/batches/run/retry-failed-payments -> Retry failed payments batch (for payments with status failed)
  - ✅ TESTING NEEDED POST /api/admin/batches/run/process-pending-cancellations -> Process pending cancellations batch (cancel all subscriptions in status pending-cancellation)
  - ✅ TESTING NEEDED POST /api/admin/batches/run/process-renewals -> Process renewals batch (renew all subscriptions in status active and allocate new tokens)

### 2.4 Prelaunch Page Creation and Release

#### 2.4.1 Prelaunch Page Creation
- ⏳ Create a prelaunch marketing page
  - ⏳ Interface to join the waitlist
  - ⏳ Integrate beehive (email newsletter system)
  - ⏳ Disable registration and login for the prelaunch
  - ⏳ Remove routes to other pages (to only have a plain marketing page) // How is it currently done?
  - ✅ Add Imprint, Privacy Policy and Cookie Policy (done on the develop branch)
  - ✅ Contact Form (done on the develop, but white mode is not working yet)

#### 2.4.2 Prelaunch Page Release
- ⏳ Release the prelaunch page

### 2.5. Stripe Integration
- ⏳ Configure Stripe products and prices to match plans
- ⏳ Implement credit card and paypal payment processing
- ⏳ Set up subscription creation in Stripe
- ⏳ Handle subscription lifecycle events via webhooks
- ⏳ Add token package purchases

### 2.6. Service-Level Token Deduction
- ⏳ Implement token deduction in each individual service (LLM, Image, Voice, etc.)
- ⏳ Add token cost calculation per service
- ⏳ Create token pre-authorization checks (without deducting)
- ⏳ Implement proper error handling for insufficient tokens
- ⏳ Add detailed metadata for token transactions

### 2.7. Plan Limitation Enforcement
- ⏳ Create middleware for checking subscription features
- ⏳ Implement validation for limitations based on plan
- ⏳ Add restriction logic for premium features
- ⏳ Create validation for max scenes per job logic
- ⏳ Implement monthly job count tracking and limits (counter for every job)

#### 2.7.1. Plan Limitation APIs
- ⏳ POST /api/subscription/limitations/calculate-job-cost - Enhance existing endpoint. Check if user has sufficient tokens before deducting. Up to now only gives the cost of the job, but does not check if the user has sufficient tokens.
- ⏳ POST /api/subscription/limitations/usage - 
-> Check if a feature is available in user's plan (content type is allowed, max scenes) 
  --> If not backend validation and frontend different render behaviour (e.g. disable button, show a message, etc.). Max scenes, content type limitation 
-> Check if a job counter has reached the limit defined in the plan

#### 2.7.2 Frontend Limitation Check
- ⏳ Check configuration of the options in the json files for each option (planId) -> Render different feedback and disable options if the user has not the permission to use them
-> Duration / max scenes
-> Visual Selection
-> Voice Selection
-> Assembly Templates Selection

### 2.8. Frontend Dashboard Pages for Subscription and Tokens

#### 2.8.1. Subscription Management UI
- ⏳ Create subscription plan comparison page
- ⏳ Implement subscription management interface
- ⏳ Add plan upgrade/downgrade flow
- ⏳ Create payment method management screen

#### 2.7.2. Token Management UI
- ⏳ Add token balance display to dashboard
- ⏳ Create token usage history visualization
- ⏳ Implement token package purchase interface
- ⏳ Add low balance warnings and notifications

#### 2.7.3. User Account Pages
- ⏳ Create payment history and receipts view
- ⏳ Implement subscription detail page
- ⏳ Add token transaction history page
- ⏳ Create billing information management page

## Phase 3: Finalize static frontend pages

  ### 3.1 Dedicated Pages (⏳ In Progress)
- ⏳ Update Features Page with current content creation flow
- ⏳ FAQ Section
- ⏳ Blog Entries
- ⏳ Refactor the features marketing page
- ⏳ Update Login Page (currently inconsistent look)

## Phase 5: Integrate web server (nginx) and containerization (docker) (if necessary for the first deployment)

### 5.1. Integrate nginx as a reverse proxy
- ⏳ Integrate nginx as a reverse proxy for the backend services
- ⏳ Configure nginx for SSL termination
- ⏳ Configure nginx for rate limiting
- ⏳ Configure nginx for logging
- ⏳ Configure nginx for proper error handling
- ⏳ Configure nginx for proper redirects
- ⏳ Configure nginx for proper caching

### 4.2. Containerize the application
- ⏳ Containerize the application
- ⏳ Configure docker-compose for the application
- ⏳ Configure docker-compose for the nginx container
- ⏳ Configure docker-compose for the database container
- ⏳ Configure docker-compose for the redis container

## Phase 6: Deployment to staging environment
- ⏳ Deploy the application to the staging environment
- ⏳ Testing the production application in staging environment

## Phase 7: Fix known bugs and security issues

### 7.0. Fix known tasks and bugs we have tickets for
- [ ] https://aiservice-hub.atlassian.net/browse/SVCC-27 - Implement One-Time Token Approach for Secure Credential Transmission
- [ ] https://aiservice-hub.atlassian.net/browse/SVCC-28 - Fix Google Social Login Flow and Error Handling

### 7.1. Fix known bugs
- [ ] Fix the refresh of the links to the files from the s3 bucket cloud. Right now the won´t be visible anymore after 30mins on the dashboard
- [ ] Job Service with Animation is sometimes not working and gives an error (I think depends on the template of animation)

### 4.2. Security issues
- [ ] Fix the encryption of password and username from the frontend (currently it is visible in the network tab of the browser)

## Phase 8: Testing & Refinement
- User authentication
- Video Service testing
- User flow testing
- Bug fixing
- Performance optimization
- Documentation updates

## Phase 9: Deployment of version 0.1.0 to production environment
- Deploy to Staging environment
- Test the deployment on the staging environment
- Deploy to Production environment

## Phase 10: Post-MVP Enhancements (Create tickets on Jira for the following enhancements)

### 10.1. Important and Critical Enhancements
- [ ] Music Generation with lyrics
- [ ] Find a way to align voice length with video scene length
- [ ] Select Option for Video Duration is not working well
- [ ] Improve the loading feedback after job execution

### 10.2. Feature, Profile and Protected Routes Enhancements
#### 10.2.1 Profile Management (Frontend?)
- [ ] Add progress visualization (after execution of a job)

#### 9.2.2 High Priority Enhancements Content Creation to Video Features (Frontend)
- [ ] Add possibility to recreate every part of the video (music, voice, images, etc.) (Phase after deployment of version 0.1.0) with new input
- [ ] Integrate a connection to Social Media Platforms to directly post the video (e.g. Twitter, Instagram, TikTok, etc.) (Phase after deployment of version 0.1.0)

#### 9.2.3 Video Assembly Enhancements (Frontend)
- [ ] Add more video assembly options in the Content Overview page

#### 9.2.4 Functionality Enhancements Content Creation to Video Features (Frontend)
- [ ] Add possibility to manually upload images and videos for scenes before the assembly (Phase after deployment of version 0.1.0) -> To exchange or add add content from a single scene

#### 10.2.5 Functionality Enhancements Video Creation Flow (Frontend)
- [ ] Add possibility to reload input from a previous job (from the parameters object in the metadata column of the jobs table)

### 10.3. Profile Management Enhancements
#### 10.3.1 Profile Management (Frontend?)
- [ ] Add profile editing functionality
- [ ] Update name/display name
- [ ] Change profile picture
- [ ] Manage notification preferences
- [ ] Configure video preferences (default style, voice, resolution)

#### 10.3.2 Profile Management (Backend)
- [ ] Implement user settings API endpoints
- [ ] POST /api/auth/profile/update - Update profile information
- [ ] POST /api/auth/preferences/update - Update user preferences
- [ ] POST /api/auth/notifications/update - Update notification settings
- [ ] Create profile settings UI

- [ ] Profile settings page (/dashboard/settings/profile)
- [ ] Preferences management page (/dashboard/settings/preferences)
- [ ] Add form validation and error handling
- [ ] Implement optimistic updates for better UX

#### 10.3.3 Protected Routes Enhancement
- [ ] Implement role-based access control (RBAC)
  - [ ] Define user roles (free, premium, admin)
  - [ ] Add role-based route protection
  - [ ] Implement subscription status checks
- [ ] Add route guards for premium features
  - [ ] Advanced video creation
  - [ ] Analytics dashboard
  - [ ] API access

### 10.3 Authentication Flow Improvement
- [ ] Improve authentication flow
- [ ] Better token refresh handling
- [ ] Loading states during auth checks
- [ ] Proper redirects for unauthenticated users

### 10.4 Enhance error handling and feedback
- [ ] Show upgrade prompts for premium features
- [ ] Display proper unauthorized access messages
- [ ] Handle expired subscriptions

### 10.5 Advanced Progress Tracking System
- [ ] Use Redis for real-time progress updates
- [ ] Track individual service progress (LLM, Image, Voice, Video, Music)
- [ ] Track scene-level progress for multi-scene videos
- [ ] Implement WebSocket endpoints for real-time frontend updates
- [ ] Add estimated time remaining based on historical data
- [ ] Support progress visualization in the frontend dashboard
- [ ] Enable progress notifications (email, in-app)

### 10.6 Optimize service startup process:
- [ ] Reduce redundant logging
- [ ] Centralize common initialization
- [ ] Improve configuration loading
- [ ] Streamline service bootstrapping

## Success Criteria for MVP
1. Users can create videos end-to-end
2. Modern, intuitive interface
3. Basic subscription system works
4. Videos can be managed and exported
5. Platform is stable for basic usage

## Next Steps After MVP
1. Advanced customization features
2. Team collaboration features
3. Advanced analytics
4. Additional export options
5. Enhanced video editing capabilities

This MVP plan focuses on making the platform usable for content creation and testing, while setting up basic monetization. The timeline is approximately 6-8 weeks total. 

