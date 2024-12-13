const { auth } = require('express-oauth2-jwt-bearer');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');

// Create middleware for validating JWT tokens
const checkJwt = auth({
  audience: config.auth.auth0.audience,
  issuerBaseURL: `https://${config.auth.auth0.domain}/`,
  tokenSigningAlg: 'RS256'
});

// Log the current auth configuration (without sensitive data)
logger.info('Auth0 Configuration:', {
  domain: config.auth.auth0.domain,
  audience: config.auth.auth0.audience,
  environment: process.env.NODE_ENV
});

// Error handling middleware
const handleAuthError = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing token' 
    });
    return;
  }
  next(err);
};

module.exports = {
  checkJwt,
  handleAuthError
}; 