/**
 * Auth0 Token Verification Middleware
 * 
 * This middleware verifies tokens issued directly by Auth0.
 * It handles both M2M tokens (using API user) and user tokens.
 * 
 * Features:
 * 1. Verifies Auth0 JWT tokens using Auth0's JWKS (JSON Web Key Set)
 * 2. Validates token audience and issuer
 * 3. Implements permission checking for protected routes
 * 
 * @module auth-service/middleware/auth0-verify.middleware
 */

const { auth0 } = require('../auth0');
const logger = require('../../../shared/utils/logger');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const config = require('../../../shared/utils/config');
const { getRequiredPermission } = require('../../../api-gateway/config/permissions');
const authDataAccess = require('../data/authDataAccess');

// Get environment-specific Auth0 configuration
const envPrefix = process.env.NODE_ENV?.toUpperCase();
const auth0Domain = process.env[`${envPrefix}_AUTH0_M2M_DOMAIN`];
const auth0Audience = process.env[`${envPrefix}_AUTH0_M2M_AUDIENCE`];

// Log Auth0 configuration
logger.info('Auth0 Configuration:', {
  domain: auth0Domain,
  audience: auth0Audience,
  environment: process.env.NODE_ENV,
  envPrefix
});

// Initialize JWKS client for Auth0 public key retrieval
const jwksClient = jwksRsa({
  jwksUri: `https://${auth0Domain}/.well-known/jwks.json`
});

/**
 * Gets or creates the API user for M2M tokens
 */
async function getOrCreateApiUser() {
  try {
    let apiUser = await authDataAccess.findUserByAuth0Id('api');
    if (!apiUser) {
      apiUser = await authDataAccess.createUser({
        auth0_id: 'api',
        email: 'api@system.local',
        full_name: 'API System User',
        provider: 'system',
        picture: null,
        video_preferences: {
          defaultResolution: '1080p',
          defaultAspectRatio: '16:9',
          defaultLanguage: 'en'
        },
        notification_settings: {
          emailNotifications: false,
          videoCompletionAlert: false,
          errorNotifications: false
        },
        api_settings: {
          isSystemUser: true,
          allowedIps: ['*']
        }
      });
      logger.info('Created API user:', { userId: apiUser.user_id });
    }
    return apiUser;
  } catch (error) {
    logger.error('Error getting/creating API user:', error);
    throw error;
  }
}

/**
 * Verifies Auth0 tokens using Auth0's public keys and enriches with user data
 */
async function verifyAuth0Token(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    logger.info('Attempting to verify token:', {
      hasToken: !!token,
      domain: auth0Domain,
      audience: auth0Audience
    });

    // Decode token to check its type
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header) {
      logger.error('Token decode failed:', {
        hasDecoded: !!decoded,
        hasHeader: !!decoded?.header
      });
      throw new Error('Invalid token format');
    }

    let verifiedToken;

    // Check if it's a user token (HS256) or M2M token (RS256)
    if (decoded.header.alg === 'HS256') {
      logger.info('Verifying user token');
      // For user tokens, verify with our secret
      verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
      // Add auth0_id from the token payload
      verifiedToken.auth0_id = verifiedToken.auth0_id;
    } else {
      // For M2M tokens, verify with Auth0's public key
      if (!decoded.header.kid) {
        throw new Error('Missing key ID in token header');
      }
      logger.info('Verifying M2M token');
      const signingKey = await jwksClient.getSigningKey(decoded.header.kid);
      const publicKey = signingKey.getPublicKey();
      verifiedToken = jwt.verify(token, publicKey, {
        audience: auth0Audience,
        issuer: `https://${auth0Domain}/`,
        algorithms: ['RS256']
      });
    }

    // Attach the verified token to req.user
    req.user = verifiedToken;

    // Check if this is a client credentials (M2M) token
    const isM2MToken = verifiedToken.gty === 'client-credentials';

    // First try to get user from database if it's not an M2M token
    if (!isM2MToken) {
      try {
        // For user tokens, try both possible auth0_id formats
        const auth0Id = verifiedToken.sub || verifiedToken.auth0_id;
        logger.info('Looking up user by auth0Id:', { auth0Id });
        
        const user = await authDataAccess.findUserByAuth0Id(auth0Id);
        if (user) {
          req.user.databaseUser = {
            userId: user.user_id,
            email: user.email,
            name: user.name,
            isApiUser: false
          };
          logger.info('Found user in database:', {
            auth0Id,
            userId: user.user_id,
            email: user.email
          });
          return next();
        } else {
          logger.warn('User not found in database:', { auth0Id });
        }
      } catch (userError) {
        logger.error('Failed to get user data:', {
          error: userError.message,
          sub: verifiedToken.sub
        });
      }
    }

    // Only use API user if we couldn't find a regular user or it's an M2M token
    const apiUser = await getOrCreateApiUser();
    req.user.databaseUser = {
      userId: apiUser.user_id,
      email: apiUser.email,
      name: apiUser.name,
      isApiUser: true
    };
    
    logger.info('Using API user:', {
      reason: isM2MToken ? 'M2M Token' : 'User Not Found',
      userId: apiUser.user_id,
      sub: verifiedToken.sub
    });

    next();
  } catch (error) {
    logger.error('Auth0 token verification error:', {
      error: error.message,
      stack: error.stack,
      domain: auth0Domain,
      audience: auth0Audience,
      errorName: error.name,
      errorCode: error.code
    });
    res.status(401).json({ error: 'Please authenticate' });
  }
}

/**
 * Checks if the token has the required permission
 * @param {string} requiredPermission - The required permission
 */
function checkPermission(endpoint) {
  return async (req, res, next) => {
    try {
      const permission = getRequiredPermission(endpoint);
      
      if (!permission) {
        logger.warn('No permission configured for endpoint:', { endpoint });
        return next();
      }
      
      logger.info('Checking permission:', {
        endpoint,
        requiredPermission: permission
      });

      const scopes = (req.user.scope || '').split(' ');
      
      logger.info('Token scopes:', {
        requiredPermission: permission,
        scopes
      });

      // Convert permission format if needed (e.g., create_job to create:job)
      const convertedPermission = permission.replace('_', ':');
      
      logger.info('Permission conversion:', {
        converted: convertedPermission,
        original: permission
      });

      if (!scopes.includes(convertedPermission)) {
        logger.error('Permission denied:', {
          requiredPermission: convertedPermission,
          availableScopes: scopes
        });
        
        return res.status(403).json({
          error: 'Insufficient scope',
          message: `Missing required scope: ${convertedPermission}`,
          requiredScope: convertedPermission,
          availableScopes: scopes
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

module.exports = {
  verifyAuth0Token,
  checkPermission
};