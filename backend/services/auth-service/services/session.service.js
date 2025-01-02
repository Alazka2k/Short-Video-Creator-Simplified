/**
 * Session Management Service
 * 
 * Handles all aspects of user session management including token refresh,
 * session validation, and logout operations.
 * 
 * Features:
 * 1. Token Refresh - Generates new access and refresh tokens
 * 2. Session Validation - Verifies active sessions
 * 3. Logout - Handles single and multi-device logout
 * 4. Session Tracking - Maintains session state and history
 * 
 * The service ensures secure session management by:
 * - Invalidating old sessions during token refresh
 * - Maintaining session state with refresh token hashes
 * - Supporting both single-device and all-device logout
 * - Tracking session validity and expiration
 * 
 * @module auth-service/services/session.service
 */

const authDataAccess = require('../data/authDataAccess');
const { TokenService, generateToken, hashToken } = require('../utils/token');
const logger = require('../../../shared/utils/logger');

class SessionService {
  async refreshToken(refreshToken) {
    try {
      const tokenHash = hashToken(refreshToken);
      logger.info('Looking for session with token hash:', tokenHash);
      const session = await authDataAccess.findValidSession(tokenHash);

      if (!session) {
        logger.warn('No valid session found for refresh token');
        throw new Error('Invalid refresh token');
      }

      logger.info('Found valid session:', {
        session_id: session.session_id,
        user_id: session.user_id,
        expires_at: session.expires_at
      });

      // Invalidate old session
      const invalidatedSession = await authDataAccess.invalidateSession(session.session_id, 'token_refresh');
      logger.info('Invalidated old session:', {
        session_id: invalidatedSession.session_id,
        isValid: invalidatedSession.isValid,
        invalidatedAt: invalidatedSession.invalidatedAt
      });

      // Create new session
      const newSessionId = await authDataAccess.createSession(session.user_id);
      const newRefreshToken = generateToken();
      const newRefreshTokenHash = hashToken(newRefreshToken);

      logger.info('Created new session:', {
        session_id: newSessionId,
        user_id: session.user_id
      });

      // Update new session with refresh token hash
      const updatedSession = await authDataAccess.updateSession(newSessionId, {
        refresh_token_hash: newRefreshTokenHash,
        user_id: session.user_id
      });

      logger.info('Updated new session with refresh token:', {
        session_id: updatedSession.session_id,
        user_id: updatedSession.user_id
      });

      // Generate access token using the user data from session
      const accessToken = await TokenService.generateAccessToken(session);

      logger.info('Generated new tokens for session:', newSessionId);

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
      
      if (!refreshToken) {
        logger.warn('No refresh token provided');
        return {
          message: 'No refresh token provided',
          status: 'error',
          details: 'A refresh token is required for logout'
        };
      }
      
      const tokenHash = hashToken(refreshToken);
      logger.info('Looking for session with token hash:', tokenHash);
      const session = await authDataAccess.findValidSession(tokenHash);
      
      if (!session) {
        logger.warn('No valid session found for the provided refresh token');
        return {
          message: 'No active session found',
          status: 'info',
          details: 'The provided refresh token does not match any active session'
        };
      }

      logger.info(`Found valid session for user ${session.user_id}, session ID: ${session.session_id}`);
      
      let invalidatedSession;
      if (allDevices) {
        logger.info(`Invalidating all sessions for user ${session.user_id}`);
        const invalidatedSessions = await authDataAccess.invalidateAllUserSessions(session.user_id);
        logger.info('All sessions invalidated:', invalidatedSessions);
        invalidatedSession = Array.isArray(invalidatedSessions) && invalidatedSessions.length > 0 
          ? invalidatedSessions[0] 
          : null;
      } else {
        logger.info(`Invalidating single session ${session.session_id}`);
        invalidatedSession = await authDataAccess.invalidateSession(session.session_id, 'user_logout');
        logger.info('Session invalidated:', invalidatedSession);
      }

      // Check if session was actually invalidated
      if (!invalidatedSession) {
        logger.warn('Session invalidation failed - no session returned');
        return {
          message: 'Session invalidation failed',
          status: 'error',
          details: 'Failed to invalidate the session'
        };
      }

      // Check if session is marked as invalid
      if (invalidatedSession.isValid) {
        logger.warn('Session invalidation failed - session still valid');
        return {
          message: 'Session invalidation failed',
          status: 'error',
          details: 'Failed to invalidate the session'
        };
      }
      
      const successResponse = {
        message: 'Logged out successfully',
        status: 'success',
        details: {
          session_id: session.session_id,
          user_id: session.user_id,
          invalidated_at: invalidatedSession.invalidatedAt
        }
      };

      logger.info('Logout completed successfully:', successResponse);
      return successResponse;
    } catch (error) {
      logger.error('Error in logout:', error);
      return {
        message: 'Logout failed',
        status: 'error',
        details: error.message
      };
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
}

module.exports = new SessionService(); 