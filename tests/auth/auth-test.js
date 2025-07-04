const express = require('express');
const router = express.Router();
const jwtAuth = require('../../backend/api-gateway/middleware/jwtAuth');
const logger = require('../../backend/shared/utils/logger');

// Test endpoint that doesn't require authentication
router.get('/public', (req, res) => {
  res.json({ message: 'Public endpoint - no auth required' });
});

// Test endpoint that requires authentication
router.get('/protected', 
  jwtAuth({ requireUser: true }),
  (req, res) => {
    res.json({ 
      message: 'Protected endpoint - auth required',
      user: {
        userId: req.user?.userId,
        email: req.user?.email,
        isAdmin: req.user?.isAdmin
      }
    });
  }
);

// Test endpoint that requires admin privileges
router.get('/admin', 
  jwtAuth({ requireUser: true, requireAdmin: true }),
  (req, res) => {
    res.json({ 
      message: 'Admin endpoint - auth and admin permission required',
      user: {
        userId: req.user?.userId,
        email: req.user?.email,
        isAdmin: req.user?.isAdmin
      }
    });
  }
);

// Error test endpoint
router.get('/error', 
  jwtAuth({ requireUser: true }),
  (req, res) => {
    throw new Error('Test error handling');
  }
);

// Error handling middleware
router.use((err, req, res, next) => {
  logger.error('Auth test error:', err);
  res.status(500).json({ 
    error: 'Test error', 
    message: err.message 
  });
});

module.exports = router; 