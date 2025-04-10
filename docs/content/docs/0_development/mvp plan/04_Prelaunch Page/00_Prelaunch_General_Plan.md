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
- Initially deploy the prelaunch page on Vercel for quick iteration and ease of updates
- Later, migrate the full SaaS product to AWS
- Add Google Analytics 4 to the full application

## 2. Branching Strategy and Code Adjustments

### 2.1 Develop Legal Pages in the Main (Develop) Branch
**Create Legal Pages:**
- Build pages such as 
    `/src/app/legal/imprint.tsx`: Required by German law (Telemediengesetz) for most commercial websites accessible in Germany. It needs specific company details (name, address, contact info, registration numbers, etc.)
    `/src/app/legal/privacy-policy.tsx`: Required by GDPR for any site processing personal data (which includes IP addresses logged by the server, analytics data, newsletter signups).
    `/src/app/legal/cookie-policy.tsx`: Cookie Policy - can sometimes be part of the Privacy Policy, but often separate for clarity
    `/src/app/legal/terms-of-service.tsx`:  These outline the contractual rules between you and your users for using your service. You might not strictly need full ToS publicly visible for just the prelaunch landing page with only a newsletter signup. However, it's good practice to have them drafted. You will absolutely need them before allowing user registration or accepting payments for the actual SaaS product.
- Integrate these pages into the global footer or navigation so that they are accessible from every part of the application

### 2.2. Implement cookie and analytics feature and cookie consent
**Implement Cookie and Analytics Feature:**
- Implement a GDPR/ePrivacy compliant cookie consent mechanism and basic, privacy-conscious analytics for the prelaunch page (and later the full application).
- Use a lightweight library like react-cookie-consent
- Implement Consent Banner/Modal with our own desing (react-cookie-consent)

**Enable Vercel Analytics**: 
- For basic traffic insights on the landing page. Simple, free, privacy-friendly. Integrate Google Analytics 4 later when the full application is ready.

**Integration of Vercel Analytics**:
Cookie Policy & Privacy Policy Update:

Even though Vercel Analytics is designed to be privacy-focused and cookieless by default, you must mention its use in your Privacy Policy (/legal/privacy-policy.tsx).

Describe:
- That you use Vercel Analytics.
- What data it collects (page URL, referrer, browser/OS type, country - anonymized).
- The purpose (website traffic analysis, performance monitoring).
- That it's provided by Vercel Inc.
- Link to Vercel's privacy policy.
- Mention that it operates without using tracking cookies by default.

In your Cookie Policy (/legal/cookie-policy.tsx), you can explicitly state that Vercel Analytics (as configured) does not place cookies, reinforcing its privacy aspect.

Interaction with Cookie Consent Banner:
- Challenge: Because Vercel Analytics is auto-injected by the platform during deployment, you cannot easily wrap it in conditional logic based on your react-cookie-consent banner within your code. The script is added externally by Vercel.

Pragmatic Approach:
- Rely on Vercel's privacy-preserving defaults (cookieless, anonymized data).
- Clearly disclose the use of Vercel Analytics in your Privacy Policy (as per step 4).
- Your consent banner will still control other potentially cookie-setting scripts (like GA4 if added later), but it won't block the auto-injected Vercel script.
- This is a common approach for platform-level, cookieless analytics. The user is informed via the policy, and the tool itself minimizes data collection. Strict interpretations might differ, but this balances usability, compliance, and ease of implementation.

### 2.3 Create a Dedicated Prelaunch Branch
**Branch Creation:**
- Once legal pages are in place and integrated into the landing page on develop, create a prelaunch branch to isolate changes related to the prelaunch messaging and access restrictions
- Example command:
  ```bash
  git checkout -b feature/prelaunch-page
  ```

**Purpose of the Prelaunch Branch:**
- Customize the landing page exclusively for prelaunch (e.g., integrate Beehiiv, modify CTAs, remove access to unfinished app sections)
- This separation minimizes the risk of deploying incomplete features from your main application

### 2.4 Update the Marketing Landing Page
**Based on Your Existing Page (page.tsx):**
- Use the current marketing landing page (under `/src/app/(marketing)/page.tsx`) as the starting point
- Update the content to focus on prelaunch messaging (e.g., teaser text, minimal feature descriptions)
- Consider temporarily disabling or hiding links to authentication routes (like `/signup`, `/login`) and other incomplete areas

## 3. Beehiiv Integration

**Using the Embed Code:**
- Retrieve the HTML embed code for the Beehiiv newsletter form from your Beehiiv dashboard
- Integrate the embed code into a prominent section of your landing page (typically in the hero section or a dedicated CTA block)

**Future Flexibility:**
- The embed code approach is lightweight and can be easily removed or replaced with a custom API integration later when your full SaaS product is ready

## 4. Deployment on Vercel for the Prelaunch Phase

### 4.1 Prelaunch Deployment Process
**Deploying the Prelaunch Branch:**
- Configure Vercel to deploy the `feature/prelaunch-page` branch
- This allows you to preview and then deploy your prelaunch landing page on your production domain (e.g., www.yourdomain.com)

**Key Configurations:**
- Ensure that only the prelaunch landing page (with the updated marketing messaging and legal pages) is accessible
- Verify that there are no active links or navigational elements to routes for login, registration, or dashboard
- Confirm that the Beehiiv integration works properly through testing (e.g., test email submission)

### 4.2 Testing Prior to Going Live
Thoroughly test the following:
- Functionality of the Beehiiv form
- Accessibility and correctness of the legal pages
- That any attempts to navigate to restricted areas (e.g., `/login`, `/dashboard`) either redirect to the landing page or show an appropriate message

## 5. Later Migration or Parallel Hosting on AWS

### Approach: Separate Environments
**Keep the Landing Page on Vercel:**
- Continue updating and hosting your marketing/prelaunch landing page on Vercel, where changes can be rolled out quickly

**Deploy the Full SaaS on AWS:**
- Host your complete application (including authentication, dashboard, and other full features) on AWS using your preferred services (e.g., S3/CloudFront for static assets, EC2/ECS, or Amplify for dynamic content)
- Use a subdomain such as app.yourdomain.com for the SaaS app

## 6. Summary of the End-to-End Plan

### Core Development on Develop Branch
- Build and integrate legal pages in the develop branch for Impressum, Privacy Policy, and Cookie Settings
- Update the marketing landing page (from `/src/app/(marketing)/page.tsx`) to focus on prelaunch messaging, including minimal feature details and strong CTAs
- Include links to the legal pages in the footer

### Branching for Prelaunch
- Create a dedicated branch (`feature/prelaunch-page`) from develop after the legal pages and landing page updates are complete
- In this branch, further tailor the landing page by adding the Beehiiv newsletter embed code and removing or protecting any links/routes leading to unfinished areas (e.g., login, signup, dashboard)

### Prelaunch Deployment on Vercel
- Configure Vercel to deploy the `feature/prelaunch-page` branch
- Ensure that only the prelaunch landing page and legal pages are accessible
- Perform comprehensive testing for functionality, navigation, and legal compliance before going live

### Planning for Later Transition to AWS
- **Option A:** Continue to host the prelaunch/marketing page on Vercel and deploy the full SaaS on AWS using a separate subdomain
- **Option B:** Migrate the entire application, including the landing page and full app, to AWS
- Update DNS settings and CI/CD pipelines accordingly, and perform thorough testing post-migration