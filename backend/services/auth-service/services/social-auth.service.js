/**
 * Social Authentication Service
 * 
 * Handles all social provider authentication operations through Auth0.
 * This service manages user authentication and profile synchronization
 * for users authenticating through social providers (Google, Apple, etc.).
 * 
 * Features:
 * 1. Social Login - Processes social provider authentication
 * 2. Profile Sync - Syncs social profile data with local database
 * 3. Token Generation - Creates access and refresh tokens
 * 
 * The service maintains consistent user data between social providers
 * and our local database while handling the authentication flow.
 * 
 * @module auth-service/services/social-auth.service
 */

const { auth0 } = require('../auth0');
const authDataAccess = require('../data/authDataAccess');
const { TokenService, generateToken, hashToken } = require('../utils/token');
const userService = require('./user.service');
const logger = require('../../../shared/utils/logger');

class SocialAuthService {
  async handleSocialLogin(provider, profile) {
    try {
      logger.info('Processing social login for provider:', provider);
      
      // Create or update user in our database
      const { user, refreshToken } = await userService.handleNewUser({
        auth0Id: profile.sub,
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        picture: profile.picture,
        provider: provider
      });

      // Generate access token
      const accessToken = await TokenService.generateAccessToken(user);

      return {
        user,
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 3600
        }
      };
    } catch (error) {
      logger.error('Social login error:', error);
      throw error;
    }
  }

  async verifySocialToken(provider, accessToken) {
    try {
      logger.info('Verifying social token for provider:', provider);
      
      // Verify token with Auth0
      const userInfo = await auth0.getUserInfo(accessToken);
      
      return {
        sub: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      };
    } catch (error) {
      logger.error('Social token verification error:', error);
      throw error;
    }
  }
}

module.exports = new SocialAuthService(); 