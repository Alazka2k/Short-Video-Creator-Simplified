import { auth0Config } from '@/lib/auth/config';

const env = process.env.NODE_ENV;

// Debug logging
console.log('Environment Variables:', {
  env,
  authConfig: auth0Config
});

export const config = {
  auth: {
    auth0: auth0Config
  }
}; 