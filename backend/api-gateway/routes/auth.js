const express = require('express');
const router = express.Router();
const logger = require('../../shared/utils/logger');
const userLookupController = require('../../services/auth-service/controllers/userLookupController');
const serviceAuth = require('../middleware/serviceAuth');
const jwtAuth = require('../middleware/jwtAuth');

/**
 * @route GET /api/auth/profile
 * @description Get the profile of the currently authenticated user from their JWT.
 * @access User
 */
router.get('/profile', jwtAuth({ requireUser: true }), (req, res) => {
  // The user object is attached to the request by the jwtAuth middleware
  res.json(req.user);
});


/**
 * @route POST /api/auth/logout
 * @description Log a user's logout action.
 * @access User
 */
router.post('/logout', jwtAuth({ requireUser: true }), (req, res) => {
  // The frontend handles the actual session logout. This is for tracking/logging.
  logger.info('User logged out successfully.', { userId: req.user.user_id });
  res.status(200).json({ message: 'Logout successful.' });
});


/**
 * @route POST /api/auth/user-lookup
 * @description Endpoint called by the Auth0 Post-Login Action to get or create a user.
 * @access Service-to-service (protected by serviceAuth middleware)
 */
router.post('/user-lookup', serviceAuth, async (req, res) => {
    logger.info('User lookup request received from Auth0 Action.');
    await userLookupController.lookupUser(req, res);
});

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