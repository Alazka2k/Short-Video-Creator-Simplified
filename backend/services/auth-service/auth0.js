/**
 * Auth0 Service Integration
 * 
 * This module provides integration with Auth0's Management API and Authentication API.
 * It's used for managing users, roles, and permissions in Auth0, as well as
 * handling authentication flows.
 * 
 * Key Features:
 * 1. Management API Client - For user/role/permission management
 * 2. Authentication API Client - For login, signup, and token operations
 * 
 * Usage:
 * - Management API: Used for admin operations (create users, assign roles, etc.)
 * - Authentication API: Used for authentication flows (login, signup, password reset)
 * 
 * @module auth-service/auth0-service
 */

const { ManagementClient, AuthenticationClient } = require('auth0');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

// Get Auth0 configuration from the centralized config
const auth0Config = config.auth.auth0;

// Log configuration (without sensitive data)
logger.info('Auth0 Service Configuration:', {
  domain: auth0Config.domain,
  audience: auth0Config.audience,
  hasClientId: !!auth0Config.clientId,
  hasClientSecret: !!auth0Config.clientSecret,
  environment: process.env.NODE_ENV
});

/**
 * Auth0 Management API Client
 * Used for administrative tasks like:
 * - Creating/updating users
 * - Managing roles and permissions
 * - Retrieving user profiles
 */
const managementClient = new ManagementClient({
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
  clientSecret: auth0Config.clientSecret,
  scope: 'read:users update:users create:users delete:users'
});

/**
 * Auth0 Authentication API Client
 * Used for authentication operations like:
 * - Password-based login
 * - Social login
 * - Signup
 * - Password reset
 */
const authenticationClient = new AuthenticationClient({
  domain: auth0Config.domain,
  clientId: auth0Config.clientId
});

module.exports = {
  managementClient,
  authenticationClient,
  domain: auth0Config.domain,
  audience: auth0Config.audience
};
