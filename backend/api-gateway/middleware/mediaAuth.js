const { checkJwt, handleAuthError } = require('./auth0');

// Export the middleware chain
module.exports = [checkJwt, handleAuthError]; 