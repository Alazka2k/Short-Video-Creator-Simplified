# MVP Development Plan

## Current Status (Updated Jan 11, 2025)
- ✅ Basic authentication with Auth0 is working
- ✅ Core AI services are implemented (LLM, Voice, Image, Animation, Video)
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
- ✅ Dashboard implementation completed
  - ✅ Main dashboard layout
  - ✅ Video creation navigation
  - ✅ Project/video list view (prototype)
  - ✅ Quick actions menu
- ⏳ Video creation flow in progress
  - ✅ Basic video creation form
  - ✅ Script settings with categories
  - ✅ Visual settings with style options

  - ⏳ Settings overview panel
  - ⏳ Progress visualization
  - ⏳ Video assembly options

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

### 1.2 Dedicated Pages (⏳ In Progress)
- ✅ Dedicated Features Page with interactive demos
- ⏳ Pricing preview
- ⏳ FAQ Section
- ⏳ Some Blog Entries (Development of Alpha Version?)
- ⏳ Link documentation page to http://localhost:4000/docs?
- ⏳ Contact
- ⏳ Privacy Policy
- ⏳ Terms of Service
- ⏳ About
- ⏳ Remove "Careers" from the footer

### ✅ 1.3 Authentication System Enhancement
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

### ✅ 1.4 Dashboard Implementation
- ✅ Create main dashboard layout
- ✅ Add a button for the user to go to the video creation page
- ✅ Add project/video list view (dummy)
- ✅ Add quick actions menu for Quick Creation and Advanced Creation

### ⏳ 1.5 Video Creation Flow
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
- ⏳ Implement settings overview panel
- ⏳ Improve the interface for script settings
- ⏳ Improve Visual Settings interface
- ⏳ Add progress visualization
- ⏳ Add video assembly options
- ⏳ Enable direct job and assembly service execution
- ⏳ Add video download functionality

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

### 2.2 Video Assembly (Backend)
- Improve the final video assembly service with enhanced variables (depending on json2Video)

### 2.3 Video and Project Management Enhancements

#### 2.3.1 Video Management (Backend)
- [ ] GET /api/videos - Fetch video list with pagination and filters
- [ ] GET /api/videos/:id - Get single video details
- [ ] DELETE /api/videos/:id - Delete a video
- [ ] POST /api/videos/:id - Update video metadata

#### 2.3.2 Project Management (Backend)
- [ ] GET /api/projects - Fetch project list with pagination and filters
- [ ] GET /api/projects/:id - Get single project details
- [ ] POST /api/projects - Create new project
- [ ] POST /api/projects/:id - Update project
- [ ] DELETE /api/projects/:id - Delete project

#### 2.3.3. Frontend Enhancements of "My Videos" and "Projects" with new API endpoints (Frontend)
- [ ] Connect and add backend implementation for "Projects" view
- [ ] Connect and add backend implementation for "My videos" view

#### 2.3.4. Video Assembly Enhancements (Frontend)
- [ ] Add video assembly options
- [ ] Add progress visualization
- [ ] Add video download functionality


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

### 5.1. Feature, Profile and Protected Routes Enhancements
- [ ] Add possibility to recreate every part of the video (music, voice, images, etc.) (Phase after deployment of version 0.1.0)
- [ ] Add possibility to manually upload images and videos for scenes before the assembly (Phase after deployment of version 0.1.0) -> To exchange or add add content from a single scene
- [ ] Integrate a connection to Social Media Platforms to directly post the video (e.g. Twitter, Instagram, TikTok, etc.) (Phase after deployment of version 0.1.0)
- [ ] Add possibility to reload input from a previous job (from the parameters object in the metadata column of the jobs table)

#### 5.1.1 Profile Management (Frontend?)
- [ ] Add profile editing functionality
- [ ] Update name/display name
- [ ] Change profile picture
- [ ] Manage notification preferences
- [ ] Configure video preferences (default style, voice, resolution)

#### 5.1.2 Profile Management (Backend)
- [ ] Implement user settings API endpoints
- [ ] POST /api/auth/profile/update - Update profile information
- [ ] POST /api/auth/preferences/update - Update user preferences
- [ ] POST /api/auth/notifications/update - Update notification settings
- [ ] Create profile settings UI
- [ ] Profile settings page (/dashboard/settings/profile)
- [ ] Preferences management page (/dashboard/settings/preferences)
- [ ] Add form validation and error handling
- [ ] Implement optimistic updates for better UX

#### 5.1.3 Protected Routes Enhancement
- [ ] Implement role-based access control (RBAC)
  - [ ] Define user roles (free, premium, admin)
  - [ ] Add role-based route protection
  - [ ] Implement subscription status checks
- [ ] Add route guards for premium features
  - [ ] Advanced video creation
  - [ ] Analytics dashboard
  - [ ] API access

### 5.2 Authentication Flow Improvement
- [ ] Improve authentication flow
- [ ] Better token refresh handling
- [ ] Loading states during auth checks
- [ ] Proper redirects for unauthenticated users

### 5.3 Enhance error handling and feedback
- [ ] Show upgrade prompts for premium features
- [ ] Display proper unauthorized access messages
- [ ] Handle expired subscriptions

### 5.4 Advanced Progress Tracking System
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

