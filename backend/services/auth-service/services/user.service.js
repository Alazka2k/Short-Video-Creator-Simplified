/**
 * User Management Service
 * 
 * Handles all user-related operations including profile management,
 * user creation, and synchronization between Auth0 and local database.
 * 
 * Features:
 * 1. Profile Management - Retrieves and updates user profiles
 * 2. User Creation - Handles new user onboarding
 * 3. Data Synchronization - Keeps Auth0 and local DB in sync
 * 4. Default Settings - Manages user preferences and settings
 * 
 * The service maintains a consistent user data structure and ensures
 * that user information is properly synchronized between Auth0 and
 * our local database, including:
 * - User preferences
 * - Notification settings
 * - API configurations
 * - Role and subscription information
 * 
 * @module auth-service/services/user.service
 */

const { auth0 } = require('../auth0');
const authDataAccess = require('../data/authDataAccess');
const { TokenService, generateToken, hashToken } = require('../utils/token');
const logger = require('../../../shared/utils/logger');

class UserService {
  async getUserProfile(auth0Id) {
    try {
      logger.info('Getting user profile for auth0Id:', auth0Id);
      
      let user = await authDataAccess.getUserWithRoleAndSubscription(auth0Id);
      
      if (!user) {
        logger.info('User not found in database, fetching from Auth0');
        const auth0User = await auth0.getUser(auth0Id);
        user = await authDataAccess.createUser({
          auth0_id: auth0User.user_id,
          email: auth0User.email,
          name: auth0User.name || auth0User.email.split('@')[0],
          picture: auth0User.picture,
          provider: auth0User.identities[0].provider
        });
      }

      // Ensure we return a consistent user object structure
      return {
        id: user.user_id,
        email: user.email,
        name: user.full_name || user.name,
        picture: user.picture,
        provider: user.provider,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
        video_preferences: user.video_preferences || {
          defaultStyle: "modern",
          defaultVoice: "neural-1",
          defaultLanguage: "en",
          defaultResolution: "1080p",
          defaultAspectRatio: "16:9"
        },
        notification_settings: user.notification_settings || {
          emailNotifications: true,
          errorNotifications: true,
          videoCompletionAlert: true
        },
        api_settings: user.api_settings || {
          apiKeys: [],
          allowedIps: [],
          webhookUrl: null
        }
      };
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  async handleNewUser(userData) {
    try {
      // Create or update user
      let user = await authDataAccess.findUserByAuth0Id(userData.auth0_id);
      
      if (!user) {
        user = await authDataAccess.createUser({
          auth0_id: userData.auth0_id,
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
      const userWithDetails = await authDataAccess.getUserWithRoleAndSubscription(userData.auth0_id);

      return {
        user: userWithDetails,
        refreshToken
      };
    } catch (error) {
      logger.error('Error handling new user:', error);
      throw error;
    }
  }
}

module.exports = new UserService(); 