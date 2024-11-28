const express = require('express');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

function createServer(assemblyServiceInterface) {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use((req, res, next) => {
    logger.info(`Assembly Service: Received ${req.method} request for ${req.url}`);
    logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'Assembly Service is healthy' });
  });

  // Assemble video endpoint
  app.post('/assemble', async (req, res) => {
    logger.info('Assembly Service: Handling /assemble request');
    const requestTimeout = setTimeout(() => {
      logger.error('Assembly Service: Request timed out');
      res.status(504).json({ error: 'Request timed out' });
    }, 600000); // 10 minutes timeout for assembly

    try {
      const { jobId, scenes } = req.body;
      logger.info(`Assembly Service: Request body: ${JSON.stringify(req.body)}`);

      if (!jobId || !scenes) {
        throw new Error('jobId and scenes are required');
      }

      logger.info(`Assembly Service: Assembling video for job: ${jobId}`);
      const result = await assemblyServiceInterface.generateContent(jobId, scenes);
      clearTimeout(requestTimeout);
      logger.info('Assembly Service: Video assembled successfully');
      res.json({
        message: 'Video assembled successfully',
        result: result
      });
    } catch (error) {
      clearTimeout(requestTimeout);
      logger.error('Assembly Service: Error assembling video:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Get assembly status endpoint
  app.get('/status/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      const status = await assemblyServiceInterface.getStatus(jobId);
      res.json({ status });
    } catch (error) {
      logger.error('Assembly Service: Error getting status:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Catch-all route for unhandled requests
  app.use('*', (req, res) => {
    logger.warn(`Assembly Service: Received unhandled request: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist.' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error(`Assembly Service: Unhandled error: ${err.stack}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });

  return app;
}

module.exports = createServer; 