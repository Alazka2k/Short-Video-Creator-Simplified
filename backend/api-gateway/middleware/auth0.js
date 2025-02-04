/**
 * API Gateway Auth0 Middleware
 * 
 * This middleware handles authentication and authorization for the API Gateway.
 * It supports two types of tokens:
 * 1. Machine-to-Machine (M2M) tokens - Used for service-to-service communication
 * 2. User tokens - Used for authenticated user requests
 * 
 * Features:
 * - Token verification using Auth0's JWKS
 * - M2M token scope validation
 * - User permission checking
 * - Service endpoint protection
 * 
 * Service Endpoints:
 * These endpoints allow M2M access with appropriate scopes:
 * - /api/llm - LLM service endpoints (create:llm)
 * - /api/image - Image generation endpoints (create:image)
 * - /api/voice - Voice synthesis endpoints (create:voice)
 * - /api/animation - Animation generation endpoints (create:animation)
 * - /api/video - Video processing endpoints (create:video)
 * - /api/music - Music generation endpoints (create:music)
 * - /api/assembly - Assembly service endpoints (create:assembly)
 * - /api/job - Job management endpoints (create:job)
 * 
 * Required M2M Scopes:
 * - create:llm - Access to LLM generation
 * - create:image - Access to image generation
 * - create:voice - Access to voice synthesis
 * - create:animation - Access to animation generation
 * - create:video - Access to video processing
 * - create:music - Access to music generation
 * - create:assembly - Access to assembly operations
 * - create:job - Access to job management
 * 
 * @module api-gateway/middleware/auth0
 */

const { auth } = require('express-oauth2-jwt-bearer');
const logger = require('../../shared/utils/logger');
const authService = require('../../services/auth-service/auth-service');

// Get environment-specific Auth0 M2M configuration
const envPrefix = process.env.NODE_ENV?.toUpperCase();
const auth0Domain = process.env[`${envPrefix}_AUTH0_M2M_DOMAIN`];
const auth0Audience = process.env[`${envPrefix}_AUTH0_M2M_AUDIENCE`];

// Log configuration (without sensitive data)
logger.info('Auth0 Gateway Configuration:', {
  domain: auth0Domain,
  audience: auth0Audience,
  environment: process.env.NODE_ENV,
  envPrefix
});

// Validate Auth0 configuration
if (!auth0Domain || !auth0Audience) {
  logger.error('Auth0 M2M configuration missing or incorrect:', {
    environment: process.env.NODE_ENV,
    envPrefix,
    hasDomain: !!auth0Domain,
    hasAudience: !!auth0Audience,
    availableEnvVars: Object.keys(process.env).filter(key => key.includes('AUTH0'))
  });
  process.exit(1);
}

// Service endpoints that allow M2M access
const SERVICE_ENDPOINTS = [
  '/api/llm',
  '/api/image',
  '/api/voice',
  '/api/animation',
  '/api/video',
  '/api/music',
  '/api/assembly',
  '/api/job'
];

// Initialize Auth0 JWT middleware
const authMiddleware = auth({
  audience: auth0Audience,
  issuerBaseURL: `https://${auth0Domain}`,
  tokenSigningAlg: 'RS256'
});

/**
 * Permission check middleware
 * Handles both M2M tokens and user tokens
 * 
 * For M2M tokens:
 * - Validates token scopes
 * - Ensures endpoint allows M2M access
 * 
 * For user tokens:
 * - Validates user exists
 * - Checks user permissions
 * 
 * @param {string} requiredPermission - The permission to check for
 */
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const payload = req.auth.payload;
      logger.info('Auth payload:', payload);

      // Handle M2M tokens
      if (payload.gty === 'client-credentials') {
        const isServiceEndpoint = SERVICE_ENDPOINTS.some(endpoint => 
          req.originalUrl.startsWith(endpoint)
        );
        
        if (!isServiceEndpoint) {
          logger.warn('M2M token used for non-service endpoint:', {
            endpoint: req.originalUrl,
            clientId: payload.azp
          });
          return res.status(403).json({
            error: 'Forbidden',
            message: 'This endpoint does not allow M2M access'
          });
        }

        // Convert permission to scope format (e.g., create_video -> create:video)
        const requiredScope = requiredPermission.replace('_', ':');

        const scopes = (payload.scope || '').split(' ');
        if (!scopes.includes(requiredScope)) {
          logger.warn('M2M token missing required scope:', {
            requiredScope,
            availableScopes: scopes
          });
          return res.status(403).json({
            error: 'Insufficient scope',
            message: `Missing required scope: ${requiredScope}`,
            requiredScope,
            availableScopes: scopes
          });
        }

        return next();
      }

      // Handle user tokens
      const user = await authService.getUserProfile(payload.sub);
      if (!user) {
        logger.warn('User not found:', payload.sub);
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'User profile not found'
        });
      }

      const permissions = await authService.getUserPermissions(user.auth0_id);
      if (!permissions.some(p => p.name === requiredPermission)) {
        logger.warn('Permission denied:', {
          userId: user.auth0_id,
          requiredPermission,
          userPermissions: permissions
        });
        return res.status(403).json({
          error: 'Forbidden',
          message: `Missing required permission: ${requiredPermission}`
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
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