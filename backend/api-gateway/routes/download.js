const express = require('express');
const router = express.Router();
const { downloadFromS3 } = require('../../shared/utils/download');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const logger = require('../../shared/utils/logger');

router.get('/:storageKey', 
  verifyAuth0Token,
  checkPermission('/api/download'),
  async (req, res) => {
    try {
      const { storageKey } = req.params;
      logger.info('Download request received for:', { 
        storageKey,
        userId: req.user?.sub,
        permissions: req.user?.permissions 
      });

      // Call the download utility
      const { stream, contentType, fileName } = await downloadFromS3(storageKey);

      // Set appropriate headers
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Pipe the stream to response
      stream.pipe(res);

      // Handle errors in the stream
      stream.on('error', (error) => {
        logger.error('Error streaming file:', error);
        // Only send error if headers haven't been sent
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      });
    } catch (error) {
      logger.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
});

module.exports = router; 