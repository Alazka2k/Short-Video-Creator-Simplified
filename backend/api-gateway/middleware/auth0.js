const { auth } = require('express-oauth2-jwt-bearer');
const config = require('../../shared/utils/config');

// Create middleware for validating JWT tokens
const checkJwt = auth({
  audience: config.auth.auth0.audience,
  issuerBaseURL: `https://${config.auth.auth0.domain}/`,
  tokenSigningAlg: 'RS256'
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