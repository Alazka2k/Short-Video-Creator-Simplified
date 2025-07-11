const express = require('express');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

function createServer(imageServiceInterface) {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use((req, res, next) => {
    logger.info(`Image Service: Received ${req.method} request for ${req.url}`);
    //logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
    //logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
  });

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const isHealthy = await imageServiceInterface.service.isHealthy();
      if (isHealthy) {
        res.json({ status: 'Image Service is healthy', initialized: true });
      } else {
        res.status(503).json({ 
          status: 'Image Service is unhealthy',
          initialized: false,
          message: 'Service is attempting to reconnect'
        });
      }
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({ 
        status: 'Image Service is unhealthy',
        error: error.message
      });
    }
  });

  // Generate image endpoint
  app.post('/generate', async (req, res) => {
    logger.info('Image Service: Handling /generate request');
    const requestTimeout = setTimeout(() => {
      logger.error('Image Service: Request timed out');
      res.status(504).json({ error: 'Request timed out' });
    }, 300000); // 5 minutes timeout

    try {
      const { prompt, sceneIndex, jobId } = req.body;
      //logger.info(`Image Service: Request body: ${JSON.stringify(req.body)}`);

      if (!prompt) {
        throw new Error('prompt is missing or undefined');
      }

      logger.info(`Image Service: Generating image with prompt: ${prompt}`);
      const result = await imageServiceInterface.generateContent(prompt, sceneIndex, jobId);
      clearTimeout(requestTimeout);
      logger.info('Image Service: Image generated successfully');
      res.json({
        message: 'Image generated successfully',
        result: result
      });
    } catch (error) {
      clearTimeout(requestTimeout);
      logger.error('Image Service: Error generating image:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Webhook endpoint for receiving progress updates
  app.post('/webhook/:jobId/:sceneId', async (req, res) => {
    const { jobId, sceneId } = req.params;
    const payload = req.body;
    logger.info(`Image Service: Handling webhook for jobId: ${jobId}, sceneId: ${sceneId}`);

    try {
      // Pass the data to the service to handle the async logic
      await imageServiceInterface.service.handleWebhook(jobId, sceneId, payload);
      res.status(200).json({ message: 'Webhook processed' });
    } catch (error) {
      logger.error('Image Service: Error processing webhook:', {
        jobId,
        sceneId,
        error: error.message
      });
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });

  // Catch-all route for unhandled requests
  app.use('*', (req, res) => {
    logger.warn(`Image Service: Received unhandled request: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist.' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error(`Image Service: Unhandled error: ${err.stack}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });

  return app;
}

module.exports = createServer;