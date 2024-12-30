const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const socialAuthController = require('../../services/auth-service/controllers/social-auth-controller');
const emailAuthController = require('../../services/auth-service/controllers/email-auth-controller');
const userController = require('../../services/auth-service/controllers/user-controller');
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

// Social auth routes
router.post('/social', loginLimiter, socialAuthController.loginWithSocial);
router.post('/register-callback', loginLimiter, socialAuthController.handleRegisterCallback);

// Email auth routes
router.post('/register', loginLimiter, emailAuthController.registerWithEmail);
router.post('/login', loginLimiter, emailAuthController.loginWithEmail);
router.post('/forgot-password', loginLimiter, emailAuthController.forgotPassword);
router.post('/reset-password', loginLimiter, emailAuthController.resetPassword);

// User management routes
router.get('/profile', authenticate, userController.getProfile);
router.post('/refresh', refreshLimiter, userController.refreshToken);
router.post('/logout', userController.logout);

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