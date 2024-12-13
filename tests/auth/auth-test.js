const express = require('express');
const router = express.Router();
const { checkJwt, handleAuthError } = require('../../backend/api-gateway/middleware/auth0');

// Public endpoint for testing auth setup
router.get('/public', (req, res) => {
  res.json({ 
    message: 'This is a public endpoint',
    timestamp: new Date().toISOString()
  });
});

// Protected endpoint for testing auth setup
router.get('/protected', 
  checkJwt, 
  handleAuthError,
  (req, res) => {
    res.json({ 
      message: 'You accessed a protected endpoint!',
      user: req.auth,
      timestamp: new Date().toISOString()
    });
});

module.exports = router; 