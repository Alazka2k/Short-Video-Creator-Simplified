const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { promisify } = require('util');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

const NAMESPACE = 'https://short-video-creator.com/';

const client = jwksClient({
  jwksUri: `https://${config.auth.auth0.domain}/.well-known/jwks.json`,
  requestHeaders: {},
  timeout: 30000,
});

const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      logger.error('Error getting signing key from JWKS.', { error: err.message });
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

const verifyJwt = promisify(jwt.verify);

async function verifyToken(token) {
  try {
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
        throw new Error('Invalid token format.');
    }

    const key = await promisify(client.getSigningKey)(decodedToken.header.kid);
    const signingKey = key.getPublicKey();

    const decoded = await verifyJwt(token, signingKey, {
      audience: config.auth.auth0.audience,
      issuer: `https://${config.auth.auth0.domain}/`,
      algorithms: ['RS256'],
    });
    
    return decoded;
  } catch (error) {
    logger.error('Token verification failed.', { error: error.message });
    throw new Error('Token verification failed.');
  }
}

function jwtAuth(options = {}) {
  const { requireUser = true, requireAdmin = false } = options;

  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (requireUser) {
        return res.status(401).json({ error: 'No authorization token provided.' });
      }
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = await verifyToken(token);
      
      req.user = {
        userId: decoded[`${NAMESPACE}user_id`],
        email: decoded[`${NAMESPACE}email`],
        name: decoded[`${NAMESPACE}name`],
        isAdmin: decoded[`${NAMESPACE}is_admin`] || false,
        subscriptionPlanId: decoded[`${NAMESPACE}subscription_plan_id`],
        permissions: decoded[`${NAMESPACE}permissions`] || [],
        auth0Id: decoded.sub
      };

      if (requireAdmin && !req.user.isAdmin) {
        return res.status(403).json({ error: 'Administrator access required.' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
  };
}

module.exports = jwtAuth; 