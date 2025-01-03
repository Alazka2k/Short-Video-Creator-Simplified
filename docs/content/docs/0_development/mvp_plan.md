# MVP Development Plan

## Current Status
- Basic authentication with Auth0 is working
- Core AI services are implemented (LLM, Voice, Image, Animation, Video)
- Basic landing page exists but needs improvement
- Dashboard is missing
- Video creation flow needs improvement

## MVP Goals
1. Create usable content for marketing
2. Test the platform's core functionality
3. Improve user experience
4. Enable basic subscription/payment system

## Phase 1: Frontend Enhancement

### 1.1 Landing Page Modernization
- Implement modern, responsive design
- Add compelling hero section
- Include feature highlights
- Add testimonials/demo section
- Improve navigation and CTAs

### 1.2 Dashboard Implementation
- Create main dashboard layout
- Add a button for the user to go to the video creation page
- Add project/video list view
- Add quick actions menu
- Include recent activities section

### 1.3 Video Creation Flow
- Streamline input form (based on API request schema for Job endpoint)
- Add possibility to reload input from a previous job (from the parameters object in the metadata column of the jobs table)
- Add progress visualization (can be a simple progress bar for every scene and the music generation (usually music generation is the longest part))
- Add basic customization options (for the assembly service of the video - e.g. cutting)
- Add possibility to run a job and afterwards directly and automatically the assembly service (for the option the assembly parameters need to be input in the request)
- Add a possibility to download the video

## Phase 2: Core Features

### 2.1 Video Management
- Project organization
- Video status tracking
- Basic editing capabilities
- Download/export options
- Video preview player

### 2.2 User Settings
- Profile management
- Notification preferences
- Usage statistics

## Phase 3: Payment / Billing / Subscription Integration

### 3.1 Basic Subscription System
- Implement Stripe integration
- Create simple pricing plans with different features (e.g. number of videos, number of characters, number of scenes, etc.) and tokens (each subscription plan has a different number of tokens), each service has a different token consumption (e.g. image generation has a higher token consumption than voice generation, complete video generation has a higher token consumption than image generation) -> Calculation needs to be done for each service beforehand
- Integrate additional token purchase options (e.g. 1000 tokens for $10, 5000 tokens for $50, 10000 tokens for $100, etc., exact pricing needs to be defined)
- Add subscription management and add / integrate the different subscription roles to the users
- Setup usage tracking
- Implement basic billing

## Phase 4: Testing & Refinement
- User flow testing
- Bug fixing
- Performance optimization
- Documentation updates

## Phase 5: Deployment of version 0.1.0
- Deploy to Staging environment
- Test the deployment on the staging environment
- Deploy to Production environment

## Phase 6: Post-MVP Enhancements
- Implement basic analytics (videos created, usage)
- Add possibility to manually upload images and videos for scenes before the assembly (Phase after deployment of version 0.1.0)
- Add possibility to recreate every part of the video (music, voice, images, etc.) (Phase after deployment of version 0.1.0)
- Integrate a connection to Social Media Platforms to directly post the video (e.g. Twitter, Instagram, TikTok, etc.) (Phase after deployment of version 0.1.0)

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