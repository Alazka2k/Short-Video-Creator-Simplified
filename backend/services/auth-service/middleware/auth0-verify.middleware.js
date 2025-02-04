/**
 * Auth0 Token Verification Middleware
 * 
 * This middleware verifies tokens issued directly by Auth0.
 * It's used to validate tokens in the social authentication flow and
 * when receiving callbacks from Auth0.
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
 * Verifies Auth0 tokens using Auth0's public keys
 */
async function verifyAuth0Token(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    logger.info('Attempting to verify token with Auth0:', {
      hasToken: !!token,
      domain: auth0Domain,
      audience: auth0Audience
    });

    // Decode token header to get key ID
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
      logger.error('Token decode failed:', {
        hasDecoded: !!decoded,
        hasHeader: !!decoded?.header,
        hasKid: !!decoded?.header?.kid
      });
      throw new Error('Invalid token format');
    }

    logger.info('Token decoded successfully:', {
      kid: decoded.header.kid,
      alg: decoded.header.alg,
      tokenIssuer: decoded.payload.iss,
      expectedIssuer: `https://${auth0Domain}/`
    });

    // Get signing key from Auth0
    logger.info('Fetching signing key from Auth0:', {
      jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
      kid: decoded.header.kid
    });

    const signingKey = await jwksClient.getSigningKey(decoded.header.kid);
    const publicKey = signingKey.getPublicKey();

    logger.info('Successfully retrieved signing key');

    // Verify token
    const verifiedToken = jwt.verify(token, publicKey, {
      audience: auth0Audience,
      issuer: `https://${auth0Domain}/`,
      algorithms: ['RS256']
    });

    logger.info('Token verified successfully:', {
      sub: verifiedToken.sub,
      gty: verifiedToken.gty,
      hasScope: !!verifiedToken.scope
    });

    req.user = verifiedToken;
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

      // Convert permission format if needed (e.g., create_jobs to create:jobs)
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