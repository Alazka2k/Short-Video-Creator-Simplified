/**
 * Auth0 Service Configuration
 * 
 * This module initializes and exports the Auth0 SDK clients used throughout the application.
 * It provides three main Auth0 clients:
 * 
 * 1. auth0: The main Auth0 client for user management operations
 * 2. auth0Management: The Management API client for administrative operations
 * 3. auth0Authentication: The Authentication API client for login operations
 * 
 * Environment Variables Required:
 * - AUTH0_DOMAIN: Your Auth0 domain
 * - AUTH0_CLIENT_ID: Your Auth0 application client ID
 * - AUTH0_CLIENT_SECRET: Your Auth0 application client secret
 * - AUTH0_AUDIENCE: Your Auth0 API identifier
 * 
 * @module auth-service/auth0
 */

const { ManagementClient, AuthenticationClient } = require('auth0');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');

// Initialize Auth0 Management API client
const auth0Management = new ManagementClient({
  domain: config.auth.auth0.domain,
  clientId: config.auth.auth0.clientId,
  clientSecret: config.auth.auth0.clientSecret,
});

// Initialize Auth0 Authentication API client
const auth0Authentication = new AuthenticationClient({
  domain: config.auth.auth0.domain,
  clientId: config.auth.auth0.clientId,
});

// Export configured clients
module.exports = {
  auth0: auth0Authentication,  // Main client for user operations
  auth0Management,            // For administrative operations
  auth0Authentication        // For authentication operations
};
