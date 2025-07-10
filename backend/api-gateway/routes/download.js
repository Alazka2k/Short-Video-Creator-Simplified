const express = require('express');
const router = express.Router();
const axios = require('axios');
const { downloadFromS3 } = require('../../shared/utils/download');
const jwtAuth = require('../middleware/jwtAuth');
const logger =require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

const JOB_SERVICE_URL = config.services.job.url;

router.get('/:storageKey(*)', jwtAuth({ requireUser: true }), async (req, res) => {
    const { storageKey } = req.params;
    const { userId: reqUserId, isAdmin } = req.user;

    try {
      logger.info('Download request received for:', {
        storageKey,
        userId: reqUserId,
        isAdmin
      });
      
      // Extract Job ID from the storage key using a regex for UUID
      const jobIdMatch = storageKey.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (!jobIdMatch) {
        throw new Error('Could not determine Job ID from storage key.');
      }
      const jobId = jobIdMatch[0];
      
      // Fetch job details from the job service to verify ownership
      const jobDetailsUrl = `${JOB_SERVICE_URL}/jobs/${jobId}`;
      let jobOwnerId;

      try {
        const response = await axios.get(jobDetailsUrl, {
          headers: { 'x-service-auth': process.env.SERVICE_AUTH_TOKEN },
          timeout: 5000 // 5-second timeout
        });
        jobOwnerId = response.data.user_id;
      } catch (error) {
        logger.error('Failed to fetch job details for security check', { jobId, url: jobDetailsUrl, error: error.message });
        throw new Error('Could not verify file permissions.');
      }

      // Security Check: User must be the job owner or an admin
      if (!isAdmin && jobOwnerId !== reqUserId) {
        logger.warn('Forbidden download attempt:', {
          requestingUserId: reqUserId,
          resourceOwnerId: jobOwnerId,
          storageKey
        });
        // Throw an error that will be caught and handled below
        const forbiddenError = new Error('You do not have permission to access this file.');
        forbiddenError.status = 403;
        throw forbiddenError;
      }

      logger.info('User authorized for download', { userId: reqUserId, jobId });

      // Call the download utility
      const { stream, contentType, fileName } = await downloadFromS3(storageKey);

      // Set appropriate headers
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Pipe the stream to response
      stream.pipe(res);

      // Handle errors in the stream
      stream.on('error', (streamError) => {
        logger.error('Error streaming file to client:', { storageKey, error: streamError });
        if (!res.headersSent) {
          // The main catch block will likely handle this, but it's good practice
          res.status(500).json({ error: 'A problem occurred while streaming the file.' });
        }
      });

    } catch (error) {
      logger.error('Download process failed:', { storageKey: req.params.storageKey, userId: reqUserId, error: error.message });
      
      if (res.headersSent) {
        // If headers are already sent, we can't send a JSON error response.
        // The connection will likely be terminated by the client.
        logger.warn('Headers already sent, cannot send error response for failed download.', { storageKey });
        return;
      }

      const status = error.status || 500;
      let userMessage = 'A problem occurred while trying to download your file. Please try again later.';
      let adminDetails = error.message;

      if (status === 403) {
        userMessage = "You don't have permission to download this file. Please check that you are logged into the correct account.";
      } else if (error.code === 'NoSuchKey' || status === 404) {
        userMessage = "The requested file could not be found. It may have been moved or deleted.";
      }

      res.status(status).json({
        error: userMessage,
        ...(isAdmin && { details: adminDetails })
      });
    }
});

module.exports = router; 