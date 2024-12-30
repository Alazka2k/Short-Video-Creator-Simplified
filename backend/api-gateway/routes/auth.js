const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../../services/auth-service/auth-controller');
const { authenticate } = require('../../services/auth-service/middleware/auth');
const logger = require('../../shared/utils/logger');

// Rate limiting configuration
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts
  message: {
    error: 'Too many login attempts, please try again later',
    retryAfter: '15 minutes'
  }
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 refresh attempts per hour
  message: {
    error: 'Too many token refresh attempts',
    retryAfter: '1 hour'
  }
});

// Public routes (with rate limiting)
router.post('/social', loginLimiter, authController.loginWithSocial);
router.post('/register-callback', loginLimiter, authController.handleRegisterCallback);
router.post('/refresh', refreshLimiter, authController.refreshToken);
router.post('/logout', authController.logout);

// Protected routes (require valid token)
router.get('/profile', authenticate, authController.getProfile);

// Error handling middleware
router.use((err, req, res, next) => {
  logger.error('Auth route error:', err);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication required'
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Insufficient permissions'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

module.exports = router; 