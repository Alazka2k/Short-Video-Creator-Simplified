const express = require('express');
const axios = require('axios');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const { verifyAuth0Token } = require('../../services/auth-service/middleware/auth0-verify.middleware');

const router = express.Router();

// Middleware to protect developer and API documentation
const protectDocs = (req, res, next) => {
  if (req.path.includes('/developer') || req.path.includes('/api')) {
    return verifyAuth0Token(req, res, next);
  }
  next();
};

// Proxy requests to documentation service
router.use('/', protectDocs, async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${config.services.docs.url}${req.path}`,
      data: req.body,
      headers: req.headers,
      responseType: 'stream'
    });

    response.data.pipe(res);
  } catch (error) {
    logger.error('Documentation service error:', error);
    res.status(error.response?.status || 500).json({
      error: 'Documentation request failed',
      message: error.message
    });
  }
});

module.exports = router; 