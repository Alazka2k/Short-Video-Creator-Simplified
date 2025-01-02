const { ManagementClient, AuthenticationClient } = require('auth0');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');

// Initialize Auth0 management client
const auth0Management = new ManagementClient({
  domain: config.auth.auth0.domain,
  clientId: config.auth.auth0.clientId,
  clientSecret: config.auth.auth0.clientSecret,
  audience: `https://${config.auth.auth0.domain}/api/v2/`,
  scope: 'read:users update:users create:users'
});

// Initialize Auth0 authentication client
const auth0Authentication = new AuthenticationClient({
  domain: config.auth.auth0.domain,
  clientId: config.auth.auth0.clientId,
  clientSecret: config.auth.auth0.clientSecret
});

// Initialize Auth0 helper methods
const auth0 = {
  getUser: async (id) => {
    try {
      return await auth0Management.users.get({ id });
    } catch (error) {
      logger.error('Error getting user from Auth0:', error);
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

  requestChangePasswordEmail: async ({ email, connection }) => {
    try {
      return await auth0Authentication.requestChangePasswordEmail({ email, connection });
    } catch (error) {
      logger.error('Error requesting password change email:', error);
      throw error;
    }
  }
};

// Log configuration (without sensitive data)
logger.info('Auth0 Configuration:', {
  domain: config.auth.auth0.domain,
  audience: `https://${config.auth.auth0.domain}/api/v2/`,
  hasClientId: !!config.auth.auth0.clientId,
  hasClientSecret: !!config.auth.auth0.clientSecret
});

module.exports = {
  auth0Management,
  auth0Authentication,
  auth0
};
