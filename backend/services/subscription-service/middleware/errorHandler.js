/**
 * Error Handler Middleware
 * 
 * This middleware catches errors in route handlers and formats appropriate responses.
 */

const logger = require('../../../shared/utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(`Subscription Service Error: ${err.message}`, { 
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Check for specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      details: err.message,
      code: 'UNAUTHORIZED'
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      details: err.message,
      code: 'NOT_FOUND'
    });
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    details: err.message,
    code: 'SERVER_ERROR'
  });
}; 