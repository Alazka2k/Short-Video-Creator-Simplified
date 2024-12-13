const axios = require('axios');
require('dotenv').config();

const environments = {
  development: {
    tokenExpiration: 2592000, // 30 days
    tokenExpirationImplicit: 7200, // 2 hours
    refreshTokenRotation: false
  },
  staging: {
    tokenExpiration: 86400, // 24 hours
    tokenExpirationImplicit: 3600, // 1 hour
    refreshTokenRotation: true
  },
  production: {
    tokenExpiration: 43200, // 12 hours
    tokenExpirationImplicit: 1800, // 30 minutes
    refreshTokenRotation: true
  }
}; 