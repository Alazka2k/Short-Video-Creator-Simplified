const express = require('express');
const router = express.Router();
const { downloadFromS3 } = require('../../shared/utils/download');
const jwtAuth = require('../middleware/jwtAuth');
const logger = require('../../shared/utils/logger');

router.get('/:storageKey(*)', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      const { storageKey } = req.params;
      const { userId: reqUserId, isAdmin } = req.user;
      
      logger.info('Download request received for:', { 
        storageKey,
        userId: reqUserId,
        isAdmin
      });

      // Security Check: Ensure users can only download their own files, unless they are an admin.
      // This assumes a storage key format like: `user-123/job-abc/video.mp4`
      const keyOwnerId = parseInt(storageKey.split('/')[0].split('-')[1], 10);
      if (!isAdmin && keyOwnerId !== reqUserId) {
        logger.warn('Forbidden download attempt:', {
          requestingUserId: reqUserId,
          resourceOwnerId: keyOwnerId,
          storageKey
        });
        return res.status(403).json({ error: 'Forbidden: You do not have permission to access this file.' });
      }

      // Call the download utility
      const { stream, contentType, fileName } = await downloadFromS3(storageKey);

      // Set appropriate headers
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Pipe the stream to response
      stream.pipe(res);

      // Handle errors in the stream
      stream.on('error', (error) => {
        logger.error('Error streaming file:', { storageKey, error });
        // Only send error if headers haven't been sent
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      });
    } catch (error) {
      logger.error('Download error:', { storageKey: req.params.storageKey, error });
      // Check if headers have been sent to avoid crashing
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to initiate file download' });
      }
    }
});

module.exports = router; 