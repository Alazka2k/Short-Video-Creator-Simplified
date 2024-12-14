const crypto = require('crypto');

/**
 * Generate and hash refresh tokens for session management
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

module.exports = {
  generateToken,
  hashToken
}; 