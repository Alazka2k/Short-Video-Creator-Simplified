// auth-service.js
const { auth0, auth0Management, auth0Authentication } = require('./auth0');
const authDataAccess = require('./data/authDataAccess');
const { TokenService, generateToken, hashToken } = require('./utils/token');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const axios = require('axios');

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
        return true;
      } else {
        logger.warn('No valid session found for the provided refresh token');
        return false;
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

  // Email/Password Authentication
  async handleEmailRegistration(userData) {
    try {
      logger.info('Creating user with email:', userData.email);
      
      // Create user in Auth0
      logger.info('Creating user in Auth0 with data:', {
        email: userData.email,
        name: userData.name,
        connection: 'Username-Password-Authentication'
      });
      
      const auth0Response = await auth0Management.users.create({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        connection: 'Username-Password-Authentication',
        verify_email: true
      });

      const auth0User = auth0Response.data;

      logger.info('Auth0 user created:', {
        auth0Id: auth0User.user_id,
        email: auth0User.email,
        name: auth0User.name,
        response: JSON.stringify(auth0User)
      });

      // Create user in our database
      const user = await authDataAccess.createUser({
        auth0Id: auth0User.user_id,  // This will be "auth0|6772be16043aacf1efb0ca04"
        email: auth0User.email,
        name: auth0User.name || userData.name || userData.email.split('@')[0],
        picture: auth0User.picture || null,
        provider: 'email'  // Always 'email' for email/password registration
      });

      logger.info('User created in database:', {
        userId: user.user_id,
        auth0Id: user.auth0_id,
        email: user.email,
        response: JSON.stringify(user)
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
          expires_in: 3600 // 1 hour in seconds
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
        // Authenticate using Auth0 SDK with resource owner password flow
        const response = await axios.post(`https://${config.auth.auth0.domain}/oauth/token`, {
          grant_type: 'password',
          username: email,
          password: password,
          audience: config.auth.auth0.audience,
          client_id: config.auth.auth0.clientId,
          client_secret: config.auth.auth0.clientSecret,
          scope: 'openid profile email',
          connection: 'Username-Password-Authentication',
          realm: 'Username-Password-Authentication'
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
          const auth0User = await auth0Management.users.get({ id: auth0UserId });
          
          user = await authDataAccess.createUser({
            auth0Id: auth0UserId,
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
            expires_in: 3600 // 1 hour in seconds
          }
        };

      } catch (authError) {
        logger.error('Auth0 authentication failed:', {
          message: authError?.response?.data?.error_description || authError.message,
          error: authError?.response?.data?.error || authError.name,
          status: authError?.response?.status,
          details: authError?.response?.data
        });
        
        // Check if user exists to give appropriate error message
        try {
          const users = await auth0Management.users.getAll({
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
      await auth0.requestChangePasswordEmail({
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
      await auth0.resetPassword({
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

module.exports = new AuthService();