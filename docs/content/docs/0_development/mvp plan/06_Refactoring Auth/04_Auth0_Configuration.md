# Auth0 Configuration Guide

## Overview

This document provides step-by-step instructions for configuring Auth0 to support JWT tokens with custom claims. This is the first phase of the authentication migration.

## Prerequisites

- Auth0 Dashboard access with admin permissions
- Access to your backend services at `narravid.io`
- M2M token for backend API calls
- Understanding of Auth0 Actions and custom claims

## Configuration Steps

### Step 1: Create Post-Login Action

#### 1.1 Navigate to Auth0 Actions
1. Log in to your Auth0 Dashboard
2. Navigate to **Actions** → **Library**
3. Click **Create Action**
4. Select **Build from scratch**

#### 1.2 Action Configuration
- **Name**: `Add Custom Claims`
- **Trigger**: `Login / Post Login`
- **Runtime**: `Node.js 18`

#### 1.3 Action Code
Replace the default code with the following:

```javascript
/**
 * Post-Login Action: Add Custom Claims
 * 
 * This action runs after successful user login and adds custom claims
 * to the access token with user information from our backend database.
 * 
 * For social logins (Google, Facebook, etc.), it calls our backend
 * to get/create the user record and embed that information in the JWT.
 * 
 * For Auth0 database users, it uses the Auth0 user data directly.
 */
exports.onExecutePostLogin = async (event, api) => {
  // Custom claims namespace (must be a valid URL)
  const namespace = 'https://short-video-creator.com/';
  
  try {
    console.log('Post-login action triggered for user:', event.user.user_id);
    
    // Determine if this is a social login or Auth0 database user
    const provider = event.user.user_id.split('|')[0];
    const isSocialLogin = provider !== 'auth0';
    
    if (isSocialLogin) {
      console.log('Social login detected, provider:', provider);
      
      // For social logins, sync with our backend to get/create user record
      try {
        const response = await fetch(`${event.secrets.BACKEND_URL}/api/auth/user-lookup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${event.secrets.BACKEND_M2M_TOKEN}`,
            'x-service-auth': event.secrets.SERVICE_AUTH_TOKEN
          },
          body: JSON.stringify({
            auth0_id: event.user.user_id,
            email: event.user.email,
            name: event.user.name,
            picture: event.user.picture,
            provider: provider === 'google-oauth2' ? 'google' : provider
          })
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('Backend user lookup successful for user ID:', userData.user_id);
          
          // Add custom claims with backend user data
          api.accessToken.setCustomClaim(`${namespace}user_id`, userData.user_id);
          api.accessToken.setCustomClaim(`${namespace}email`, userData.email);
          api.accessToken.setCustomClaim(`${namespace}name`, userData.name);
          api.accessToken.setCustomClaim(`${namespace}picture`, userData.picture);
          api.accessToken.setCustomClaim(`${namespace}provider`, userData.provider);
          api.accessToken.setCustomClaim(`${namespace}is_admin`, userData.is_admin || false);
          api.accessToken.setCustomClaim(`${namespace}permissions`, userData.permissions || []);
          api.accessToken.setCustomClaim(`${namespace}subscription_plan_id`, userData.subscription_plan_id || 1);
          
        } else {
          console.error('Backend user lookup failed:', response.status, await response.text());
          
          // Fallback: use Auth0 data with default values
          const fallbackUserId = parseInt(event.user.user_id.split('|')[1]) || 0;
          api.accessToken.setCustomClaim(`${namespace}user_id`, fallbackUserId);
          api.accessToken.setCustomClaim(`${namespace}email`, event.user.email);
          api.accessToken.setCustomClaim(`${namespace}name`, event.user.name);
          api.accessToken.setCustomClaim(`${namespace}picture`, event.user.picture);
          api.accessToken.setCustomClaim(`${namespace}provider`, provider);
          api.accessToken.setCustomClaim(`${namespace}is_admin`, false);
          api.accessToken.setCustomClaim(`${namespace}permissions`, []);
          api.accessToken.setCustomClaim(`${namespace}subscription_plan_id`, 1);
        }
        
      } catch (fetchError) {
        console.error('Error calling backend user lookup:', fetchError);
        
        // Fallback: use Auth0 data
        const fallbackUserId = parseInt(event.user.user_id.split('|')[1]) || 0;
        api.accessToken.setCustomClaim(`${namespace}user_id`, fallbackUserId);
        api.accessToken.setCustomClaim(`${namespace}email`, event.user.email);
        api.accessToken.setCustomClaim(`${namespace}name`, event.user.name);
        api.accessToken.setCustomClaim(`${namespace}picture`, event.user.picture);
        api.accessToken.setCustomClaim(`${namespace}provider`, provider);
        api.accessToken.setCustomClaim(`${namespace}is_admin`, false);
        api.accessToken.setCustomClaim(`${namespace}permissions`, []);
        api.accessToken.setCustomClaim(`${namespace}subscription_plan_id`, 1);
      }
      
    } else {
      console.log('Auth0 database user detected');
      
      // For Auth0 database users, use Auth0 data directly
      const userId = parseInt(event.user.user_id.split('|')[1]) || 0;
      
      api.accessToken.setCustomClaim(`${namespace}user_id`, userId);
      api.accessToken.setCustomClaim(`${namespace}email`, event.user.email);
      api.accessToken.setCustomClaim(`${namespace}name`, event.user.name);
      api.accessToken.setCustomClaim(`${namespace}picture`, event.user.picture);
      api.accessToken.setCustomClaim(`${namespace}provider`, 'auth0');
      api.accessToken.setCustomClaim(`${namespace}is_admin`, false);
      api.accessToken.setCustomClaim(`${namespace}permissions`, []);
      api.accessToken.setCustomClaim(`${namespace}subscription_plan_id`, 1);
    }
    
    console.log('Custom claims added successfully');
    
  } catch (error) {
    console.error('Error in post-login action:', error);
    // Don't fail the login - just log the error and continue
    // The frontend can handle authentication without custom claims as fallback
  }
};

/**
 * Optional: Post-login action that runs on token refresh
 * This ensures custom claims are always present in refreshed tokens
 */
exports.onExecutePostLogin = async (event, api) => {
  // Run the same logic as above for token refresh
  await exports.onExecutePostLogin(event, api);
};
```

### Step 2: Configure Action Secrets

Secrets store sensitive configuration values that your Action needs to access.

#### 2.1 Add Required Secrets
In the Action editor, click on the **Secrets** tab and add:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `BACKEND_URL` | `https://narravid.io/api` | Your backend API base URL |
| `BACKEND_M2M_TOKEN` | `[your-m2m-token]` | M2M token for backend API authentication |
| `SERVICE_AUTH_TOKEN` | `[your-service-token]` | Service authentication token |

#### 2.2 Get M2M Token
If you don't have an M2M token:

1. Go to **Applications** → **Machine to Machine Applications**
2. Find or create an application for Auth0 Actions
3. Authorize it for your API with required scopes:
   - `read:users`
   - `create:users`
   - `update:users`
4. Copy the token from the application settings

### Step 3: Test the Action

#### 3.1 Save and Deploy
1. Click **Save Draft**
2. Click **Deploy** to make the action available

#### 3.2 Test in Auth0 Dashboard
1. Go to **Actions** → **Library**
2. Find your action and click **Test**
3. Use sample event data to test the action logic
4. Verify the action runs without errors

### Step 4: Add Action to Login Flow

#### 4.1 Navigate to Flows
1. Go to **Actions** → **Flows**
2. Click on **Login**

#### 4.2 Add Action to Flow
1. Drag your **Add Custom Claims** action from the right panel
2. Drop it in the flow after the login event
3. Click **Apply** to save the flow

#### 4.3 Deploy Flow
1. Click **Deploy** to make the flow active
2. Confirm the deployment

### Step 5: Create Backend User Lookup Endpoint

The Auth0 Action needs to call your backend to get user information. Create this endpoint:

#### 5.1 Create Controller
**File**: `backend/services/auth-service/controllers/user-lookup-controller.js`

```javascript
/**
 * User Lookup Controller for Auth0 Actions
 * 
 * This endpoint is called by Auth0 Actions during the login process
 * to get or create user records for embedding in JWT custom claims.
 */

const authDataAccess = require('../data/authDataAccess');
const logger = require('../../../shared/utils/logger');

const lookupUser = async (req, res) => {
  try {
    const { auth0_id, email, name, picture, provider } = req.body;
    
    logger.info('User lookup request from Auth0 Action:', { 
      auth0_id, 
      email, 
      provider 
    });
    
    // Validate required fields
    if (!auth0_id || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: auth0_id, email' 
      });
    }
    
    // Try to find existing user
    let user = await authDataAccess.findUserByAuth0Id(auth0_id);
    
    if (!user) {
      // Create new user if doesn't exist
      logger.info('Creating new user for Auth0 ID:', auth0_id);
      
      user = await authDataAccess.createUser({
        auth0_id,
        email,
        name: name || email.split('@')[0], // Use email prefix if no name
        picture,
        provider: provider || 'unknown',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      logger.info('Successfully created new user:', { 
        user_id: user.user_id, 
        email: user.email 
      });
    } else {
      // Update existing user with latest Auth0 data
      const updateData = {};
      
      if (name && name !== user.name) updateData.name = name;
      if (picture && picture !== user.picture) updateData.picture = picture;
      
      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date();
        await authDataAccess.updateUser(user.user_id, updateData);
        logger.info('Updated user data:', { user_id: user.user_id, updateData });
        
        // Refresh user object
        user = await authDataAccess.findUserByAuth0Id(auth0_id);
      }
    }
    
    // Get user's subscription plan (default to free tier if none)
    const subscription = await authDataAccess.getUserSubscription(user.user_id);
    
    // Return user data for JWT claims
    const userData = {
      user_id: user.user_id,
      email: user.email,
      name: user.name || user.full_name,
      picture: user.picture,
      provider: user.provider,
      is_admin: user.is_admin || false,
      permissions: user.permissions || [],
      subscription_plan_id: subscription?.plan_id || 1, // Default to free tier
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    
    logger.info('Returning user data for custom claims:', { 
      user_id: userData.user_id,
      email: userData.email,
      subscription_plan_id: userData.subscription_plan_id
    });
    
    res.json(userData);
    
  } catch (error) {
    logger.error('Error in user lookup controller:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to lookup user data'
    });
  }
};

module.exports = {
  lookupUser
};
```

#### 5.2 Add Route
**File**: `backend/api-gateway/routes/auth.js`

Add this route to handle Auth0 Action calls:

```javascript
// Add this import at the top
const userLookupController = require('../../services/auth-service/controllers/user-lookup-controller');

// Add this route
router.post('/user-lookup', serviceAuthMiddleware, async (req, res) => {
  try {
    await userLookupController.lookupUser(req, res);
  } catch (error) {
    logger.error('Error in user lookup route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Step 6: Test Custom Claims

#### 6.1 Test Login Flow
1. Open your application
2. Log in with a test user
3. Check browser network tab for the access token
4. Decode the JWT token to verify custom claims

#### 6.2 Verify Custom Claims
The JWT token should contain claims like:
```json
{
  "https://short-video-creator.com/user_id": 123,
  "https://short-video-creator.com/email": "user@example.com",
  "https://short-video-creator.com/name": "Test User",
  "https://short-video-creator.com/provider": "google",
  "https://short-video-creator.com/is_admin": false,
  "https://short-video-creator.com/permissions": [],
  "https://short-video-creator.com/subscription_plan_id": 1
}
```

#### 6.3 Test with Different User Types
- Test with Google social login
- Test with Auth0 database user
- Test with new user registration
- Test with existing user login

### Step 7: Monitor and Debug

#### 7.1 Check Action Logs
1. Go to **Monitoring** → **Logs** in Auth0 Dashboard
2. Filter by your Action name
3. Check for any errors or warnings

#### 7.2 Debug Common Issues
- **Backend endpoint not reachable**: Check BACKEND_URL and network access
- **M2M token invalid**: Verify token has correct scopes and hasn't expired
- **Custom claims not appearing**: Check namespace format and Action deployment
- **Action timeout**: Optimize backend response time

### Step 8: Production Configuration

#### 8.1 Environment Variables
Ensure these are set in your production environment:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=[your-tenant].auth0.com
AUTH0_AUDIENCE=https://narravid.io/api
CUSTOM_CLAIMS_NAMESPACE=https://short-video-creator.com/

# Backend Configuration  
BACKEND_URL=https://narravid.io/api
SERVICE_AUTH_TOKEN=[your-service-token]
```

#### 8.2 Security Considerations
- Use HTTPS for all API calls
- Validate M2M tokens have minimal required scopes
- Monitor Action logs for security issues
- Rotate M2M tokens regularly

## Troubleshooting

### Common Issues

#### Issue: Action fails with network error
**Solution**: Check BACKEND_URL and ensure backend is accessible from Auth0

#### Issue: Custom claims not in token
**Solutions**:
- Verify Action is deployed and in Login flow
- Check Action logs for errors
- Verify namespace format (must be valid URL)

#### Issue: Backend user lookup fails
**Solutions**:
- Check M2M token has correct scopes
- Verify backend endpoint is working
- Check service authentication token

#### Issue: Performance issues
**Solutions**:
- Optimize backend user lookup endpoint
- Add caching for user data
- Monitor Action execution time

### Testing Checklist

- [ ] Auth0 Action deploys without errors
- [ ] Backend user lookup endpoint responds correctly
- [ ] Custom claims appear in JWT tokens
- [ ] Social login users get backend user data
- [ ] Auth0 database users get default data
- [ ] New users are created in backend
- [ ] Existing users are updated correctly
- [ ] Action logs show no errors
- [ ] Performance is acceptable (<2 seconds)

## Next Steps

Once Auth0 configuration is complete:

1. **Verify** all tests pass and custom claims are working
2. **Document** any configuration changes made
3. **Proceed** to [Backend Implementation](./05_Backend_Implementation.md)
4. **Notify** the team that Phase 1 is complete

## Rollback Plan

If issues occur during Auth0 configuration:

1. **Immediate**: Remove Action from Login Flow
2. **Short-term**: Delete or disable the Action
3. **Restore**: Previous authentication configuration

The system will continue working with the current M2M + x-user-token pattern if the Action is disabled. 