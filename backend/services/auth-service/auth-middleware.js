const { auth0 } = require('./auth0');
const logger = require('../../shared/utils/logger');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');

const jwksClient = jwksRsa({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});

async function authMiddleware(req, res, next) {
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
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256']
    });

    req.user = verifiedToken;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Please authenticate' });
  }
}

const checkPermission = (requiredPermission) => async (req, res, next) => {
  try {
    const auth0Id = req.user.sub;
    const authDataAccess = require('./data/authDataAccess');
    
    const permissions = await authDataAccess.getUserPermissions(auth0Id);
    const hasPermission = permissions.some(p => p.name === requiredPermission);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredPermission,
        message: 'Please upgrade your subscription to access this feature'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Permission check error:', error);
    res.status(500).json({ error: 'Permission check failed' });
  }
};

module.exports = {
  authMiddleware,
  checkPermission
};