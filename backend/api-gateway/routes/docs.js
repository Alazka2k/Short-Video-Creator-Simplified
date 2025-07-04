const express = require('express');
const axios = require('axios');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const jwtAuth = require('../middleware/jwtAuth');

const router = express.Router();

// Proxy requests to documentation service
const proxyToDocs = async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${config.services.docs.url}${req.originalUrl}`, // Use originalUrl to get the full path
      data: req.body,
      // Do not forward auth headers to the downstream service
      headers: {
        'Content-Type': req.headers['content-type']
      },
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
};

// Protect specific documentation sections
router.use('/developer', jwtAuth({ requireUser: true }), proxyToDocs);
router.use('/api', jwtAuth({ requireUser: true }), proxyToDocs);

// Allow public access to other documentation paths
router.use('/', (req, res, next) => {
  // Check if the path has already been handled by the protected routes
  if (req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/developer/')) {
    // Already handled, do nothing
    return next();
  }
  // For all other paths, proxy publicly
  proxyToDocs(req, res);
});

module.exports = router; 