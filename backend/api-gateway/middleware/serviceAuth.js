const { checkJwt, handleAuthError } = require('./auth0');
const logger = require('../../shared/utils/logger');

const serviceAuthMiddleware = [
  checkJwt,
  handleAuthError,
  // Add user context if needed
  (req, res, next) => {
    logger.info('Authenticated request:', {
      user: req.auth,
      endpoint: req.originalUrl
    });
    next();
  }
];

module.exports = serviceAuthMiddleware; 