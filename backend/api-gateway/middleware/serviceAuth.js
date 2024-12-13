const { checkJwt, handleAuthError } = require('./auth0');
const logger = require('../../shared/utils/logger');

const serviceAuthMiddleware = [
  checkJwt,
  handleAuthError,
  // Add user context if needed
  (req, res, next) => {
    logger.info('Authenticated request:', {
      user: req.auth,
      endpoint: req.originalUrl,
      environment: process.env.NODE_ENV
    });
    next();
  }
];

module.exports = serviceAuthMiddleware; 