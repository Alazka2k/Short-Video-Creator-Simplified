const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');

const serviceAuth = (req, res, next) => {
  const serviceToken = req.headers['x-service-auth'];
  const expectedToken = config.auth.auth0CustomClaims.serviceAuthToken;

  if (!serviceToken) {
    logger.warn('Service authentication failed: Missing x-service-auth header.');
    return res.status(401).json({ error: 'Unauthorized: Missing service token.' });
  }

  if (serviceToken !== expectedToken) {
    logger.warn('Service authentication failed: Invalid service token provided.');
    return res.status(403).json({ error: 'Forbidden: Invalid service token.' });
  }

  next();
};

module.exports = serviceAuth; 