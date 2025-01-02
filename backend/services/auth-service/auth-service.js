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
}

// Create an instance of AuthService
const authService = new AuthService();

// Export the instance
module.exports = authService;