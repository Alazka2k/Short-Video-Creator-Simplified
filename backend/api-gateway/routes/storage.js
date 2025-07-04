const express = require('express');
const router = express.Router();
const logger = require('../../shared/utils/logger');
const StorageUrlHelper = require('../../shared/utils/storage-url-helper');
const jwtAuth = require('../middleware/jwtAuth');

/**
 * @route POST /api/storage/refresh-urls
 * @description Refresh URLs for given storage keys
 * @access User
 */
router.post('/refresh-urls', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      const { storageKeys } = req.body;
      const { userId, isAdmin } = req.user;
      
      if (!Array.isArray(storageKeys)) {
        return res.status(400).json({ 
          error: 'Invalid request',
          message: 'storageKeys must be an array'
        });
      }

      // Security TODO: Implement an ownership check here.
      // The current implementation allows any authenticated user to refresh the URL for any storage key.
      // A robust solution would involve checking each key's ownership against the requesting user ID.
      logger.info('Refreshing URLs for user:', { userId, count: storageKeys.length });
      
      const refreshedUrls = await StorageUrlHelper.getInstance().refreshUrlBatch(storageKeys);
      const results = {};
      
      refreshedUrls.forEach((value, key) => {
        results[key] = value.url;
      });

      res.json({ urls: results });
    } catch (error) {
      logger.error('Error refreshing URLs:', { userId: req.user.userId, error });
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to refresh URLs'
      });
    }
  }
);

module.exports = router; 