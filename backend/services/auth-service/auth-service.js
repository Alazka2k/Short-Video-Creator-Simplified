// auth-service.js
const { auth0 } = require('./auth0');
const authDataAccess = require('./data/authDataAccess');
const logger = require('../../shared/utils/logger');
const { generateToken, hashToken } = require('./utils/crypto');
const TokenService = require('./utils/token');

class AuthService {
  // Core functionality
  async getUserProfile(auth0Id) {
    try {
      logger.info('Getting user profile for auth0Id:', auth0Id);
      
      let user = await authDataAccess.getUserWithRoleAndSubscription(auth0Id);
      
      if (!user) {
        logger.info('User not found in database, fetching from Auth0');
        const auth0User = await auth0.getUser(auth0Id);
        user = await authDataAccess.createUser({
          auth0Id: auth0User.user_id,
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
      const accessToken = await TokenService.generateAccessToken(user);
      
      await authDataAccess.updateSession(sessionId, {
        refresh_token_hash: hashToken(refreshToken)
      });

      return { 
        user, 
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 3600 // 1 hour in seconds
        }
      };
    } catch (error) {
      logger.error('Social login error:', error);
      throw error;
    }
  }

  async updateUserProfile(auth0Id, userData) {
    try {
      await auth0.updateUser({ id: auth0Id }, {
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

      // Generate access token using the user data from session
      const accessToken = await TokenService.generateAccessToken(session);

      return { 
        user: session,
        tokens: {
          access_token: accessToken,
          refresh_token: newRefreshToken,
          expires_in: 3600 // 1 hour in seconds
        }
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  async logout(refreshToken, allDevices = false) {
    try {
      logger.info('Attempting to logout user');
      
      const tokenHash = hashToken(refreshToken);
      const session = await authDataAccess.findValidSession(tokenHash);
      
      if (session) {
        logger.info(`Found valid session for user ${session.user_id}, session ID: ${session.session_id}`);
        
        if (allDevices) {
          logger.info(`Invalidating all sessions for user ${session.user_id}`);
          await authDataAccess.invalidateAllUserSessions(session.user_id);
        } else {
          logger.info(`Invalidating single session ${session.session_id}`);
          await authDataAccess.invalidateSession(session.session_id, 'user_logout');
        }
        
        logger.info('Logout completed successfully');
      } else {
        logger.warn('No valid session found for the provided refresh token');
      }
    } catch (error) {
      logger.error('Error in logout:', error);
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

  async loginWithSocialToken(accessToken, provider) {
    try {
      logger.info('Attempting social login with provider:', provider);
      
      // Get user info from Auth0
      const userInfo = await auth0.getUser(accessToken);
      if (!userInfo) {
        throw new Error('Failed to get user info from Auth0');
      }

      // Generate tokens
      const tokens = await TokenService.generateAuthTokens(userInfo.user_id);

      // Create or update session
      const session = await authDataAccess.findSessionById(userInfo.user_id);
      if (session) {
        await authDataAccess.updateSession(session.session_id, {
          refresh_token_hash: hashToken(tokens.refresh.token),
          expires_at: tokens.refresh.expires,
          is_valid: true
        });
      } else {
        await authDataAccess.createSession(userInfo.user_id, {
          refresh_token_hash: hashToken(tokens.refresh.token),
          expires_at: tokens.refresh.expires
        });
      }

      return {
        user: {
          id: userInfo.user_id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        },
        tokens
      };
    } catch (error) {
      logger.error('Error in social login:', error);
      throw error;
    }
  }

  async refreshAuth(refreshToken) {
    try {
      logger.info('Attempting to refresh auth token');
      
      // Verify the token hash exists in a valid session
      const tokenHash = hashToken(refreshToken);
      const session = await authDataAccess.findValidSession(tokenHash);
      
      if (!session) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const { user } = await TokenService.verifyAndGetUser(refreshToken, 'refresh');
      const tokens = await TokenService.generateAuthTokens(user.user_id);

      // Update session with new refresh token
      await authDataAccess.updateSession(session.session_id, {
        refresh_token_hash: hashToken(tokens.refresh.token),
        expires_at: tokens.refresh.expires,
        is_valid: true
      });

      return {
        user: {
          id: user.user_id,
          email: user.email,
          name: user.name,
          picture: user.picture
        },
        tokens
      };
    } catch (error) {
      logger.error('Error refreshing auth:', error);
      throw error;
    }
  }

  async logout(refreshToken) {
    try {
      logger.info('Attempting to logout user');
      
      const tokenHash = hashToken(refreshToken);
      const session = await authDataAccess.findValidSession(tokenHash);
      
      if (session) {
        await authDataAccess.invalidateSession(session.session_id, 'user_logout');
      }
    } catch (error) {
      logger.error('Error in logout:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();