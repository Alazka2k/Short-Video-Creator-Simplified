const { ManagementClient } = require('auth0');
const config = require('../../config/default.json');

async function updateAuth0Settings(env) {
  const management = new ManagementClient({
    domain: config.auth.auth0.domain,
    clientId: config.auth.auth0.clientId,
    clientSecret: config.auth.auth0.clientSecret
  });

  const settings = environments[env];
  if (!settings) {
    throw new Error(`Unknown environment: ${env}`);
  }

  try {
    // Update API settings
    await management.updateResourceServer({ 
      id: config.auth.auth0.audience,
      token_lifetime: settings.tokenExpiration,
      token_lifetime_for_web: settings.tokenExpirationImplicit,
      refresh_token: {
        rotation_type: settings.refreshTokenRotation ? 'rotating' : 'non-rotating',
        expiration_type: 'expiring',
        leeway: 15, // 15 seconds leeway for clock skew
        token_lifetime: settings.tokenExpiration
      }
    });

    console.log(`Successfully updated Auth0 settings for ${env} environment`);
  } catch (error) {
    console.error('Failed to update Auth0 settings:', error);
    throw error;
  }
}

// Add to package.json scripts:
// "deploy:auth:dev": "node deployment/scripts/update-auth0-settings.js development",
// "deploy:auth:staging": "node deployment/scripts/update-auth0-settings.js staging",
// "deploy:auth:prod": "node deployment/scripts/update-auth0-settings.js production" 