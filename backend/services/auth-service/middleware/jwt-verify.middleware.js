/**
 * JWT Token Verification Middleware
 * 
 * This middleware verifies the JWT tokens issued by our application (not Auth0 tokens).
 * It's used to protect our internal API endpoints by validating the access tokens
 * we generate after successful Auth0 authentication.
 * 
 * Flow:
 * 1. Extracts Bearer token from Authorization header
 * 2. Verifies the token using our JWT secret
 * 3. Attaches user info to the request object
 * 
 * @module auth-service/middleware/jwt-verify.middleware
 **/

const { TokenService } = require('../utils/token');
const logger = require('../../../shared/utils/logger');
const jwt = require('jsonwebtoken');
const config = require('../../../shared/utils/config');

const verifyJwtToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    logger.info('Verifying JWT token');
    
    try {
      // Verify token using our application's JWT secret
      const decoded = jwt.verify(token, config.auth.jwt.secret);
      logger.info('Decoded token payload:', decoded);
      
      // Get the auth0Id from either auth0_id or sub
      const auth0Id = decoded.auth0_id;
      
      if (!auth0Id) {
        logger.error('No auth0_id found in token:', decoded);
        return res.status(401).json({ error: 'Invalid token format' });
      }

      // Attach user info to request
      req.user = {
        auth0Id,
        email: decoded.email,
        name: decoded.name || decoded.email?.split('@')[0],
        picture: decoded.picture
      };

      logger.info('Authenticated user:', { auth0Id, email: decoded.email });
      next();
    } catch (verifyError) {
      logger.error('Token verification error:', verifyError);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = { verifyJwtToken }; 