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

      // Validate request
      if (!jobId) {
        throw new Error('jobId is required');
      }

      if (!Array.isArray(scenes) || scenes.length === 0) {
        throw new Error('scenes array is required and must not be empty');
      }

      // Validate scene configurations
      scenes.forEach(scene => {
        if (!scene.sceneNumber || typeof scene.duration !== 'number') {
          throw new Error('Each scene must have a sceneNumber and duration');
        }
      });

      logger.info(`Assembly Service: Assembling video for job: ${jobId}`);
      const result = await assemblyServiceInterface.generateContent(jobId, scenes);
      
      clearTimeout(requestTimeout);
      logger.info('Assembly Service: Video assembly initiated successfully');
      res.json({
        message: 'Video assembly initiated successfully',
        result: result
      });
    } catch (error) {
      clearTimeout(requestTimeout);
      logger.error('Assembly Service: Error assembling video:', error);
      
      // Send appropriate error response based on error type
      if (error.message.includes('Missing required assets')) {
        res.status(400).json({
          error: 'Bad Request',
          details: 'Missing required assets for video assembly. Ensure all scenes have video and voice content.'
        });
      } else if (error.message.includes('configuration')) {
        res.status(400).json({
          error: 'Bad Request',
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