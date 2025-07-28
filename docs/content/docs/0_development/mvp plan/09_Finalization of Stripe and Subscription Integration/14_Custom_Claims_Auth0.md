## Old Custom Claims

```javascript
/**
 * Post-Login Action: Add Custom Claims to Access Token
 *
 * This action runs after a user successfully logs in. It calls our backend's
 * /api/auth/user-lookup endpoint to get or create a user record in our database.
 * The user's internal ID, roles, and subscription status are then added as
 * custom claims to the JWT access token.
 */
exports.onExecutePostLogin = async (event, api) => {
  // The namespace for our custom claims MUST be a valid URL.
  const namespace = 'https://short-video-creator.com/';

  try {
    const { user, secrets } = event;

    // Call our backend to get the full user profile.
    const response = await fetch(`${secrets.API_GATEWAY_SERVICE_URL}/api/auth/user-lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // A service-to-service auth token to secure the endpoint.
        'x-service-auth': secrets.SERVICE_AUTH_TOKEN,
      },
      body: JSON.stringify({
        auth0_id: user.user_id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.identities[0]?.provider,
      }),
    });

    if (!response.ok) {
      console.error('Backend user lookup failed:', response.status, await response.text());
      // We don't want to fail the login.
      return;
    }

    // CORRECTED LINE: Assign the entire JSON response to userData.
    const userData = await response.json();

    // Set the custom claims on the access token.
    api.accessToken.setCustomClaim(`${namespace}user_id`, userData.user_id);
    api.accessToken.setCustomClaim(`${namespace}email`, userData.email);
    api.accessToken.setCustomClaim(`${namespace}name`, userData.name);
    api.accessToken.setCustomClaim(`${namespace}is_admin`, userData.is_admin || false);
    api.accessToken.setCustomClaim(`${namespace}permissions`, userData.permissions || []);
    api.accessToken.setCustomClaim(`${namespace}subscription_plan_id`, userData.subscription_plan_id || 1);

    console.log(`Custom claims added for user: ${userData.email}`);

  } catch (error) {
    console.error('Error in post-login action:', error);
  }
};
```

## New custom claims:

```javascript
/**
 * Post-Login Action: Add Custom Claims to Access Token
 *
 * This action runs after a user successfully logs in. It calls our backend's
 * /api/auth/user-lookup endpoint to get or create a user record in our database.
 * The user's internal ID, roles, and subscription status are then added as
 * custom claims to the JWT access token.
 */
exports.onExecutePostLogin = async (event, api) => {
  // The namespace for our custom claims MUST be a valid URL.
  const namespace = 'https://short-video-creator.com/';

  try {
    const { user, secrets } = event;

    // Add a cache-busting timestamp to the URL to ensure fresh data is fetched.
    const url = new URL(`${secrets.API_GATEWAY_SERVICE_URL}/api/auth/user-lookup`);
    url.searchParams.set('timestamp', Date.now());

    // Call our backend to get the full user profile.
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // A service-to-service auth token to secure the endpoint.
        'x-service-auth': secrets.SERVICE_AUTH_TOKEN,
      },
      body: JSON.stringify({
        auth0_id: user.user_id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.identities[0]?.provider,
      }),
    });

    if (!response.ok) {
      console.error('Backend user lookup failed:', response.status, await response.text());
      // We don't want to fail the login.
      return;
    }

    const userData = await response.json();

    // Set the custom claims on the access token.
    api.accessToken.setCustomClaim(`${namespace}user_id`, userData.user_id);
    api.accessToken.setCustomClaim(`${namespace}email`, userData.email);
    api.accessToken.setCustomClaim(`${namespace}name`, userData.name);
    api.accessToken.setCustomClaim(`${namespace}is_admin`, userData.is_admin || false);
    api.accessToken.setCustomClaim(`${namespace}permissions`, userData.permissions || []);
    api.accessToken.setCustomClaim(`${namespace}subscription_plan_id`, userData.subscription_plan_id || 1);

    console.log(`Custom claims added for user: ${userData.email}`);

  } catch (error) {
    console.error('Error in post-login action:', error);
  }
};
```
