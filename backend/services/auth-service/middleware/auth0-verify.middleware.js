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

// Get environment-specific Auth0 configuration
const envPrefix = process.env.NODE_ENV?.toUpperCase();
const auth0Domain = process.env[`${envPrefix}_AUTH0_DOMAIN`];
const auth0Audience = process.env[`${envPrefix}_AUTH0_AUDIENCE`];

// Log Auth0 configuration
logger.info('Auth0 Configuration:', {
  domain: auth0Domain,
  audience: auth0Audience,
  environment: process.env.NODE_ENV
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

    // Decode token header to get key ID
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
      throw new Error('Invalid token format');
    }

    // Get signing key from Auth0
    const signingKey = await jwksClient.getSigningKey(decoded.header.kid);
    const publicKey = signingKey.getPublicKey();

    // Verify token
    const verifiedToken = jwt.verify(token, publicKey, {
      audience: auth0Audience,
      issuer: `https://${auth0Domain}/`,
      algorithms: ['RS256']
    });

    req.user = verifiedToken;
    next();
  } catch (error) {
    logger.error('Auth0 token verification error:', {
      error: error.message,
      stack: error.stack,
      domain: auth0Domain,
      audience: auth0Audience
    });
    res.status(401).json({ error: 'Please authenticate' });
  }
}

/**
 * Checks if the authenticated user has the required permission
 * @param {string} requiredPermission - The permission to check for
 */
const checkPermission = (requiredPermission) => async (req, res, next) => {
  try {
    // Check if this is a client credentials token
    if (req.user.gty === 'client-credentials') {
      // For M2M applications, check token scopes
      const scopes = (req.user.scope || '').split(' ');
      logger.info('M2M token scopes:', { scopes, requiredPermission });
      
      // Convert permission to scope format (e.g., create_video -> create:videos)
      const requiredScope = requiredPermission
        .replace('_', ':') // convert create_video to create:video
        .replace('video', 'videos'); // make it plural for API convention
      
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

    // For regular user tokens, check permissions in the database
    const auth0Id = req.user.sub;
    const authDataAccess = require('../data/authDataAccess');
    
    const permissions = await authDataAccess.getUserPermissions(auth0Id);
    const hasPermission = permissions.some(p => p.name === requiredPermission);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredPermission,
        message: 'You do not have permission to access this feature'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Permission check error:', {
      error: error.message,
      stack: error.stack,
      isM2M: req.user?.gty === 'client-credentials',
      scopes: req.user?.scope
    });
    res.status(500).json({ error: 'Permission check failed' });
  }
};

module.exports = {
  verifyAuth0Token,
  checkPermission
};