import { authConfig } from '@/lib/auth/config';

const env = process.env.NODE_ENV;

// Debug logging
console.log('Environment Variables:', {
  env,
  authConfig: authConfig.auth0
});

export const config = {
  auth: {
    auth0: {
      domain: authConfig.auth0.domain,
      clientId: authConfig.auth0.clientId,
      audience: authConfig.auth0.audience,
      redirectUri: authConfig.auth0.redirectUri,
      scope: authConfig.auth0.scope
    }
  }
}; 