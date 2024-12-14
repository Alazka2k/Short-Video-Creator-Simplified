// auth-service.js
const { auth0Management } = require('./auth0');
const authDataAccess = require('./data/authDataAccess');
const logger = require('../../shared/utils/logger');
const { generateToken, hashToken } = require('./utils/crypto');

class AuthService {
  // Core functionality
  async getUserProfile(auth0Id) {
    try {
      const user = await authDataAccess.getUserWithRoleAndSubscription(auth0Id);
      
      if (!user) {
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

  async handleSocialLogin(provider, profile) {
    try {
      let user = await authDataAccess.findUserByAuth0Id(profile.sub);
      
      if (!user) {
        user = await authDataAccess.createUser({
          auth0Id: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          provider
        });
      } else {
        user = await authDataAccess.updateUser(profile.sub, {
          email: profile.email,
          name: profile.name,
          picture: profile.picture
        });
      }

      // Create new session
      const sessionId = await authDataAccess.createSession(user.user_id);
      const refreshToken = generateToken();
      
      await authDataAccess.updateSession(sessionId, {
        refresh_token_hash: hashToken(refreshToken)
      });

      return { user, refreshToken };
    } catch (error) {
      logger.error('Social login error:', error);
      throw error;
    }
  }

  async updateUserProfile(auth0Id, userData) {
    try {
      await auth0Management.updateUser({ id: auth0Id }, {
        name: userData.name,
        picture: userData.picture
      });

      return await authDataAccess.updateUser(auth0Id, userData);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Session management
  async refreshToken(refreshToken) {
    try {
      const tokenHash = hashToken(refreshToken);
      const session = await authDataAccess.findValidSession(tokenHash);

      if (!session) {
        throw new Error('Invalid refresh token');
      }

      await authDataAccess.invalidateSession(session.session_id, 'token_refresh');
      const newSessionId = await authDataAccess.createSession(session.user_id);
      const newRefreshToken = generateToken();

      await authDataAccess.updateSession(newSessionId, {
        refresh_token_hash: hashToken(newRefreshToken)
      });

      const user = await authDataAccess.getUserWithRoleAndSubscription(session.user_id);
      return { user, refreshToken: newRefreshToken };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  async logout(sessionId, allDevices = false) {
    try {
      if (allDevices) {
        const session = await authDataAccess.findSessionById(sessionId);
        if (session) {
          await authDataAccess.invalidateAllUserSessions(session.user_id);
        }
      } else {
        await authDataAccess.invalidateSession(sessionId, 'user_logout');
      }
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /* 
  // Email verification - for future implementation
  async sendVerificationEmail(userId, email) {...}
  async verifyEmail(token) {...}

  // Password reset - for future implementation
  async requestPasswordReset(email) {...}
  async resetPassword(token, newPassword) {...}
  */

  async handleNewUser(userData) {
    try {
      // Create or update user
      let user = await authDataAccess.findUserByAuth0Id(userData.auth0Id);
      
      if (!user) {
        user = await authDataAccess.createUser({
          auth0Id: userData.auth0Id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          provider: userData.provider
        });
      }

      // Create new session
      const sessionId = await authDataAccess.createSession(user.user_id);
      const refreshToken = generateToken();
      
      await authDataAccess.updateSession(sessionId, {
        refresh_token_hash: hashToken(refreshToken)
      });

      // Get full user details
      const userWithDetails = await authDataAccess.getUserWithRoleAndSubscription(userData.auth0Id);

      return {
        user: userWithDetails,
        refreshToken
      };
    } catch (error) {
      logger.error('Error handling new user:', error);
      throw error;
    }
  }

  async findValidSession(refreshToken) {
    try {
      const tokenHash = hashToken(refreshToken);
      return await authDataAccess.findValidSession(tokenHash);
    } catch (error) {
      logger.error('Error finding valid session:', error);
      throw error;
    }
  }

  async invalidateAllUserSessions(userId) {
    try {
      await authDataAccess.invalidateAllUserSessions(userId);
    } catch (error) {
      logger.error('Error invalidating all sessions:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();