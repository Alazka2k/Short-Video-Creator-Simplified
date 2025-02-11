const express = require('express');
const router = express.Router();
const logger = require('../../shared/utils/logger');
const StorageUrlHelper = require('../../shared/utils/storage-url-helper');
const { verifyAuth0Token } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const serviceAuthMiddleware = require('../middleware/serviceAuth');

/**
 * @route POST /api/storage/refresh-urls
 * @description Refresh URLs for given storage keys
 * @access Protected
 */
router.post('/refresh-urls',
  verifyAuth0Token,
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      const { storageKeys } = req.body;
      
      if (!Array.isArray(storageKeys)) {
        return res.status(400).json({ 
          error: 'Invalid request',
          message: 'storageKeys must be an array'
        });
      }

      logger.info('Refreshing URLs:', { count: storageKeys.length });
      
      const refreshedUrls = await StorageUrlHelper.getInstance().refreshUrlBatch(storageKeys);
      const results = {};
      
      refreshedUrls.forEach((value, key) => {
        results[key] = value.url;
      });

      res.json({ urls: results });
    } catch (error) {
      logger.error('Error refreshing URLs:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to refresh URLs'
      });
    }
  }
);

module.exports = router; 