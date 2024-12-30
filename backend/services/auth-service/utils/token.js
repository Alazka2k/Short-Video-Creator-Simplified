const jwt = require('jsonwebtoken');
const config = require('../../../shared/utils/config');
const logger = require('../../../shared/utils/logger');
const { auth0 } = require('../auth0');

class TokenService {
  static async generateAccessToken(user) {
    try {
      logger.info('Generating access token for user:', user);
      const token = jwt.sign(
        {
          auth0_id: user.auth0_id || user.sub,
          email: user.email,
          name: user.name,
          picture: user.picture
        },
        config.auth.jwt.secret,
        { 
          expiresIn: config.auth.jwt.accessExpirationMinutes * 60
        }
      );
      return token;
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error(`Failed to generate access token: ${error.message}`);
    }
  }

  static generateTokens(userId, userData) {
    try {
      logger.info('Generating session tokens for user:', userId);
      
      const accessToken = jwt.sign(
        { 
          sub: userId,
          ...userData,
          type: 'session'
        },
        config.auth.jwt.secret,
        { 
          expiresIn: config.auth.jwt.accessExpirationMinutes * 60
        }
      );

      const refreshToken = jwt.sign(
        { 
          sub: userId,
          type: 'session'
        },
        config.auth.jwt.secret,
        { 
          expiresIn: config.auth.jwt.refreshExpirationDays * 24 * 60 * 60
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

  static verifySessionToken(token) {
    return jwt.verify(token, config.auth.jwt.secret);
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
      const payload = this.verifySessionToken(token);
      
      if (payload.type !== 'session') {
        throw new Error('Invalid token type');
      }

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