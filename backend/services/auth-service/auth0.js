const { ManagementClient } = require('auth0');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

// Initialize Auth0 management client
const auth0Management = new ManagementClient({
  domain: config.auth.auth0.domain,
  clientId: config.auth.auth0.clientId,
  clientSecret: config.auth.auth0.clientSecret,
  audience: config.auth.auth0.audience
});

// Initialize Auth0 authentication client
const auth0 = {
  getUser: async (id) => {
    try {
      return await auth0Management.getUser({ id });
    } catch (error) {
      logger.error('Error getting user from Auth0:', error);
      throw error;
    }
  },

  updateUser: async (id, updates) => {
    try {
      return await auth0Management.updateUser({ id }, updates);
    } catch (error) {
      logger.error('Error updating user in Auth0:', error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      return await auth0Management.deleteUser({ id });
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
  auth0
}; 