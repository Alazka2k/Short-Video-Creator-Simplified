const { ManagementClient, AuthenticationClient } = require('auth0');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const axios = require('axios');

// Debug logging
logger.info('Auth0 Config:', {
  domain: config.auth.auth0.domain,
  clientId: config.auth.auth0.clientId,
  audience: config.auth.auth0.audience
});

// Initialize Auth0 management client
const auth0Management = new ManagementClient({
  domain: config.auth.auth0.domain,
  clientId: config.auth.auth0.clientId,
  clientSecret: config.auth.auth0.clientSecret,
  audience: `https://${config.auth.auth0.domain}/api/v2/`,
  scope: 'read:users update:users delete:users read:user_idp_tokens'
});

// Debug logging
logger.info('Auth0 Management Client:', {
  domain: config.auth.auth0.domain,
  audience: `https://${config.auth.auth0.domain}/api/v2/`,
  hasUsers: !!auth0Management.users
});

// Initialize Auth0 authentication client
const auth0Authentication = new AuthenticationClient({
  domain: config.auth.auth0.domain,
  clientId: config.auth.auth0.clientId,
  clientSecret: config.auth.auth0.clientSecret
});

// Initialize Auth0 authentication client
const auth0 = {
  getUser: async (id) => {
    try {
      logger.info('Attempting to get user with ID:', id);
      return await auth0Management.users.get({ id });
    } catch (error) {
      logger.error('Error getting user from Auth0:', error);
      throw error;
    }
  },

  getAccessTokenForUser: async (userId) => {
    try {
      const response = await axios.post(`https://${config.auth.auth0.domain}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: config.auth.auth0.clientId,
        client_secret: config.auth.auth0.clientSecret,
        audience: config.auth.auth0.audience
      });
      
      return response.data.access_token;
    } catch (error) {
      logger.error('Error getting access token from Auth0:', error);
      throw error;
    }
  },

  updateUser: async (id, updates) => {
    try {
      return await auth0Management.users.update({ id }, updates);
    } catch (error) {
      logger.error('Error updating user in Auth0:', error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      return await auth0Management.users.delete({ id });
    } catch (error) {
      logger.error('Error deleting user from Auth0:', error);
      throw error;
    }
  },

  createOrganization: async (data) => {
    try {
      return await auth0Management.createOrganization(data);
    } catch (error) {
      logger.error('Error creating organization in Auth0:', error);
      throw error;
    }
  },

  addOrganizationMembers: async (orgId, members) => {
    try {
      return await auth0Management.addOrganizationMembers({ id: orgId }, members);
    } catch (error) {
      logger.error('Error adding members to organization in Auth0:', error);
      throw error;
    }
  },

  createOrganizationInvitation: async (orgId, invitation) => {
    try {
      return await auth0Management.createOrganizationInvitation({ id: orgId }, invitation);
    } catch (error) {
      logger.error('Error creating organization invitation in Auth0:', error);
      throw error;
    }
  }
};

// Log Auth0 configuration (without sensitive data)
logger.info('Auth0 Configuration:', {
  domain: config.auth.auth0.domain,
  audience: config.auth.auth0.audience,
  environment: process.env.NODE_ENV
});

module.exports = {
  auth0Management,
  auth0Authentication,
  auth0
}; 