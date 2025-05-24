import { auth0Config } from '@/lib/auth/config';

const env = process.env.NODE_ENV;

// Debug logging only in development
if (env === 'development') {
  console.log('Environment Variables:', {
    env
    //authConfig: auth0Config
  });
}

/**
 * Route configuration for dynamic/authenticated pages
 * Export these directly in any page that should not be statically generated:
 * 
 * Example: 
 * ```
 * export { dynamic, fetchCache, revalidate } from '@/lib/config';
 * ```
 */
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Main application configuration
export const config = {
  auth: {
    auth0: auth0Config
  }
}; 