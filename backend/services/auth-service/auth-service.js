// auth-service.js
const { auth0Management } = require('./auth0');
const authDataAccess = require('./data/authDataAccess');
const logger = require('../../shared/utils/logger');
const knex = require('../../shared/database/knex');

class AuthService {
  async getUserProfile(auth0Id) {
    try {
      // Get user from our database
      const user = await authDataAccess.findUserByAuth0Id(auth0Id);
      
      if (!user) {
        // If user doesn't exist in our db, get from Auth0 and create
        const auth0User = await auth0Management.getUser({ id: auth0Id });
        return await authDataAccess.createUser({
          auth0Id: auth0User.user_id,
          email: auth0User.email,
          name: auth0User.name,
          picture: auth0User.picture,
          provider: auth0User.identities[0].provider
        });
      }

      return user;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(auth0Id, userData) {
    try {
      // Update in Auth0
      await auth0Management.updateUser({ id: auth0Id }, {
        name: userData.name,
        picture: userData.picture
      });

      // Update in our database
      return await authDataAccess.updateUser(auth0Id, userData);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  async deleteUser(auth0Id) {
    try {
      // Delete from Auth0
      await auth0Management.deleteUser({ id: auth0Id });

      // Delete from our database
      await authDataAccess.deleteUser(auth0Id);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async syncUserWithAuth0(auth0Id) {
    try {
      const auth0User = await auth0Management.getUser({ id: auth0Id });
      return await authDataAccess.updateUser(auth0Id, {
        email: auth0User.email,
        name: auth0User.name,
        picture: auth0User.picture
      });
    } catch (error) {
      logger.error('Error syncing user with Auth0:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();