# Prelaunch Page Documentation

## Overview
This branch contains the prelaunch version of the Narravid website, focused on lead generation and building a waitlist before the official product launch.

## Key Features
- Simplified landing page with the core value proposition
- Beehiiv newsletter integration for waitlist signup
- Only legal pages are accessible (Imprint, Privacy Policy, Cookie Policy, Terms of Service)
- Restricted access to product features, authentication, and dashboard
- Middleware redirects users who attempt to access protected routes

## File Structure Changes

### New Files Created
- `frontend/src/components/layout/prelaunch-header.tsx` - Simplified header without navigation
- `frontend/src/components/marketing/prelaunch-footer.tsx` - Footer with only legal links
- `frontend/middleware.ts` - Route protection middleware

### Modified Files
- `frontend/src/app/(marketing)/layout.tsx` - Updated to use prelaunch components
- `frontend/src/app/(marketing)/page.tsx` - Replaced with prelaunch content

## Route Protection
The middleware in `middleware.ts` provides two levels of protection:
1. **Explicitly Blocked Routes** - Routes like `/login`, `/signup`, `/dashboard`, `/features`, etc. are actively blocked and redirected to the homepage.
2. **Allowlist Only** - Only specifically allowed routes (homepage and legal pages) are accessible; all others redirect to the homepage.

### Blocked Routes
The following routes are explicitly blocked and redirected to the homepage:
- Authentication: `/login`, `/signup`, `/reset-password`
- Dashboard areas: `/dashboard`, `/workbench`, `/create`, `/videos`, `/settings`
- Marketing pages: `/features`, `/showcase`, `/pricing`, `/blog`

### Allowed Routes
Only these routes are accessible during the prelaunch phase:
- Homepage: `/`
- Legal pages: `/imprint`, `/privacy-policy`, `/cookie-policy`, `/terms-of-service`

### Handling of Query Parameters
The middleware also handles query parameters, ensuring that authentication-related redirects (like `/login?returnTo=`) are properly blocked regardless of parameters attached.

## Beehiiv Integration
The current implementation includes placeholder form elements where the Beehiiv embed code should be placed. To complete the integration:

1. Sign in to your Beehiiv dashboard
2. Navigate to Growth > Embeds
3. Create or select your signup form
4. Copy the embed code (iframe or JavaScript)
5. Replace the placeholder forms in `frontend/src/app/(marketing)/page.tsx` with the Beehiiv embed code
   - There are two form locations (hero section and call-to-action section)
   - Each form has a comment: `{/* REPLACE THIS FORM with Beehiiv embed code */}`

## Troubleshooting
If you encounter any issues:

### Middleware Issues
1. Make sure `middleware.ts` is placed in the root directory (not in src/)
2. Check that the `ALLOWED_ROUTES` and `BLOCKED_ROUTES` arrays include all necessary routes
3. Verify that the matcher configuration is correct for your setup
4. The middleware includes console logging to help debug route processing
5. Clear your browser cache if old routes still seem accessible
6. If using a browser with service workers, hard refresh or clear site data

### Animation Issues
1. The landing page uses Framer Motion for animations and is marked as a client component with "use client"
2. Do not add server-side directives like `dynamic` or `revalidate` to the page component since it's a client component
3. If animations don't appear, make sure `framer-motion` is installed: `npm install framer-motion`

## Deployment Instructions
1. Merge this branch into your deployment branch: `git checkout main && git merge feature/prelaunch-page`
2. Verify all changes are correct: `git diff HEAD~1`
3. Deploy to your hosting platform (Vercel, AWS, etc.)
4. Test the redirects by attempting to access a protected route (e.g., `/login`, `/dashboard`, `/features`)
5. Make sure to test with query parameters as well (e.g., `/login?returnTo=/dashboard`)
6. Use the testing script to automate route verification: `node scripts/test-prelaunch-routes.js`

## Route Testing Script
A testing script is provided at `frontend/scripts/test-prelaunch-routes.js` to verify that your prelaunch route protections are working correctly:

1. Update the `BASE_URL` in the script to your deployed URL or localhost
2. Run the script: `node scripts/test-prelaunch-routes.js`
3. Review the output to confirm all route protections are working:
   - Allowed routes should return 200 status
   - Blocked routes should redirect (301/302) to the homepage
   - Static assets should be accessible

This script tests all the critical routes and provides a summary of passing and failing tests, making it easier to verify your deployment is correctly configured.

## Reverting to Full Site
When you're ready to launch the full product:

1. Create a new branch from the main development branch (not this prelaunch branch)
2. Delete or disable the `middleware.ts` file to restore access to all routes
3. Restore the original marketing components:
   - Revert `frontend/src/app/(marketing)/layout.tsx` to use `SiteHeader` and `MarketingFooter`
   - Revert `frontend/src/app/(marketing)/page.tsx` to use the original components

Alternatively, you can simply switch back to your main development branch and deploy that version when ready for full launch. 