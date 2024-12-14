const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../backend/api-gateway/middleware/auth0');
const logger = require('../../backend/shared/utils/logger');

// Test endpoint that doesn't require authentication
router.get('/public', (req, res) => {
  res.json({ message: 'Public endpoint - no auth required' });
});

// Test endpoint that requires authentication
router.get('/protected', 
  authMiddleware, 
  (req, res) => {
    res.json({ 
      message: 'Protected endpoint - auth required',
      user: req.auth
    });
  }
);

// Test endpoint that requires specific permission
router.get('/admin', 
  authMiddleware,
  (req, res) => {
    // This is just for testing - in production use checkPermission middleware
    res.json({ 
      message: 'Admin endpoint - auth and admin permission required',
      user: req.auth
    });
  }
);

// Error test endpoint
router.get('/error', 
  authMiddleware, 
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