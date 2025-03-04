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
- ⏳ Content Creation Dashboard & Details
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
- ⏳ Video creation flow in progress
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

### ⏳ 1.4 Video Creation Flow (⏳ In Progress)
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
  - ⏳ Video Assembly
    - ✅ Fix the backend for the video assembly and enhance the functionality so we get a final video
    - ⏳ Add a working frontend for the video assembly and select options to send the correct request when pressing the data
    - ⏳ Refactor the videos section to show all created videos

  ### 1.5 Dedicated Pages (⏳ In Progress)
- ✅ Dedicated Features Page with interactive demos
- ⏳ Refactor the Dashboard page
- ⏳ FAQ Section
- ⏳ Blog Entries
- ⏳ Contact
- ⏳ Privacy Policy
- ⏳ Terms of Service
- ⏳ About
- ⏳ Remove "Careers" from the footer
- ⏳ Settings page
  - ⏳ Settings for social media channels
  - ⏳ Settings for the video preferences (e.g. default style, voice, resolution)
- ⏳ Refactor the features marketing page


## Phase 2: Implement Missing Core Features

### 2.1 Payment / Billing / Subscription Integration System as a new Service (Backend)
- Implement Stripe integration
- Create simple pricing plans with different features (e.g. number of videos, number of characters, number of scenes, etc.) and tokens (each subscription plan has a different number of tokens), each service has a different token consumption (e.g. image generation has a higher token consumption than voice generation, complete video generation has a higher token consumption than image generation) -> Calculation needs to be done for each service beforehand
- Integrate additional token purchase options (e.g. 1000 tokens for $10, 5000 tokens for $50, 10000 tokens for $100, etc., exact pricing needs to be defined)
- Add subscription management and add / integrate the different subscription roles to the users
- Setup usage tracking
- Implement basic billing

#### 2.1.1 Token & Billing System Backend
- [ ] GET /api/billing/usage - Get token usage statistics
- [ ] GET /api/billing/plans - Get available billing plans
- [ ] GET /api/billing/transactions - Get transaction history
- [ ] POST /api/billing/subscribe - Subscribe to a plan
- [ ] POST /api/billing/purchase - Purchase tokens
- [ ] POST /api/billing/change - Change subscription plan
- [ ] POST /api/billing/cancel - Cancel subscription
- [ ] GET /api/billing/history - Get billing history

#### 2.1.2 Token & Billing System Frontend
- [ ] Enhance the /dashboard/subscription page with the new API endpoints and integrate them
- [ ] Add a new page for the pricing plans

### 2.2 Video Assembly (Backend)
- Improve the final video assembly service with enhanced variables (depending on json2Video)

### 2.3 Video and Project Management Enhancements

#### 2.3.1 Video Management (Backend)
- [ ] GET /api/videos - Fetch video list with pagination and filters

#### 2.3.2. Frontend Enhancements of "My Videos" with new API endpoints (Frontend)
- [ ] Connect and add backend implementation for "My videos" view

#### 2.3.3. Video Assembly Enhancements (Frontend)
- [ ] Add video download functionality

#### 2.3.4. Video Dashboard Enhancements (Frontend)
- [ ] Update the Dashboard with the latest status

## Phase 3: Fix known bugs and security issues

### 3.1. Fix known bugs
- [ ] Fix the social login which is not working right now
- [ ] Fix the refresh of the links to the files from the s3 bucket cloud. Right now the won´t be visible anymore after 30mins on the dashboard
- [ ] Job Service with Animation is not working and gives an error

### 3.2. Security issues
- [ ] Fix the encryption of password and username from the frontend (currently it is visible in the network tab of the browser)

## Phase 3: Testing & Refinement
- User authentication
- Video Service testing
- User flow testing
- Bug fixing
- Performance optimization
- Documentation updates

## Phase 4: Deployment of version 0.1.0
- Deploy to Staging environment
- Test the deployment on the staging environment
- Deploy to Production environment

## Phase 5: Post-MVP Enhancements

### 5.1. Important and Critical Enhancements
- [ ] Music Generation with lyrics
- [ ] Find a way to align voice length with video scene length
- [ ] Select Option for Video Duration is not working well
- [ ] Improve the loading feedback after job execution

### 5.2. Feature, Profile and Protected Routes Enhancements
#### 5.2.1 Profile Management (Frontend?)
- [ ] Add progress visualization (after execution of a job)

#### 5.2.2 High Priority Enhancements Content Creation to Video Features (Frontend)
- [ ] Add possibility to recreate every part of the video (music, voice, images, etc.) (Phase after deployment of version 0.1.0) with new input
- [ ] Integrate a connection to Social Media Platforms to directly post the video (e.g. Twitter, Instagram, TikTok, etc.) (Phase after deployment of version 0.1.0)

#### 5.2.3 Video Assembly Enhancements (Frontend)
- [ ] Add more video assembly options in the Content Overview page

#### 5.2.4 Functionality Enhancements Content Creation to Video Features (Frontend)
- [ ] Add possibility to manually upload images and videos for scenes before the assembly (Phase after deployment of version 0.1.0) -> To exchange or add add content from a single scene

#### 5.2.5 Functionality Enhancements Video Creation Flow (Frontend)
- [ ] Add possibility to reload input from a previous job (from the parameters object in the metadata column of the jobs table)

### 5.3. Profile Management Enhancements
#### 5.3.1 Profile Management (Frontend?)
- [ ] Add profile editing functionality
- [ ] Update name/display name
- [ ] Change profile picture
- [ ] Manage notification preferences
- [ ] Configure video preferences (default style, voice, resolution)

#### 5.2.2 Profile Management (Backend)
- [ ] Implement user settings API endpoints
- [ ] POST /api/auth/profile/update - Update profile information
- [ ] POST /api/auth/preferences/update - Update user preferences
- [ ] POST /api/auth/notifications/update - Update notification settings
- [ ] Create profile settings UI

- [ ] Profile settings page (/dashboard/settings/profile)
- [ ] Preferences management page (/dashboard/settings/preferences)
- [ ] Add form validation and error handling
- [ ] Implement optimistic updates for better UX

#### 5.2.3 Protected Routes Enhancement
- [ ] Implement role-based access control (RBAC)
  - [ ] Define user roles (free, premium, admin)
  - [ ] Add role-based route protection
  - [ ] Implement subscription status checks
- [ ] Add route guards for premium features
  - [ ] Advanced video creation
  - [ ] Analytics dashboard
  - [ ] API access

### 5.3 Authentication Flow Improvement
- [ ] Improve authentication flow
- [ ] Better token refresh handling
- [ ] Loading states during auth checks
- [ ] Proper redirects for unauthenticated users


### 5.4 Enhance error handling and feedback
- [ ] Show upgrade prompts for premium features
- [ ] Display proper unauthorized access messages
- [ ] Handle expired subscriptions

### 5.5 Advanced Progress Tracking System
- [ ] Use Redis for real-time progress updates
- [ ] Track individual service progress (LLM, Image, Voice, Video, Music)
- [ ] Track scene-level progress for multi-scene videos
- [ ] Implement WebSocket endpoints for real-time frontend updates
- [ ] Add estimated time remaining based on historical data
- [ ] Support progress visualization in the frontend dashboard
- [ ] Enable progress notifications (email, in-app)

### 5.5 Optimize service startup process:
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

