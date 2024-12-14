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
      // Get user from auth service using the auth0 id
      const user = await authService.getUserProfile(req.auth.payload.sub);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user permissions
      const permissions = await authService.getUserPermissions(user.auth0_id);
      
      // Check if user has required permission
      if (permissions.some(p => p.name === requiredPermission)) {
        next();
      } else {
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