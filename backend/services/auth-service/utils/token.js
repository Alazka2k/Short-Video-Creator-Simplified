const jwt = require('jsonwebtoken');
const config = require('../../../shared/utils/config');
const logger = require('../../../shared/utils/logger');
const { auth0 } = require('../auth0');

class TokenService {
  static async generateAccessToken(user) {
    try {
      // Get access token from Auth0
      const token = await auth0.getAccessTokenForUser(user.auth0_id);
      return token;
    } catch (error) {
      throw new Error(`Failed to generate access token: ${error.message}`);
    }
  }

  static verifyToken(token) {
    return jwt.verify(token, config.auth.auth0.clientSecret, {
      audience: config.auth.auth0.audience,
      issuer: `https://${config.auth.auth0.domain}/`,
      algorithms: ['RS256']
    });
  }

  static generateTokens(userId, userData) {
    try {
      logger.info('Generating tokens for user:', userId);
      
      const accessToken = jwt.sign(
        { 
          sub: userId,
          ...userData
        },
        config.auth.auth0.clientSecret,
        { 
          expiresIn: config.auth.jwt.accessExpirationMinutes * 60,
          audience: config.auth.auth0.audience,
          issuer: `https://${config.auth.auth0.domain}/`,
          algorithm: 'RS256'
        }
      );

      const refreshToken = jwt.sign(
        { sub: userId },
        config.auth.auth0.clientSecret,
        { 
          expiresIn: config.auth.jwt.refreshExpirationDays * 24 * 60 * 60,
          audience: config.auth.auth0.audience,
          issuer: `https://${config.auth.auth0.domain}/`,
          algorithm: 'RS256'
        }
      );

      return {
        access: {
          token: accessToken,
          expires: new Date(Date.now() + config.auth.jwt.accessExpirationMinutes * 60000),
        },
        refresh: {
          token: refreshToken,
          expires: new Date(Date.now() + config.auth.jwt.refreshExpirationDays * 24 * 60 * 60000),
        },
      };
    } catch (error) {
      logger.error('Error generating tokens:', error);
      throw error;
    }
  }

  static async generateAuthTokens(userId) {
    try {
      const user = await auth0.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const userData = {
        email: user.email,
        name: user.name,
        picture: user.picture
      };

      return this.generateTokens(userId, userData);
    } catch (error) {
      logger.error('Error generating auth tokens:', error);
      throw error;
    }
  }

  static async verifyAndGetUser(token, type = 'access') {
    try {
      const payload = jwt.verify(token, config.auth.jwt.secret);
      
      const user = await auth0.getUser(payload.sub);
      if (!user) {
        throw new Error('User not found');
      }

      return { user, payload };
    } catch (error) {
      logger.error('Error verifying token:', error);
      throw error;
    }
  }
}

module.exports = TokenService; 