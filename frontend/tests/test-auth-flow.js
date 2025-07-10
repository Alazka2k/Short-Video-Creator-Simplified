/**
 * =============================================================================
 * TEST SCRIPT: NEW AUTHENTICATION FLOW
 * =============================================================================
 *
 * PURPOSE:
 * This script is designed to perform end-to-end tests on the new frontend
 * authentication flow. It verifies that the route protection mechanisms are
 * working as expected after the refactor to JWT with custom claims.
 *
 * WHAT IT TESTS:
 * 1.  Public Routes: Ensures that pages intended for all users (like the
 *     homepage, login page, and legal documents) are accessible and return
 *     a 200 OK status.
 * 2.  Protected Routes: Verifies that pages intended only for authenticated
 *     users (like the dashboard and its sub-pages) are protected. When not
 *     logged in, these routes should return a 3xx redirect status, sending
 *     the user to the Auth0 login page.
 * 3.  Static Assets: Checks that essential static files (favicon, branding)
 *     are publicly available.
 * 4.  Error Routes: Confirms that non-existent routes correctly return a
 *     404 Not Found status.
 *
 * HOW IT WORKS:
 * The script sends HTTP requests to a list of predefined routes and checks if
 * the HTTP status code of the response falls within an expected range. It
 * specifically configured *not* to follow redirects (`redirect: 'manual'`) so
 * that it can capture the initial 3xx status from protected routes. It also
 * verifies that the redirect location points to the correct Auth0 domain.
 *
 * USAGE:
 * 1.  Ensure the frontend development server is running on `http://localhost:3000`.
 *     You can start it with: `npm run dev:frontend`
 * 2.  Run this script from the root directory:
 *     `node frontend/tests/test-auth-flow.js`
 *
 * SUCCESS CRITERIA:
 * The script passes if all tested routes return a status code within their
 * expected range.
 */

const http = require('http');

// Configure this to your local development site
const BASE_URL = 'http://localhost:4000';
const TIMEOUT_MS = 10000;

// Format for each test case:
// [path, expected status code range, description]
const ROUTES_TO_TEST = [
  // ---------------------------------------------------------------------------
  // 1. Public Routes
  // These should always be accessible to any user.
  // ---------------------------------------------------------------------------
  ['/', [200, 299], 'Homepage should be accessible'],
  ['/login', [200, 299], 'Login page should be accessible'],
  ['/signup', [200, 299], 'Signup page should be accessible'],
  ['/terms-of-service', [200, 299], 'Terms of Service page should be accessible'],
  ['/privacy-policy', [200, 299], 'Privacy Policy page should be accessible'],

  // ---------------------------------------------------------------------------
  // 2. Protected Routes
  // These should redirect to the Auth0 login page if the user is not authenticated.
  // ---------------------------------------------------------------------------
  ['/dashboard', [300, 399], 'Dashboard should redirect to login'],
  ['/dashboard/settings', [300, 399], 'Settings page should redirect to login'],
  ['/dashboard/videos', [300, 399], 'Videos page should redirect to login'],

  // ---------------------------------------------------------------------------
  // 3. Error Routes
  // These should return a standard 404 error.
  // ---------------------------------------------------------------------------
  ['/this-page-does-not-exist', [404, 404], 'Non-existent page should return 404'],
  
  // ---------------------------------------------------------------------------
  // 4. Static Assets
  // These should be publicly available.
  // ---------------------------------------------------------------------------
  ['/favicon.ico', [200, 299], 'Favicon should be accessible'],
  ['/branding/dark/brand.svg', [200, 299], 'Branding assets should be accessible'],
];

async function fetchWithTimeout(url, options = {}, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      redirect: 'manual', // Do not follow redirects
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function testRoute(route, expectedStatusRange, description) {
  const url = `${BASE_URL}${route}`;
  console.log(`Testing: ${url} - ${description}`);

  try {
    const response = await fetchWithTimeout(url);
    const status = response.status;

    const inRange = status >= expectedStatusRange[0] && status <= expectedStatusRange[1];
    const result = inRange ? '✅ PASS' : '❌ FAIL';

    console.log(`  [${result}] Status: ${status}, Expected: ${expectedStatusRange[0]}-${expectedStatusRange[1]}`);

    if (status >= 300 && status < 400) {
      const location = response.headers.get('location');
      console.log(`  Redirect location: ${location}`);
      if (!location || !location.includes('auth0.com')) {
        console.log('  ❌ FAIL: Redirect location does not point to Auth0.');
        return false;
      }
    }

    return inRange;
  } catch (error) {
    console.error(`  [ERROR] ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\\nStarting new authentication flow tests...\\n');

  let passed = 0;
  let failed = 0;

  for (const [route, expectedStatusRange, description] of ROUTES_TO_TEST) {
    const success = await testRoute(route, expectedStatusRange, description);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    console.log(''); // Add a line break between tests
  }

  console.log('\\nTest Summary:');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  if (failed > 0) {
    console.log('\\n⚠️ Some tests failed! Review the output above for details.');
    process.exit(1);
  } else {
    console.log('\\n✅ All auth flow tests passed! The new route protections are working correctly.');
    process.exit(0);
  }
}

if (typeof fetch === 'undefined') {
  console.error('Error: This script requires Node.js 18+ which includes native fetch support.');
  process.exit(1);
}

runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
}); 