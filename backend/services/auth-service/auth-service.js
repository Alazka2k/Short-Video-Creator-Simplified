/**
 * Main Authentication Service
 * 
 * This service acts as a facade for all authentication-related operations,
 * delegating to specialized services for specific functionality.
 * 
 * Features:
 * 1. User Management - Profile retrieval and user creation
 * 2. Session Management - Token refresh, logout, and session validation
 * 3. Email Authentication - Registration, login, and password reset
 * 4. Social Authentication - Handles social provider login flows
 * 
 * The service is designed to be the single point of entry for auth operations,
 * maintaining a clean separation of concerns by delegating to specialized services.
 * 
 * @module auth-service/auth-service
 */

const emailAuthService = require('./services/email-auth.service');
const sessionService = require('./services/session.service');
const userService = require('./services/user.service');
const socialAuthService = require('./services/social-auth.service');
const { TokenService } = require('./utils/token');
const logger = require('../../shared/utils/logger');
const axios = require('axios');
const config = require('../../shared/utils/config');

class AuthService {
  // User management
  async getUserProfile(auth0Id) {
    return userService.getUserProfile(auth0Id);
  }

  async handleNewUser(userData) {
    return userService.handleNewUser(userData);
  }

  // Session management
  async refreshToken(refreshToken) {
    return sessionService.refreshToken(refreshToken);
  }

  async logout(refreshToken, allDevices = false) {
    return sessionService.logout(refreshToken, allDevices);
  }

  async findValidSession(refreshToken) {
    return sessionService.findValidSession(refreshToken);
  }

  async invalidateAllUserSessions(userId) {
    return sessionService.invalidateAllUserSessions(userId);
  }

  // Email authentication
  async handleEmailRegistration(userData) {
    return emailAuthService.handleEmailRegistration(userData);
  }

  async handleEmailLogin(email, password) {
    return emailAuthService.handleEmailLogin(email, password);
  }

  async initiatePasswordReset(email) {
    return emailAuthService.initiatePasswordReset(email);
  }

  async resetPassword(token, newPassword) {
    return emailAuthService.resetPassword(token, newPassword);
  }

  // Social authentication
  async handleSocialLogin(provider, profile) {
    return socialAuthService.handleSocialLogin(provider, profile);
  }

  // M2M Authentication
  async getM2MToken({ clientId, clientSecret, audience }) {
    try {
      // Get Auth0 Domain configuration from config
      const auth0Domain = config.auth.auth0.domain;
      
      if (!auth0Domain) {
        logger.error('Auth0 domain not configured in config:', {
          environment: process.env.NODE_ENV,
          configAuth0: config.auth.auth0
        });
        throw new Error('Auth0 domain not configured in config');
      }

      logger.info('Requesting M2M token from Auth0', { 
        domain: auth0Domain,
        audience,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        environment: process.env.NODE_ENV
      });

      const tokenUrl = `https://${auth0Domain}/oauth/token`;
      const requestBody = {
        client_id: clientId,
        client_secret: clientSecret,
        audience: audience,
        grant_type: 'client_credentials'
      };

      logger.debug('Making token request to Auth0', { 
        url: tokenUrl,
        environment: process.env.NODE_ENV
      });
      
      const response = await axios.post(tokenUrl, requestBody);

      if (!response.data?.access_token) {
        logger.error('Invalid response from Auth0:', response.data);
        throw new Error('Invalid response from Auth0');
      }

      logger.info('Successfully obtained M2M token');
      
      return {
        access_token: response.data.access_token,
        token_type: response.data.token_type,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Auth0 API error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          environment: process.env.NODE_ENV
        });
        throw new Error(`Auth0 API error: ${error.response?.data?.error_description || error.message}`);
      }
      
      logger.error('Error getting M2M token:', error);
      throw error;
    }
  }
}

// Create an instance of AuthService
const authService = new AuthService();

// Export the instance
module.exports = authService;