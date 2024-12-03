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
    try {
      logger.info('Assembly Service: Handling /assemble request');
      logger.info('Assembly Service: Request body:', req.body);

      const { jobId, scenes } = req.body;

      if (!jobId || !scenes) {
        return res.status(400).json({ 
          error: 'Missing required parameters', 
          details: 'jobId and scenes are required' 
        });
      }

      logger.info(`Assembly Service: Assembling video for job: ${jobId}`);
      const result = await assemblyServiceInterface.generateContent(jobId, scenes);
      res.json(result);

    } catch (error) {
      logger.error('Assembly Service: Error assembling video:', error);

      // Improved error handling
      const errorMessage = error?.message || 'Unknown error occurred';
      const statusCode = error?.statusCode || 500;
      const errorResponse = {
        error: 'Assembly failed',
        details: errorMessage
      };

      // Handle specific error cases
      if (errorMessage.includes('Missing required assets')) {
        errorResponse.statusCode = 400;
        errorResponse.error = 'Missing assets';
      } else if (errorMessage.includes('Scene not found')) {
        errorResponse.statusCode = 404;
        errorResponse.error = 'Scene not found';
      }

      res.status(statusCode).json(errorResponse);
    }
  });

  // Get assembly status endpoint
  app.get('/status/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        return res.status(400).json({
          error: 'Bad Request',
          details: 'jobId is required'
        });
      }

      const status = await assemblyServiceInterface.getStatus(jobId);
      res.json({ status });
    } catch (error) {
      logger.error('Assembly Service: Error getting status:', error);
      
      if (error.message.includes('No assembly found')) {
        res.status(404).json({
          error: 'Not Found',
          details: error.message
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          details: error.message
        });
      }
    }
  });

  // Validate assembly prerequisites endpoint
  app.get('/validate/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        return res.status(400).json({
          error: 'Bad Request',
          details: 'jobId is required'
        });
      }

      const validation = await assemblyServiceInterface.validateAssets(jobId);
      res.json(validation);
    } catch (error) {
      logger.error('Assembly Service: Error validating assembly prerequisites:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  });

  // Catch-all route for unhandled requests
  app.use('*', (req, res) => {
    logger.warn(`Assembly Service: Received unhandled request: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource does not exist.'
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error(`Assembly Service: Unhandled error: ${err.stack}`);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  });

  return app;
}

module.exports = createServer;