# Prelaunch Page Implementation Plan

## 1. Overall Strategy and Goals

### Prelaunch Phase
- Launch a minimalist landing page focused on generating leads and building early customer interest
- Prevent access to full product features (login, registration, dashboard, etc.) during this phase
- Integrate Beehiiv's newsletter embed code as the primary call-to-action (CTA)

### Legal and Compliance Requirements
- Provide static legal pages (Impressum, Privacy Policy, Cookie Settings) that are mandatory in target regions
- Ensure these pages are accessible throughout the entire application for compliance

### Transition/Later Phase
- ⏳ Initially deploy the prelaunch page on Vercel for quick iteration and ease of updates
- ⏳ Later, migrate the full SaaS product to AWS
- ⏳ Add Google Analytics 4 to the full application

## 2. Branching Strategy and Code Adjustments

### 2.1 Develop Legal Pages in the Main (Develop) Branch
**Create Legal Pages:** ✅ Completed
- ✅ Build pages such as 
    - ✅ `/src/app/(legal)/imprint/page.tsx`: Required by German law (Telemediengesetz)
    - ✅ `/src/app/(legal)/privacy-policy/page.tsx`: Required by GDPR
    - ✅ `/src/app/(legal)/cookie-policy/page.tsx`: Cookie Policy
    - ✅ `/src/app/(legal)/terms-of-service/page.tsx`: Terms of Service
- ✅ Integrate these pages into the global footer or navigation

### 2.2. Implement cookie and analytics feature and cookie consent
**Implement Cookie and Analytics Feature:** 🔄 In Progress
- 🔄 Implement a GDPR/ePrivacy compliant cookie consent mechanism
  - ⏳ Use a lightweight library like react-cookie-consent
  - ⏳ Implement Consent Banner/Modal with our own design

**Enable Vercel Analytics:** ✅ Completed
- ✅ Configured Vercel Analytics in next.config.js with 'consent' mode
- ✅ Analytics will only be collected from users who explicitly consent

**Integration of Vercel Analytics:** ✅ Completed
Cookie Policy & Privacy Policy Update:

- Vercel Analytics is now properly configured to respect user consent choices.
- Key implementation details:
  - Set up in next.config.js with `mode: 'consent'`
  - Only collects data when users click "Accept All" in the cookie banner
  - Does not collect data when users select "Accept Only Essential"
  - Uses localStorage to track consent status

In your Privacy Policy and Cookie Policy, you should:
- Describe that you use Vercel Analytics.
- What data it collects (page URL, referrer, browser/OS type, country - anonymized).
- The purpose (website traffic analysis, performance monitoring).
- That it's provided by Vercel Inc.
- Link to Vercel's privacy policy.
- Clearly state that it only operates when users have provided explicit consent.

The cookie consent banner now properly controls the Vercel Analytics functionality, ensuring full GDPR compliance.

### 2.2.1. Vercel Dashboard Configuration for Analytics

To enable and monitor analytics in the Vercel dashboard:

1. **Enable Web Analytics in Vercel Dashboard**:
   - Log in to your Vercel dashboard
   - Select your project
   - Go to "Analytics" tab in the left sidebar
   - Click "Enable Analytics" if not already enabled
   - Ensure "Web Analytics" is turned on

2. **Verify Consent Mode Implementation**:
   - Vercel automatically detects your consent configuration from next.config.js
   - No additional setup is needed in the dashboard for consent settings
   - The platform respects the 'consent' mode setting we've configured

3. **Test Analytics Collection**:
   - Deploy your site with the updated configuration
   - Visit your site in incognito/private browsing mode
   - Accept cookies by clicking "Accept All" in the banner
   - Perform some navigation actions
   - Check the Analytics dashboard to verify data is being collected

4. **View Analytics Data**:
   - After collecting some data, you'll see:
     - Page views
     - Visitors
     - Countries
     - Device types
     - Referrers
   - These metrics will only include users who explicitly consented

5. **Troubleshooting**:
   - If no data appears, use browser developer tools to:
     - Check that localStorage has a `cookie-consent-analytics=true` entry after clicking "Accept All"
     - Verify the Vercel Analytics script is loading in the Network tab
     - Ensure there are no console errors related to analytics

Note: After deployment, analytics data will take some time (usually a few hours) to appear in the dashboard.

### 2.3 Create a Dedicated Prelaunch Branch
**Branch Creation:** ⏳ Not Started
- ⏳ Create a prelaunch branch to isolate changes related to the prelaunch messaging and access restrictions
- ⏳ Use git command: `git checkout -b feature/prelaunch-page`

**Purpose of the Prelaunch Branch:** ⏳ Not Started
- ⏳ Customize the landing page exclusively for prelaunch
- ⏳ Remove access to unfinished app sections

### 2.4 Update the Marketing Landing Page
**Based on Your Existing Page (page.tsx):** ⏳ Not Started
- ⏳ Update the content to focus on prelaunch messaging
- ⏳ Temporarily disable or hide links to authentication routes -> login-form (/login), register-form (/signup)

## 3. Beehiiv Integration

**Using the Embed Code:** ⏳ Not Started
- ⏳ Retrieve the HTML embed code for the Beehiiv newsletter form
- ⏳ Integrate the embed code into a prominent section of the landing page

**Future Flexibility:**
- The embed code approach is lightweight and can be easily removed or replaced with a custom API integration later when your full SaaS product is ready

## 4. Deployment on Vercel for the Prelaunch Phase

### 4.1 Prelaunch Deployment Process
**Deploying the Prelaunch Branch:** ⏳ Not Started
- ⏳ Configure Vercel to deploy the `feature/prelaunch-page` branch

**Key Configurations:** ⏳ Not Started
- ⏳ Ensure that only the prelaunch landing page with legal pages is accessible
- ⏳ Verify no active links to protected routes
- ⏳ Confirm Beehiiv integration works properly

### 4.2 Testing Prior to Going Live ⏳ Not Started
Thoroughly test the following:
- ⏳ Functionality of the Beehiiv form
- ⏳ Accessibility and correctness of the legal pages
- ⏳ Redirect or message for protected areas

## 5. Later Migration or Parallel Hosting on AWS

### Approach: Separate Environments
**Keep the Landing Page on Vercel:**
- Continue updating and hosting your marketing/prelaunch landing page on Vercel, where changes can be rolled out quickly

**Deploy the Full SaaS on AWS:**
- Host your complete application (including authentication, dashboard, and other full features) on AWS using your preferred services (e.g., S3/CloudFront for static assets, EC2/ECS, or Amplify for dynamic content)
- Use a subdomain such as app.yourdomain.com for the SaaS app

## 6. Summary of Current Status

### Completed (✅)
- Legal pages have been created and integrated (Imprint, Privacy Policy, Cookie Policy)
- Content for legal pages is in place and accessible
- Privacy/Cookie policies include references to Vercel Analytics
- Vercel Analytics configured to respect user consent ('consent' mode)

### In Progress (🔄)
- Cookie consent mechanism implementation (banner UI is in place but may need refinement)

### Not Started (⏳)
- Beehiiv newsletter integration 
- Dedicated prelaunch branch creation
- Landing page update for prelaunch messaging
- Deployment configuration on Vercel
- Testing prior to going live
- Migration planning for AWS

## 7. Next Steps
1. Finalize the cookie consent banner UI/UX
2. Create the feature/prelaunch-page branch
3. Update the landing page with prelaunch messaging
4. Add Beehiiv newsletter integration
5. Configure Vercel for deployment of the prelaunch branch
6. Test the prelaunch page thoroughly before going live