# Testing Strategy Guide

## Overview

This document outlines a comprehensive testing strategy for the authentication migration from M2M + x-user-token to JWT with Custom Claims. Testing is critical to ensure the migration doesn't break existing functionality and properly implements the new authentication flow.

## Prerequisites

- All previous migration steps completed
- Test environment configured to match production
- Test data and users prepared
- Monitoring tools in place

## Testing Phases

### Phase 1: Unit Testing
**Duration: 1 day**
**Responsibility: Backend and Frontend Developers**

#### Backend Unit Tests

##### 1.1 Auth0 Action Testing
```javascript
// tests/auth0/action.test.js
const { onExecutePostLogin } = require('../../auth0-actions/add-custom-claims');

describe('Auth0 Custom Claims Action', () => {
  let mockApi;
  let mockEvent;

  beforeEach(() => {
    mockApi = {
      accessToken: {
        setCustomClaim: jest.fn()
      }
    };
    
    mockEvent = {
      user: {
        email: 'test@example.com'
      }
    };
  });

  test('should add custom claims for existing user', async () => {
    // Mock user lookup response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: {
            user_id: 123,
            email: 'test@example.com',
            name: 'Test User',
            subscription_plan_id: 2,
            is_admin: false
          }
        })
      })
    );

    await onExecutePostLogin(mockEvent, mockApi);

    expect(mockApi.accessToken.setCustomClaim).toHaveBeenCalledWith(
      'https://short-video-creator.com/user_id',
      123
    );
    expect(mockApi.accessToken.setCustomClaim).toHaveBeenCalledWith(
      'https://short-video-creator.com/email',
      'test@example.com'
    );
  });

  test('should handle user lookup failure gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404
      })
    );

    await expect(onExecutePostLogin(mockEvent, mockApi)).resolves.not.toThrow();
  });
});
```

##### 1.2 Unified Auth Middleware Testing
```javascript
// tests/middleware/unifiedAuth.test.js
const unifiedAuth = require('../../backend/api-gateway/middleware/unifiedAuth');
const jwt = require('jsonwebtoken');

describe('Unified Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      method: 'GET',
      url: '/api/test'
    };
    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res)
    };
    next = jest.fn();
  });

  test('should extract user from JWT custom claims', () => {
    const token = jwt.sign({
      'https://short-video-creator.com/user_id': 123,
      'https://short-video-creator.com/email': 'test@example.com',
      'https://short-video-creator.com/subscription_plan_id': 2,
      'https://short-video-creator.com/is_admin': false
    }, process.env.JWT_SECRET);

    req.headers.authorization = `Bearer ${token}`;

    const middleware = unifiedAuth({ requireUser: true });
    middleware(req, res, next);

    expect(req.user).toEqual({
      userId: 123,
      email: 'test@example.com',
      subscriptionPlanId: 2,
      isAdmin: false
    });
    expect(next).toHaveBeenCalled();
  });

  test('should reject invalid tokens', () => {
    req.headers.authorization = 'Bearer invalid-token';

    const middleware = unifiedAuth({ requireUser: true });
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication failed',
      message: 'Invalid token'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should allow admin-only routes for admin users', () => {
    const token = jwt.sign({
      'https://short-video-creator.com/user_id': 1,
      'https://short-video-creator.com/email': 'admin@example.com',
      'https://short-video-creator.com/is_admin': true
    }, process.env.JWT_SECRET);

    req.headers.authorization = `Bearer ${token}`;

    const middleware = unifiedAuth({ requireAdmin: true });
    middleware(req, res, next);

    expect(req.user.isAdmin).toBe(true);
    expect(next).toHaveBeenCalled();
  });
});
```

##### 1.3 User Lookup Controller Testing
```javascript
// tests/controllers/userLookupController.test.js
const userLookupController = require('../../backend/services/auth-service/controllers/user-lookup-controller');
const authDataAccess = require('../../backend/services/auth-service/data/authDataAccess');

jest.mock('../../backend/services/auth-service/data/authDataAccess');

describe('User Lookup Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com'
      }
    };
    res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
  });

  test('should return existing user', async () => {
    const mockUser = {
      user_id: 123,
      email: 'test@example.com',
      name: 'Test User',
      subscription_plan_id: 2,
      is_admin: false
    };

    authDataAccess.findUserByEmail.mockResolvedValue(mockUser);

    await userLookupController.lookupUser(req, res);

    expect(res.json).toHaveBeenCalledWith({
      user: mockUser
    });
  });

  test('should create new user if not found', async () => {
    authDataAccess.findUserByEmail.mockResolvedValue(null);
    authDataAccess.createUser.mockResolvedValue({
      user_id: 124,
      email: 'test@example.com',
      subscription_plan_id: 1
    });

    await userLookupController.lookupUser(req, res);

    expect(authDataAccess.createUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      subscription_plan_id: 1
    });
  });
});
```

#### Frontend Unit Tests

##### 1.4 useAuth Hook Testing
```typescript
// tests/hooks/useAuth.test.ts
import { renderHook } from '@testing-library/react';
import { useAuth } from '@/lib/hooks/useAuth';
import { AuthProvider } from '@/lib/auth/AuthContext';

const mockAuth0User = {
  'https://short-video-creator.com/user_id': 123,
  'https://short-video-creator.com/email': 'test@example.com',
  email: 'test@example.com'
};

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: true,
    user: mockAuth0User,
    getAccessTokenSilently: jest.fn(() => Promise.resolve('mock-token')),
    isLoading: false
  })
}));

describe('useAuth Hook', () => {
  test('should extract user data from Auth0 JWT', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user?.user_id).toBe(123);
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.isAuthenticated).toBe(true);
  });

  test('should handle authentication token requests', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    const token = await result.current.getToken();
    expect(token).toBe('mock-token');
  });
});
```

##### 1.5 Auth Context Testing
```typescript
// tests/auth/AuthContext.test.tsx
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';

const TestComponent = () => {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-email">
        {user?.email || 'no-email'}
      </div>
    </div>
  );
};

describe('AuthContext', () => {
  test('should provide authentication state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('no-email');
  });
});
```

### Phase 2: Integration Testing
**Duration: 2 days**
**Responsibility: Full-Stack Developers and QA**

#### 2.1 Auth0 Integration Testing

##### End-to-End Auth0 Flow
```javascript
// tests/integration/auth0-flow.test.js
const puppeteer = require('puppeteer');

describe('Auth0 Integration Flow', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should complete Google OAuth flow with custom claims', async () => {
    // Navigate to app
    await page.goto('http://localhost:3000');
    
    // Click login button
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to Auth0
    await page.waitForSelector('input[type="email"]');
    
    // Enter test credentials
    await page.type('input[type="email"]', process.env.TEST_EMAIL);
    await page.type('input[type="password"]', process.env.TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Should redirect back to app
    await page.waitForSelector('[data-testid="user-menu"]');
    
    // Check that user is authenticated
    const userMenu = await page.$('[data-testid="user-menu"]');
    expect(userMenu).toBeTruthy();
    
    // Check that custom claims are available
    const userEmail = await page.evaluate(() => {
      return window.localStorage.getItem('user_email');
    });
    expect(userEmail).toBe(process.env.TEST_EMAIL);
  });
});
```

##### 2.2 API Integration Testing
```javascript
// tests/integration/api-endpoints.test.js
const axios = require('axios');
const jwt = require('jsonwebtoken');

describe('API Endpoint Integration', () => {
  let authToken;

  beforeAll(async () => {
    // Create test JWT with custom claims
    authToken = jwt.sign({
      'https://short-video-creator.com/user_id': 123,
      'https://short-video-creator.com/email': 'test@example.com',
      'https://short-video-creator.com/subscription_plan_id': 2,
      'https://short-video-creator.com/is_admin': false
    }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  test('should authenticate and access user profile', async () => {
    const response = await axios.get('http://localhost:3000/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.user.user_id).toBe(123);
    expect(response.data.user.email).toBe('test@example.com');
  });

  test('should access user-specific jobs', async () => {
    const response = await axios.get('http://localhost:3000/api/job/jobs', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  test('should create new job with user context', async () => {
    const jobData = {
      title: 'Test Job',
      type: 'video',
      scenes: [
        { content: 'Test scene 1' },
        { content: 'Test scene 2' }
      ]
    };

    const response = await axios.post('http://localhost:3000/api/job/jobs', jobData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(201);
    expect(response.data.userId).toBe(123);
    expect(response.data.title).toBe('Test Job');
  });

  test('should access subscription information', async () => {
    const response = await axios.get('http://localhost:3000/api/subscription/subscriptions/user/123', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.user_id).toBe(123);
  });

  test('should reject unauthorized access', async () => {
    try {
      await axios.get('http://localhost:3000/api/job/jobs');
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('should reject access to other users data', async () => {
    try {
      await axios.get('http://localhost:3000/api/subscription/subscriptions/user/456', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });
});
```

##### 2.3 Cross-Service Communication Testing
```javascript
// tests/integration/service-communication.test.js
const axios = require('axios');

describe('Cross-Service Communication', () => {
  test('should forward job creation to job service', async () => {
    const authToken = jwt.sign({
      'https://short-video-creator.com/user_id': 123,
      'https://short-video-creator.com/email': 'test@example.com',
      'https://short-video-creator.com/subscription_plan_id': 2
    }, process.env.JWT_SECRET);

    const jobData = {
      title: 'Integration Test Job',
      type: 'video'
    };

    const response = await axios.post('http://localhost:3000/api/job/jobs', jobData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(201);
    expect(response.data.userId).toBe(123);
    
    // Verify job was created in job service
    const jobId = response.data.id;
    const getResponse = await axios.get(`http://localhost:3000/api/job/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(getResponse.status).toBe(200);
    expect(getResponse.data.id).toBe(jobId);
  });

  test('should properly forward subscription requests', async () => {
    const authToken = jwt.sign({
      'https://short-video-creator.com/user_id': 123,
      'https://short-video-creator.com/email': 'test@example.com',
      'https://short-video-creator.com/subscription_plan_id': 2
    }, process.env.JWT_SECRET);

    const response = await axios.get('http://localhost:3000/api/subscription/tokens/balance/123', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(typeof response.data.balance).toBe('number');
  });
});
```

### Phase 3: User Acceptance Testing
**Duration: 2 days**
**Responsibility: QA Team and Beta Users**

#### 3.1 Frontend User Flow Testing

##### Login Flow Testing
```javascript
// tests/acceptance/login-flow.test.js
const { test, expect } = require('@playwright/test');

test.describe('User Authentication Flow', () => {
  test('should complete full login flow', async ({ page }) => {
    // Visit the application
    await page.goto('http://localhost:3000');
    
    // Should show login button for unauthenticated users
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    
    // Click login
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to Auth0
    await page.waitForURL(/auth0\.com/);
    
    // Complete login (mock or real test account)
    await page.fill('input[type="email"]', process.env.TEST_EMAIL);
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Should redirect back to app
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Should show authenticated state
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-email"]')).toContainText(process.env.TEST_EMAIL);
  });

  test('should maintain authentication across page refresh', async ({ page }) => {
    // Login first (can use login helper)
    await loginUser(page);
    
    // Refresh the page
    await page.reload();
    
    // Should still be authenticated
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).not.toBeVisible();
  });

  test('should handle logout correctly', async ({ page }) => {
    // Login first
    await loginUser(page);
    
    // Open user menu and logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login
    await page.waitForURL('http://localhost:3000');
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });
});

async function loginUser(page) {
  await page.goto('http://localhost:3000');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/auth0\.com/);
  await page.fill('input[type="email"]', process.env.TEST_EMAIL);
  await page.fill('input[type="password"]', process.env.TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3000/dashboard');
}
```

##### Job Management Testing
```javascript
// tests/acceptance/job-management.test.js
const { test, expect } = require('@playwright/test');

test.describe('Job Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.goto('http://localhost:3000/dashboard/workbench');
  });

  test('should display user jobs', async ({ page }) => {
    // Should show jobs list
    await expect(page.locator('[data-testid="jobs-list"]')).toBeVisible();
    
    // Jobs should belong to the current user
    const jobCards = page.locator('[data-testid="job-card"]');
    const count = await jobCards.count();
    
    if (count > 0) {
      // Check first job has user context
      const firstJob = jobCards.first();
      await expect(firstJob).toBeVisible();
    }
  });

  test('should create new job', async ({ page }) => {
    // Click create job button
    await page.click('[data-testid="create-job-button"]');
    
    // Fill job creation form
    await page.fill('[data-testid="job-title"]', 'Test Job');
    await page.selectOption('[data-testid="job-type"]', 'video');
    
    // Add scene content
    await page.fill('[data-testid="scene-content"]', 'Test scene content');
    
    // Submit form
    await page.click('[data-testid="submit-job"]');
    
    // Should redirect to job details
    await page.waitForURL(/\/workbench\/\d+/);
    
    // Should show job details
    await expect(page.locator('[data-testid="job-title"]')).toContainText('Test Job');
  });

  test('should access job details', async ({ page }) => {
    // Click on first job
    const firstJob = page.locator('[data-testid="job-card"]').first();
    await firstJob.click();
    
    // Should navigate to job details
    await page.waitForURL(/\/workbench\/\d+/);
    
    // Should show job information
    await expect(page.locator('[data-testid="job-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-status"]')).toBeVisible();
  });
});
```

##### Subscription Management Testing
```javascript
// tests/acceptance/subscription-management.test.js
const { test, expect } = require('@playwright/test');

test.describe('Subscription Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.goto('http://localhost:3000/dashboard/subscription');
  });

  test('should display current subscription', async ({ page }) => {
    // Should show subscription details
    await expect(page.locator('[data-testid="current-plan"]')).toBeVisible();
    await expect(page.locator('[data-testid="token-balance"]')).toBeVisible();
  });

  test('should display token usage', async ({ page }) => {
    // Should show token usage information
    await expect(page.locator('[data-testid="token-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="usage-progress"]')).toBeVisible();
  });

  test('should allow plan changes', async ({ page }) => {
    // Click change plan button
    await page.click('[data-testid="change-plan-button"]');
    
    // Should show plan selection
    await expect(page.locator('[data-testid="plan-selection"]')).toBeVisible();
    
    // Should show available plans
    const planCards = page.locator('[data-testid="plan-card"]');
    await expect(planCards).toHaveCountGreaterThan(0);
  });
});
```

### Phase 4: Security Testing
**Duration: 1 day**
**Responsibility: Security Engineer and Senior Developers**

#### 4.1 Authentication Security Testing

##### Token Validation Testing
```javascript
// tests/security/token-validation.test.js
const axios = require('axios');
const jwt = require('jsonwebtoken');

describe('Token Security Testing', () => {
  test('should reject expired tokens', async () => {
    const expiredToken = jwt.sign({
      'https://short-video-creator.com/user_id': 123,
      'https://short-video-creator.com/email': 'test@example.com'
    }, process.env.JWT_SECRET, { expiresIn: '-1h' });

    try {
      await axios.get('http://localhost:3000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${expiredToken}` }
      });
      fail('Should have rejected expired token');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('should reject tokens with invalid signature', async () => {
    const invalidToken = jwt.sign({
      'https://short-video-creator.com/user_id': 123,
      'https://short-video-creator.com/email': 'test@example.com'
    }, 'wrong-secret');

    try {
      await axios.get('http://localhost:3000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${invalidToken}` }
      });
      fail('Should have rejected invalid token');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('should reject tokens with modified claims', async () => {
    // Create valid token
    const validToken = jwt.sign({
      'https://short-video-creator.com/user_id': 123,
      'https://short-video-creator.com/email': 'test@example.com'
    }, process.env.JWT_SECRET);

    // Manually modify token payload (this would break signature)
    const parts = validToken.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    payload['https://short-video-creator.com/user_id'] = 456; // Change user ID
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64');
    const modifiedToken = parts.join('.');

    try {
      await axios.get('http://localhost:3000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${modifiedToken}` }
      });
      fail('Should have rejected modified token');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });
});
```

##### Authorization Testing
```javascript
// tests/security/authorization.test.js
const axios = require('axios');
const jwt = require('jsonwebtoken');

describe('Authorization Security Testing', () => {
  test('should prevent access to other users data', async () => {
    const userToken = jwt.sign({
      'https://short-video-creator.com/user_id': 123,
      'https://short-video-creator.com/email': 'user@example.com',
      'https://short-video-creator.com/is_admin': false
    }, process.env.JWT_SECRET);

    try {
      await axios.get('http://localhost:3000/api/subscription/subscriptions/user/456', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      fail('Should have prevented access to other user data');
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });

  test('should prevent regular users from accessing admin endpoints', async () => {
    const userToken = jwt.sign({
      'https://short-video-creator.com/user_id': 123,
      'https://short-video-creator.com/email': 'user@example.com',
      'https://short-video-creator.com/is_admin': false
    }, process.env.JWT_SECRET);

    try {
      await axios.get('http://localhost:3000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      fail('Should have prevented admin access');
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });

  test('should allow admin users to access admin endpoints', async () => {
    const adminToken = jwt.sign({
      'https://short-video-creator.com/user_id': 1,
      'https://short-video-creator.com/email': 'admin@example.com',
      'https://short-video-creator.com/is_admin': true
    }, process.env.JWT_SECRET);

    const response = await axios.get('http://localhost:3000/api/admin/health', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    expect(response.status).toBe(200);
  });
});
```

##### Input Validation Testing
```javascript
// tests/security/input-validation.test.js
const axios = require('axios');
const jwt = require('jsonwebtoken');

describe('Input Validation Security', () => {
  let authToken;

  beforeAll(() => {
    authToken = jwt.sign({
      'https://short-video-creator.com/user_id': 123,
      'https://short-video-creator.com/email': 'test@example.com'
    }, process.env.JWT_SECRET);
  });

  test('should validate required fields', async () => {
    try {
      await axios.post('http://localhost:3000/api/job/jobs', {
        // Missing required fields
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      fail('Should have validated required fields');
    } catch (error) {
      expect(error.response.status).toBe(400);
    }
  });

  test('should sanitize malicious input', async () => {
    const maliciousData = {
      title: '<script>alert("xss")</script>',
      type: 'video',
      scenes: [{ content: 'normal content' }]
    };

    const response = await axios.post('http://localhost:3000/api/job/jobs', maliciousData, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(201);
    // Verify the malicious script was sanitized
    expect(response.data.title).not.toContain('<script>');
  });
});
```

### Phase 5: Performance Testing
**Duration: 1 day**
**Responsibility: Performance Engineers**

#### 5.1 Load Testing
```javascript
// tests/performance/load-testing.js
const autocannon = require('autocannon');
const jwt = require('jsonwebtoken');

describe('Performance Load Testing', () => {
  const authToken = jwt.sign({
    'https://short-video-creator.com/user_id': 123,
    'https://short-video-creator.com/email': 'test@example.com'
  }, process.env.JWT_SECRET);

  test('should handle concurrent authentication requests', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/api/auth/profile',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      connections: 100,
      duration: 30,
      pipelining: 1
    });

    expect(result.non2xx).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.throughput.average).toBeGreaterThan(1000); // requests per second
  });

  test('should handle concurrent job requests', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/api/job/jobs',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      connections: 50,
      duration: 30
    });

    expect(result.non2xx).toBe(0);
    expect(result.errors).toBe(0);
    expect(result.latency.p95).toBeLessThan(1000); // 95th percentile under 1 second
  });
});
```

#### 5.2 Memory and Resource Testing
```javascript
// tests/performance/memory-testing.js
const { spawn } = require('child_process');
const pidusage = require('pidusage');

describe('Memory Usage Testing', () => {
  test('should not have memory leaks during authentication', async () => {
    const server = spawn('node', ['backend/api-gateway/server.js']);
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const initialStats = await pidusage(server.pid);
    
    // Simulate 1000 authentication requests
    const promises = [];
    const authToken = jwt.sign({
      'https://short-video-creator.com/user_id': 123,
      'https://short-video-creator.com/email': 'test@example.com'
    }, process.env.JWT_SECRET);

    for (let i = 0; i < 1000; i++) {
      promises.push(
        axios.get('http://localhost:3000/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      );
    }
    
    await Promise.all(promises);
    
    // Wait for garbage collection
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const finalStats = await pidusage(server.pid);
    
    // Memory should not increase significantly
    const memoryIncrease = finalStats.memory - initialStats.memory;
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    
    server.kill();
  });
});
```

## Test Data and Environment Setup

### Test Users
```sql
-- Create test users in database
INSERT INTO users (email, name, auth0_id, subscription_plan_id, is_admin) VALUES
('test.user@example.com', 'Test User', 'google-oauth2|test123', 2, false),
('admin.user@example.com', 'Admin User', 'google-oauth2|admin123', 3, true),
('free.user@example.com', 'Free User', 'google-oauth2|free123', 1, false);
```

### Test Environment Configuration
```bash
# Test environment variables
TEST_EMAIL=test.user@example.com
TEST_PASSWORD=TestPassword123!
ADMIN_EMAIL=admin.user@example.com
ADMIN_PASSWORD=AdminPassword123!

# JWT Secret for testing
JWT_SECRET=test-jwt-secret-key

# Auth0 Test Configuration
AUTH0_DOMAIN=test-tenant.auth0.com
AUTH0_CLIENT_ID=test-client-id
AUTH0_CLIENT_SECRET=test-client-secret

# Database connection for tests
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/test_db

# Service URLs for testing
API_GATEWAY_URL=http://localhost:3000
JOB_SERVICE_URL=http://localhost:3003
SUBSCRIPTION_SERVICE_URL=http://localhost:3002
```

### Automated Test Scripts

#### Run All Tests
```bash
#!/bin/bash
# scripts/run-all-tests.sh

echo "🧪 Starting comprehensive authentication migration testing..."

# Set test environment
export NODE_ENV=test
export DATABASE_URL=$TEST_DATABASE_URL

# Start test services
echo "🚀 Starting test services..."
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Run unit tests
echo "🔬 Running unit tests..."
npm run test:unit

# Run integration tests
echo "🔗 Running integration tests..."
npm run test:integration

# Run security tests
echo "🔒 Running security tests..."
npm run test:security

# Run performance tests
echo "⚡ Running performance tests..."
npm run test:performance

# Run user acceptance tests
echo "👥 Running user acceptance tests..."
npm run test:acceptance

echo "✅ All tests completed!"

# Clean up
docker-compose -f docker-compose.test.yml down
```

#### Test Report Generation
```javascript
// scripts/generate-test-report.js
const fs = require('fs');
const path = require('path');

function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length
    },
    results: results,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      branch: process.env.GIT_BRANCH || 'unknown'
    }
  };

  const reportPath = path.join(__dirname, '../test-reports', `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📊 Test report generated: ${reportPath}`);
  return report;
}

module.exports = { generateTestReport };
```

## Testing Checklist

### Pre-Testing Setup
- [ ] Test environment configured
- [ ] Test database populated with sample data
- [ ] All services running in test mode
- [ ] Test user accounts created in Auth0
- [ ] Environment variables configured
- [ ] Test tokens generated

### Unit Testing
- [ ] Auth0 Action tests passing
- [ ] Unified Auth middleware tests passing
- [ ] User lookup controller tests passing
- [ ] Frontend auth hook tests passing
- [ ] Auth context tests passing
- [ ] All mocks and stubs working correctly

### Integration Testing
- [ ] Auth0 end-to-end flow working
- [ ] API authentication working
- [ ] Service-to-service communication working
- [ ] Cross-domain requests working
- [ ] Token refresh working
- [ ] Error handling working correctly

### User Acceptance Testing
- [ ] Login flow working in browser
- [ ] Authentication persistence working
- [ ] Job management working
- [ ] Subscription management working
- [ ] Logout working correctly
- [ ] Cross-tab synchronization working

### Security Testing
- [ ] Token validation secure
- [ ] Authorization checks working
- [ ] Input validation working
- [ ] No unauthorized access possible
- [ ] Admin restrictions working
- [ ] SQL injection prevention working

### Performance Testing
- [ ] Load testing passing
- [ ] Memory usage acceptable
- [ ] Response times acceptable
- [ ] No memory leaks detected
- [ ] Database performance acceptable
- [ ] Concurrent user handling working

### Post-Testing Validation
- [ ] All test reports generated
- [ ] Critical issues documented
- [ ] Performance benchmarks recorded
- [ ] Security scan completed
- [ ] Test environment cleaned up

## Success Criteria

### Functional Requirements
- [ ] ✅ 100% of unit tests passing
- [ ] ✅ 100% of integration tests passing
- [ ] ✅ 95%+ of acceptance tests passing
- [ ] ✅ Zero critical security vulnerabilities
- [ ] ✅ Performance within acceptable limits

### Non-Functional Requirements
- [ ] ✅ Authentication response time < 500ms
- [ ] ✅ API response time < 2 seconds
- [ ] ✅ Memory usage stable over time
- [ ] ✅ No data corruption detected
- [ ] ✅ Cross-browser compatibility verified

### Business Requirements
- [ ] ✅ All user flows working correctly
- [ ] ✅ No impact on existing functionality
- [ ] ✅ Backward compatibility maintained
- [ ] ✅ Admin functions accessible
- [ ] ✅ Billing and subscriptions working

## Next Steps

After successful testing:
1. **Document Results** - Create comprehensive test report
2. **Address Issues** - Fix any identified problems
3. **Performance Optimization** - Optimize based on test results
4. **Prepare Rollback** - Document rollback procedures
5. **Production Deployment** - Proceed with production migration

For testing issues, refer to:
- [Rollback Plan](./09_Rollback_Plan.md)
- [Code Examples](./10_Code_Examples.md)
- [Troubleshooting Guide](./12_Troubleshooting.md) 