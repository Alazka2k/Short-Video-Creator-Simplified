/**
 * Email Authentication Service
 * 
 * Handles all email/password-based authentication operations through Auth0.
 * This service manages user registration, login, and password reset functionality
 * for users authenticating with email and password.
 * 
 * Features:
 * 1. User Registration - Creates users in Auth0 and local database
 * 2. Email Login - Authenticates users using Auth0's password realm
 * 3. Password Reset - Initiates and completes password reset flows
 * 
 * The service integrates with Auth0's Management API for user operations
 * and maintains synchronized user data between Auth0 and our local database.
 * 
 * @module auth-service/services/email-auth.service
 */

const { managementClient, authenticationClient } = require('../auth0');
const authDataAccess = require('../data/authDataAccess');
const { TokenService, generateToken, hashToken } = require('../utils/token');
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/utils/config');
const axios = require('axios');

class EmailAuthService {
  async handleEmailRegistration(userData) {
    try {
      logger.info('Creating user with email:', userData.email);
      
      // Create user in Auth0
      logger.info('Creating user in Auth0 with data:', {
        email: userData.email,
        name: userData.name,
        connection: 'Username-Password-Authentication',
        hasPassword: !!userData.password
      });
      
      // Log the management client configuration
      logger.info('Management client configuration:', {
        domain: managementClient.domain,
        hasClientId: !!managementClient.clientId,
        hasClientSecret: !!managementClient.clientSecret,
        scope: managementClient.scope
      });
      
      const auth0User = await managementClient.users.create({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        connection: 'Username-Password-Authentication',
        verify_email: true
      });

      logger.info('Raw Auth0 response:', auth0User);

      // Extract user data from the nested response
      const auth0Data = auth0User.data;

      logger.info('Auth0 user data:', auth0Data);

      const userDataForDb = {
        auth0_id: auth0Data.user_id,
        email: auth0Data.email,
        name: auth0Data.name || userData.name || userData.email.split('@')[0],
        picture: auth0Data.picture || null,
        provider: 'email'
      };

      logger.info('Preparing data for database insertion:', userDataForDb);

      // Create user in our database
      const user = await authDataAccess.createUser(userDataForDb);

      logger.info('Database insertion attempt completed');
      logger.info('User creation result:', {
        success: !!user,
        user_details: user ? JSON.stringify(user, null, 2) : 'No user returned'
      });

      if (!user) {
        logger.error('User creation failed - no user returned from database');
        throw new Error('Failed to create user in database');
      }

      logger.info('Starting session creation for user:', {
        user_id: user.user_id,
        auth0_id: user.auth0_id
      });

      // Create session and tokens
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
          expires_in: 3600
        }
      };
    } catch (error) {
      logger.error('Email registration error:', error);
      throw error;
    }
  }

  async handleEmailLogin(email, password) {
    try {
      logger.info('Authenticating user with email:', email);

      try {
        // Authenticate using Resource Owner Password grant type
        const response = await axios.post(`https://${config.auth.auth0.domain}/oauth/token`, {
          grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
          client_id: config.auth.auth0.clientId,
          client_secret: config.auth.auth0.clientSecret,
          username: email,
          password: password,
          realm: 'Username-Password-Authentication',
          scope: 'openid profile email',
          audience: config.auth.auth0.audience
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        logger.info('Auth0 authentication successful, processing response');

        // Extract user ID from access token
        const tokenPayload = JSON.parse(Buffer.from(response.data.id_token.split('.')[1], 'base64').toString());
        const auth0UserId = tokenPayload.sub;
        
        logger.info('Extracted auth0UserId:', auth0UserId);
        
        // Get or create user in our database
        let user = await authDataAccess.findUserByAuth0Id(auth0UserId);
        
        if (!user) {
          logger.info('User not found in database, creating new user');
          // Get full user profile from Auth0 Management API
          const auth0User = await managementClient.users.get({ id: auth0UserId });
          
          user = await authDataAccess.createUser({
            auth0_id: auth0UserId,
            email: auth0User.email,
            name: auth0User.name || auth0User.email.split('@')[0],
            picture: auth0User.picture,
            provider: 'email'
          });
        }

        logger.info('User found/created:', { userId: user.user_id, email: user.email });

        // Create session and tokens
        const sessionId = await authDataAccess.createSession(user.user_id);
        const refreshToken = generateToken();
        const accessToken = await TokenService.generateAccessToken(user);

        await authDataAccess.updateSession(sessionId, {
          refresh_token_hash: hashToken(refreshToken)
        });

        logger.info('Session created and tokens generated');

        return {
          user,
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 3600
          }
        };

      } catch (authError) {
        logger.error('Auth0 authentication failed:', {
          message: authError?.response?.data?.error_description || authError.message,
          error: authError?.response?.data?.error || authError.name,
          status: authError?.response?.status,
          details: authError?.response?.data
        });
        
        if (authError?.response?.status === 403) {
          throw new Error('invalid credentials');
        }
        
        // Check if user exists to give appropriate error message
        try {
          const users = await managementClient.users.getAll({
            q: `email:"${email}"`,
            search_engine: 'v3'
          });

          if (!users || users.length === 0) {
            throw new Error('User not found');
          }
          throw new Error('invalid credentials');
        } catch (userError) {
          if (userError.message === 'User not found') {
            throw userError;
          }
          throw new Error('invalid credentials');
        }
      }
    } catch (error) {
      logger.error('Email login error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      throw error;
    }
  }

  async initiatePasswordReset(email) {
    try {
      await authenticationClient.requestChangePasswordEmail({
        email,
        connection: 'Username-Password-Authentication'
      });
    } catch (error) {
      logger.error('Password reset initiation error:', error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      await authenticationClient.resetPassword({
        token,
        newPassword,
        connection: 'Username-Password-Authentication'
      });
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }
}

module.exports = new EmailAuthService(); 