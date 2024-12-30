const { auth } = require('express-oauth2-jwt-bearer');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const authService = require('../../services/auth-service/auth-service');

// Log Auth0 configuration (without sensitive data)
logger.info('Auth0 Configuration:', {
  domain: config.auth.auth0.domain,
  audience: config.auth.auth0.audience,
  environment: process.env.NODE_ENV
});

// Auth0 JWT middleware
const authMiddleware = auth({
  audience: config.auth.auth0.audience,
  issuerBaseURL: `https://${config.auth.auth0.domain}`,
  tokenSigningAlg: 'RS256'
});

// Permission check middleware
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Log the auth payload for debugging
      logger.info('Auth payload:', req.auth.payload);

      // Check if this is a client credentials token
      if (req.auth.payload.gty === 'client-credentials') {
        logger.warn('Client credentials token used for user endpoint:', {
          endpoint: req.originalUrl,
          tokenType: req.auth.payload.gty,
          clientId: req.auth.payload.azp
        });
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Please use a user token for this endpoint. Client credentials tokens are not allowed.'
        });
      }

      // Get user from auth service using the auth0 id
      const user = await authService.getUserProfile(req.auth.payload.sub);
      
      if (!user) {
        logger.warn('User not found for token subject:', req.auth.payload.sub);
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'User profile not found'
        });
      }

      // Get user permissions
      const permissions = await authService.getUserPermissions(user.auth0_id);
      
      // Check if user has required permission
      if (permissions.some(p => p.name === requiredPermission)) {
        next();
      } else {
        logger.warn('Permission denied:', {
          userId: user.auth0_id,
          requiredPermission,
          userPermissions: permissions
        });
        res.status(403).json({
          error: 'Forbidden',
          message: `Missing required permission: ${requiredPermission}`
        });
      }
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({ 
        error: 'Permission check failed',
        message: error.message 
      });
    }
  };
};

module.exports = {
  authMiddleware,
  checkPermission
}; 