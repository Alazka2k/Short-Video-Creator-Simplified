/**
 * M2M Authentication Service for Batch Jobs
 * 
 * This service provides M2M authentication tokens for batch jobs to use when making API calls.
 * It uses the existing auth service to get M2M tokens.
 */

const authService = require('../../services/auth-service/auth-service');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

class M2MAuthService {
  constructor() {
    this.tokenCache = new Map();
    this.tokenExpiry = new Map();
  }

  /**
   * Get an M2M token for the specified audience
   * @param {string} audience - The audience to get a token for
   * @returns {Promise<string>} - The M2M token
   */
  async getToken(audience = config.auth.auth0.audience) {
    try {
      // Check if we have a cached token that's still valid
      const cachedToken = this.tokenCache.get(audience);
      const cachedExpiryTime = this.tokenExpiry.get(audience);
      
      if (cachedToken && cachedExpiryTime && cachedExpiryTime > Date.now()) {
        logger.debug('Using cached M2M token');
        return cachedToken;
      }
      
      // Get Auth0 M2M configuration from config
      const clientId = config.auth.auth0.clientId;
      const clientSecret = config.auth.auth0.clientSecret;
      
      if (!clientId || !clientSecret) {
        logger.error('Auth0 M2M credentials not configured in config:', {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
          configAuth0: config.auth.auth0
        });
        throw new Error('Auth0 M2M credentials not configured in config');
      }
      
      logger.info('Requesting M2M token from auth service', { 
        audience,
        clientId: clientId.substring(0, 5) + '...',
        hasClientSecret: !!clientSecret
      });
      
      // Get the token from the auth service
      const tokenResponse = await authService.getM2MToken({
        clientId,
        clientSecret,
        audience
      });
      
      // Cache the token with a 5-minute buffer before expiry
      const expiryBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
      const tokenExpiryTime = Date.now() + (tokenResponse.expires_in * 1000) - expiryBuffer;
      
      this.tokenCache.set(audience, tokenResponse.access_token);
      this.tokenExpiry.set(audience, tokenExpiryTime);
      
      //logger.info('Successfully obtained M2M token');
      
      return tokenResponse.access_token;
    } catch (error) {
      logger.error('Error getting M2M token:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const m2mAuthService = new M2MAuthService();

module.exports = m2mAuthService; 