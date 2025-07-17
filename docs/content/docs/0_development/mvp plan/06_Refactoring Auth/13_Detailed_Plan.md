# Detailed Refactoring Plan: JWT with Custom Claims

## Overview

This document provides a concrete, step-by-step guide for refactoring the application's authentication mechanism. The goal is to migrate from the current complex `M2M + x-user-token` system to a modern, standard **JWT with Custom Claims** architecture. This plan will serve as the source of truth during development.

---

## Phase 1: Auth0 Configuration (Manual Setup) **STATUS: ✅ Finished**

This is a manual step to be performed in the Auth0 dashboard. It configures Auth0 to embed our application's user data into the access token itself.

**1. Create a Post-Login Action:**
   - Navigate to **Actions > Library** in your Auth0 dashboard.
   - Click **Create Action** and select **Build from scratch**.
   - **Name**: `Add Custom Claims`
   - **Trigger**: `Login / Post Login`
   - **Runtime**: `Node 22` (Recommended by Auth0)

**2. Add Action Code:**
   - Paste the following code into the editor. This script calls our backend to get user details and adds them to the token.

   ```javascript
   /**
    * Post-Login Action: Add Custom Claims to Access Token
    */
   exports.onExecutePostLogin = async (event, api) => {
     const namespace = 'https://short-video-creator.com/';

     try {
       const { user, secrets } = event;

       const response = await fetch(`${secrets.API_GATEWAY_SERVICE_URL}/api/auth/user-lookup`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'x-service-auth': secrets.SERVICE_AUTH_TOKEN,
         },
         body: JSON.stringify({
           auth0_id: user.user_id,
           email: user.email,
           name: user.name,
           picture: user.picture,
         }),
       });

       if (!response.ok) {
         console.error('Backend user lookup failed:', response.status, await response.text());
         return;
       }

       const { userData } = await response.json();

       api.accessToken.setCustomClaim(`${namespace}user_id`, userData.user_id);
       api.accessToken.setCustomClaim(`${namespace}email`, userData.email);
       api.accessToken.setCustomClaim(`${namespace}name`, userData.name);
       api.accessToken.setCustomClaim(`${namespace}is_admin`, userData.is_admin || false);
       api.accessToken.setCustomClaim(`${namespace}permissions`, userData.permissions || []);
       api.accessToken.setCustomClaim(`${namespace}subscription_plan_id`, userData.subscription_plan_id || 1);

     } catch (error) {
       console.error('Error in post-login action:', error);
     }
   };
   ```

**3. Configure Action Secrets:**
   - In the Action editor, click the **Secrets** tab.
   - Add the following keys and values.

   | Secret Key                | Value (for local dev)                            |
   | ------------------------- | ------------------------------------------------ |
   | `API_GATEWAY_SERVICE_URL` | `http://localhost:3000`                          |
   | `SERVICE_AUTH_TOKEN`      | `sk_dev_aK9bS5vC3gH8jL6tP4wX2zQ1fR7uI0o` |

**4. Deploy and Apply Action to Flow:**
   - Click **Save Draft** and then **Deploy**.
   - Navigate to **Actions > Triggers**.
   - Select the **Post Login** trigger.
   - Drag your **`Add Custom Claims`** action from the right panel into the flow.
   - Click **Apply**.

---

## Phase 2: Backend Refactoring **STATUS: ✅ Finished**

This phase simplifies the backend services to handle the new single-token authentication.

**1. Create New Authentication Middleware and Review service auth:** **STATUS: ✅ Finished**
   - **File to Create:** `backend/api-gateway/middleware/jwtAuth.js`
   - **File to Review:** `backend/api-gateway/middleware/serviceAuth.js`
   - **Purpose:** This new middleware will validate the Auth0 JWT, check its signature using the JWKS (JSON Web Key Set), and extract the user object from the custom claims. It replaces `unifiedAuth.js`.

**2. Create User Lookup Endpoint:** **STATUS: ✅ Finished**
   - **File to Create:** `backend/services/auth-service/controllers/userLookupController.js`
   - **Purpose:** This controller implements the logic for the `/api/auth/user-lookup` endpoint. It finds a user by their Auth0 ID or email, or creates a new user record in the database if one doesn't exist, returning the user profile.

**3. Update API Gateway Routes:** **STATUS: ✅ Finished**
   - **Files to Modify:** All route files in `backend/api-gateway/routes/` (e.g., `job.js`, `subscription.js`, `admin.js`).
   - **Change:** Replace the chain of old middleware with a single call to the new `jwtAuth()` middleware.

   - **Example:**
     ```javascript
     // FROM:
     router.get('/jobs', verifyAuth0Token, checkPermission('/api/job/jobs'), ...);

     // TO:
     const jwtAuth = require('../middleware/jwtAuth');
     router.get('/jobs', jwtAuth({ requireUser: true }), ...);
     ```

**4. Update API Gateway Server & Review Auth Route:** **STATUS: ✅ Finished**
   - **File to Modify:** `backend/api-gateway/server.js`
   - **File to Update:** `backend/api-gateway/routes/auth.js` and re
   - **Change:** Update `server.js` and review `auth.js` route file. The new `auth.js` will define the `/user-lookup` endpoint and any other auth-related routes, all protected by the new `serviceAuth` or `jwtAuth` middleware.

**5. Review everything inside auth service classes** **STATUS: ✅ Finished**
   - **Files to Review:** Everything inside `backend/services/auth-service/` folder

**6. Cleanup Old Files:** **STATUS: ✅ Finished**
   - **Purpose:** Remove all obsolete legacy authentication code to prevent confusion and bugs.
   - **Files to Delete:**
   - Middleware:
     - `backend/api-gateway/middleware/auth0.js`
     - `backend/api-gateway/middleware/userTokenExtractor.js`
     - `backend/api-gateway/middleware/unifiedAuth.js`
   - Auth Service:
     - `backend/services/auth-service/services/user-service.js`
     - `backend/services/auth-service/services/social-auth.service.js`
     - `backend/services/auth-service/services/session.service.js`
     - `backend/services/auth-service/services/email-auth.service.js`
     - `backend/services/auth-service/middleware/jwt-verify.middleware.js`
     - `backend/services/auth-service/middleware/auth0-verify.middleware.js`
     - `backend/services/auth-service/controller/user-controller.js`
     - `backend/services/auth-service/controller/social-auth.controller.js`
     - `backend/services/auth-service/controller/email-auth.controller.js`
     - `backend/services/auth-service/utils/crypto.js`
     - `backend/services/auth-service/utils/token.js`

**7. Update env variables** **STATUS: ✅ Finished**
   - **ToDo:** Update env variables in the root .env file.

**8. Update Readme.md ( backend\services\auth-service\README.md) ** **STATUS: ✅ Finished**
   - **ToDo:** Update the Readme.md file of the auth service.

**9. Review manual testing strategy** **STATUS: ✅ Finished**
   - **Review and discuss:** Current manual testing strategy in Postman. Documented in the Readme.md file of the auth service.

**10. Update the existing tests** ** **STATUS: ✅ Finished**
   - **ToDo:**
      - Review and update the existing tests to use the new auth flow.
   - **Deprecated endpoints to Delete:**
      - POSTMAN endpoints not used anymore
         - `POST http://localhost:3000/api/auth/social`
         - `POST http://localhost:3000/api/auth/register`
         - `POST http://localhost:3000/api/auth/login`
         - `POST http://localhost:3000/api/auth/logout`
         - `POST http://localhost:3000/api/auth/forgot-password`
         - `POST http://localhost:3000/api/auth/reset-password`
         - `POST http://localhost:3000/api/auth/refresh`
   - **New endpoints to Add (In Postman and tests):**
      - `GET http://localhost:3000/api/auth/profile`
      - `POST http://localhost:3000/api/auth/user-lookup`
         Body:
         - `auth0_id`: Auth0 ID of the user
         - `email`: Email of the user
         - `name`: Name of the user
   - **Files to Review and Update:**
      - `tests\auth\auth-test.js`

**11. Do a  happy path API testing (postman) and login / logout flow testing with auth0 jwt logger** **STATUS: ✅ Finished**
   - **ToDo:**
      - Do a  happy path API testing (postman) and login / logout flow testing with auth0 jwt logger
      - Prerequisites:
         - Start ngrok and get the public url (local testing) and add it to the custom claims as variable API_GATEWAY_SERVICE_URL in auth0
      - Create regular user (bob@example.com) in auth0 and login with custom address: 
            `https://dev-5e34magdrr8ridcc.eu.auth0.com/authorize?audience=https://api.dev-5e34magdr8rdcc.com&scope=openid%20profile%20email&response_type=token&client_id=K6CCXpPhnlzAPBcf09dAJIQLC4mGn7Db&redirect_uri=https://jwt.io`
            -> Setting of access token expiration for api under Video Creator API: 28800 seconds (8 hours)
      - Create admin user (alicen@example.com) in auth0 and login with custom address:
            - #How is the URL looking for admin?
      - Use the JWT access token to test the endpoint in postman
      - Use custom address for logout
         - `https://dev-5e34magdrr8ridcc.eu.auth0.com/v2/logout?client_id=K6CCXpPhnlzAPBcf09dAJIQLC4mGn7Db&returnTo=https://jwt.io`
      - Test endpoint `GET http://localhost:3000/api/auth/profil`

---

## Phase 3: Frontend Refactoring **STATUS: ✅ Finished**

This phase will refactor the entire frontend authentication flow to align with the new, simplified backend architecture. We will eliminate redundant and complex legacy code, create a single source of truth for authentication state, and ensure all components use the new JWT-based flow.

### **1. Create a Central, Simplified `AuthProvider`**
   - **File to Create/Refactor:** `frontend/src/components/providers/auth0-provider.tsx`
   - **Purpose:** This will become the single source of truth for authentication.
     - It will wrap the official `@auth0/auth0-react` provider.
     - It will contain a new, simplified `AuthContext` that exposes the user object (with custom claims from the JWT), the loading state, and the `getAccessTokenSilently` function.
   - **File to Modify:** `frontend/src/app/layout.tsx`
   - **Change:** Ensure the main layout wraps all children with this single, refactored `Auth0ProviderWrapper`.
   - **File to Delete:** The old, complex `frontend/src/app/providers.tsx` will be removed, its functionality consolidated into `auth0-provider.tsx` and `layout.tsx`.

### **2. Simplify the `useAuth` Hook**
   - **File to Refactor:** `frontend/src/lib/hooks/useAuth.ts`
   - **Change:** The hook will be drastically simplified. It will no longer need to switch between different contexts. It will simply be a `useContext` call to our new, simplified `AuthContext` to provide auth state and functions to any component that needs them.

### **3. Simplify the API Client**
   - **File to Refactor:** `frontend/src/lib/api/apiClient.ts`
   - **Change:** Remove all the complex, defensive initialization logic (retries, timeouts). The client will be initialized once and will get the `getToken` function directly from the `Auth0Provider`. It will now make direct calls to the API gateway, not the proxy.

### **4. Refactor the `ProtectedRoute` Component**
   - **File to Refactor:** `frontend/src/components/auth/protected-route.tsx`
   - **Change:** Remove all complex timers, `useEffect` hooks, and manual state synchronization. The component will become a clean, simple wrapper that checks `isAuthenticated` and `isLoading` from the new `useAuth` hook and either renders children or redirects to the login page.

### **5. Refactor Login and Signup Forms**
   - **Files to Refactor:**
     - `frontend/src/components/auth/login-form.tsx`
     - `frontend/src/components/auth/signup-form.tsx`
     - `frontend/src/components/auth/social-auth.tsx`
   - **Change:**
     - The email/password forms will be updated to use the `loginWithRedirect` function from the `useAuth0` hook, just like the `social-auth.tsx` component already does.
     - All `fetch` calls to the obsolete `/api/auth/proxy` will be removed. This standardizes all login/signup methods through the central Auth0 flow.

### **6. Review Dependent Hooks and Components**
   - **Purpose:** Ensure that other parts of the application that rely on authentication are updated to use the new, simplified `useAuth` hook.
   - **Hook Files to Review:**
     - `frontend/src/lib/hooks/useAssembly.ts`
     - `frontend/src/lib/hooks/useJobDetails.ts`
     - `frontend/src/lib/hooks/useProgressiveMedia.ts`
     - `frontend/src/lib/hooks/useStorageUrls.ts`
     - `frontend/src/lib/hooks/useSubscription.ts`
     - `frontend/src/lib/hooks/useVideoCreationState.ts`
     - `frontend/src/lib/hooks/useVideos.ts`
     - `frontend/src/lib/hooks/useWorkbench.ts`
   - **Component Files to Review:**
     - `frontend/src/components/layout/site-header.tsx`
     - `frontend/src/components/layout/dashboard-header.tsx`
     - `frontend/src/components/layout/nav-bar.tsx`
   - **Other Components to Review:**
     - `frontend/src/components/marketing/hero/HeroCTA.tsx`
     - `frontend/src/components/dashboard/overview.tsx`
     - `frontend/src/components/job-details/sections/TemplateSelector.tsx`
   - **Other pages to review:**
      - `frontend\src\app\(dashboard)\workbench\[jobId]\page.tsx`
   - Any other component that currently imports and uses `useAuth` or `AuthContext`.

### **7. Code Cleanup: Removing Obsolete Auth Systems**
   - **Purpose:** Before writing new code, we will delete all legacy and redundant authentication files. This will prevent confusion and ensure we are building on a clean foundation.
   - **Files to Delete:**
     - **NextAuth remnants:**
       - `frontend/src/app/api/auth/[...nextauth]/route.ts`
     - **Custom Backend-for-Frontend (BFF) Proxy:**
       - `frontend/src/app/api/auth/proxy/route.ts`
     - **Inactive OAuth Callback Handler:**
       - `frontend/src/app/api/auth/callback/route.ts`
     - **Redundant/Complex Providers & Contexts:**
       - `frontend/src/lib/auth/AuthContext.tsx` (This will be replaced with a much simpler version)
       - `frontend/src/components/providers/api-provider.tsx`
       - `frontend/src/app/providers.tsx`
     - **Legacy State Management & Helpers:**
       - `frontend/src/lib/auth.ts` (Zustand store)
       - `frontend/src/lib/auth/refresh.ts` (Custom token refresh logic)
       - `frontend/src/lib/hoc/withAuth.tsx` (Replaced by `protected-route.tsx`)
      - **Password Components:**
         - `frontend/src/components/auth/password-validation.tsx`
         - `frontend/src/components/auth/reset-password-form.tsx`
      - **Error Components:**
         - `frontend/src/lib/errors/auth.ts`
      - **Pages to Delete:**
         - `frontend/src/app/reset-password/page.tsx`


### **8. Final Cleanup**
   - **Purpose:** After the refactor is complete and tested, perform a final sweep to remove any other orphaned files, unused variables, or dead code related to the old authentication system.

### **9. Add tests for the new auth flow**
   - **File to Create:** `frontend/tests/test-auth-flow.js`
   - **Purpose:** This file will contain the tests for the new auth flow in the frontend.
   - **ToDo:**
      - Add tests similar to `frontend\tests\test-prelaunch-routes.js`

---

## Phase 4: Final Testing & Validation **STATUS: In progress**

1.  **Backend:** Use a tool like Postman or Insomnia to get a test JWT from Auth0. Use this token to hit your protected backend endpoints directly and verify they work as expected.
2.  **Frontend:**
    - Perform a full login and logout flow.
    - Navigate to a protected route and verify it loads correctly.
    - Navigate away and back to the protected route to ensure the session persists.
    - Open a new tab and navigate to a protected route to confirm authentication is shared.
    - Test components that fetch data, like the jobs workbench, to ensure the `apiClient` is making successful authenticated calls.
3. **Test different scenarios E2E:**
    - Create different jobs with different content requirements (script only, image only, image and voice, video, music etc.)
    - Test and verify the creation, the workbench UX, the job details UX
    - Download content from the job details
    - Assemble a video and check the video result
4. **Issues to fix:**
   - No differentation in the workbench and job details between in progress, failed and completed jobs **STATUS: ✅ Fixed**
      -> Fixed with new labels and progress bar in workbench **STATUS: ✅ Fixed**
      -> Fixed with differenation in job details between in progress, failed and completed jobs *STATUS: ✅ Fixed**
   - UI Issues **STATUS: ✅ Fixed**:
      - No differentation for llm (script) / voice only jobs **STATUS: ✅ Fixed**
      - Music player is rendered in the job details even if there is no music **STATUS: ✅ Skipped (because of old data)**
   - Subscription service error and frontend error when calling the backend for selection of template for video assembly **STATUS: ✅ Fixed**
      -> Issue was that the subscription service was not running.
   - Download of content (e.g. image) is failing **STATUS: ✅ Fixed**
      - Error: Seems like the download is making a backend call to `http://localhost:4000/api/auth/proxy?endpoint=/api/auth/token` and in the UI we get a `<div class="text-sm font-semibold">Download failed</div> <div class="text-sm opacity-90">Authentication failed: Unable to obtain M2M token for download</div>`
      - Seems here the old auth flow is still being used. Check classes `useVideos.ts` and `useWorkbench.ts` and `download.ts`
   - Image generation endless for one scene when selected in a job, no error and no progress to other scenes **STATUS: In progress and under analysis**
   - After session is expired (not doing anything on the page) and being in the job details, I´m not automatically logged out, but we get a 403 error when calling the job details **STATUS: No high priority**
      (error Request URL http://localhost:3000/api/job/jobs/1bc9d210-7486-494c-90fc-e24b92eb5e4c
      Request Method GET Status Code 403 Forbidden)  
    
## Success Criteria

- The application is fully authenticated using a single JWT from Auth0.
- All legacy authentication code (`unifiedAuth`, `userTokenExtractor`, manual token refresh) has been removed.
- The linter error in `useJobDetails.ts` is resolved.
- The `protected-route.tsx` component is simple and bug-free.
- The overall codebase is simpler, more secure, and easier to maintain.
- The path is clear for implementing Stripe payments, which rely on having a stable `userId`.
