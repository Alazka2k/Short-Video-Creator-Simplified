/**
 * Test script for verifying prelaunch route protections
 * 
 * This script checks that:
 * 1. Public routes are accessible
 * 2. Protected routes redirect to the homepage
 * 3. Static assets are accessible
 * 
 * Usage:
 * node scripts/test-prelaunch-routes.js
 */

const https = require('https');
const http = require('http');

// Configure this to your deployed site
const BASE_URL = 'http://localhost:3000';
const TIMEOUT_MS = 10000;

// Format for each test case:
// [path, expected status code range, description]
const ROUTES_TO_TEST = [
  // Public routes - should be accessible (200)
  ['/', [200, 299], 'Homepage should be accessible'],
  ['/imprint', [200, 299], 'Imprint page should be accessible'],
  ['/privacy-policy', [200, 299], 'Privacy Policy page should be accessible'],
  ['/cookie-policy', [200, 299], 'Cookie Policy page should be accessible'],
  ['/terms-of-service', [200, 299], 'Terms of Service page should be accessible'],
  
  // Protected routes - should redirect (300-399)
  ['/login', [300, 399], 'Login should redirect to homepage'],
  ['/signup', [300, 399], 'Signup should redirect to homepage'],
  ['/reset-password', [300, 399], 'Reset Password should redirect to homepage'],
  ['/dashboard', [300, 399], 'Dashboard should redirect to homepage'],
  ['/workbench', [300, 399], 'Workbench should redirect to homepage'],
  ['/create', [300, 399], 'Create page should redirect to homepage'],
  ['/videos', [300, 399], 'Videos page should redirect to homepage'],
  ['/settings', [300, 399], 'Settings page should redirect to homepage'],
  ['/features', [300, 399], 'Features page should redirect to homepage'],
  ['/showcase', [300, 399], 'Showcase page should redirect to homepage'],
  ['/pricing', [300, 399], 'Pricing page should redirect to homepage'],
  ['/blog', [300, 399], 'Blog page should redirect to homepage'],
  
  // Routes with query params - should handle correctly
  ['/login?returnTo=/dashboard', [300, 399], 'Login with query params should redirect'],
  ['/signup?referral=xyz123', [300, 399], 'Signup with query params should redirect'],
  
  // Static assets - should be accessible (200)
  ['/favicon.ico', [200, 299], 'Favicon should be accessible'],
  ['/images/logo.png', [200, 299], 'Logo should be accessible'],
  ['/branding/icon.svg', [200, 299], 'Branding assets should be accessible'],
  ['/_next/static/chunks/main.js', [200, 299], 'Next.js static assets should be accessible'],
];

async function fetchWithTimeout(url, options = {}, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
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
    const result = inRange ? 'PASS' : 'FAIL';
    
    console.log(`  [${result}] Status: ${status}, Expected: ${expectedStatusRange[0]}-${expectedStatusRange[1]}`);
    
    if (status >= 300 && status <= 399) {
      console.log(`  Redirect location: ${response.headers.get('location')}`);
    }
    
    return inRange;
  } catch (error) {
    console.error(`  [ERROR] ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('Starting route protection tests...\n');
  
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
  
  console.log('\nTest Summary:');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  
  if (failed > 0) {
    console.log('\n⚠️ Some tests failed! Review the output above for details.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Your prelaunch route protections are working correctly.');
    process.exit(0);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('Error: This script requires Node.js 18+ which includes native fetch support.');
  console.error('Please upgrade Node.js or install a fetch polyfill.');
  process.exit(1);
}

runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
}); 