/**
 * User Token Extractor Middleware
 * 
 * This middleware extracts and processes the user token from the x-user-token header.
 * It attempts to identify the actual user when both M2M and user tokens are present.
 * 
 * @module api-gateway/middleware/userTokenExtractor
 */

const jwt = require('jsonwebtoken');
const logger = require('../../shared/utils/logger');
const authDataAccess = require('../../services/auth-service/data/authDataAccess');

const extractUserFromToken = async (req, res, next) => {
  try {
    // Skip if we already have a non-API user
    if (req.user?.databaseUser?.isApiUser === false) {
      return next();
    }

    const userToken = req.header('x-user-token');
    if (userToken) {
      try {
        const decodedUserToken = jwt.decode(userToken);
        if (decodedUserToken?.auth0_id) {
          const user = await authDataAccess.findUserByAuth0Id(decodedUserToken.auth0_id);
          if (user) {
            // Override the API user with the actual user details
            req.user.databaseUser = {
              userId: user.user_id,
              email: user.email,
              name: user.name,
              isApiUser: false
            };
            
            logger.info('Extracted user from token:', {
              userId: user.user_id,
              auth0Id: decodedUserToken.auth0_id,
              email: user.email
            });
          }
        }
      } catch (tokenError) {
        logger.warn('Error processing user token:', {
          error: tokenError.message,
          stack: tokenError.stack
        });
        // Continue with existing user context if token processing fails
      }
    }

    next();
  } catch (error) {
    logger.error('User extraction error:', {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

module.exports = extractUserFromToken; 