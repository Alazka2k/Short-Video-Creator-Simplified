const { authMiddleware } = require('./auth0');
const logger = require('../../shared/utils/logger');

const serviceAuthMiddleware = [
  authMiddleware,
  // Add user context if needed
  (req, res, next) => {
    /*logger.info('Authenticated request:', {
      user: req.auth,
      endpoint: req.originalUrl,
      environment: process.env.NODE_ENV
    });*/
    next();
  },
  // Error handler
  (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
      logger.error('Service auth error:', err);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }
    next(err);
  }
];

module.exports = serviceAuthMiddleware; 