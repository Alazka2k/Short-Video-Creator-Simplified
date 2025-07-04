/**
 * Main Authentication Service
 * 
 * This service acts as a facade for all authentication-related operations,
 * delegating to specialized services for specific functionality.
 * 
 * @module auth-service/auth-service
 */

const userService = require('./services/user.service');
const logger = require('../../shared/utils/logger');
const axios = require('axios');
const config = require('../../shared/utils/config');

class AuthService {
  // User management
  async getUserProfile(auth0Id) {
    return userService.getUserProfile(auth0Id);
  }

  async getUserById(userId) {
    return userService.getUserById(userId);
  }

  async getUserPermissions(auth0Id) {
    return userService.getUserPermissions(auth0Id);
  }

  async handleNewUser(userData) {
    return userService.handleNewUser(userData);
  }
}

// Create an instance of AuthService
const authService = new AuthService();

// Export the instance
module.exports = authService;