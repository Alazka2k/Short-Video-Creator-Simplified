const express = require('express');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

function createServer(videoServiceInterface) {
    const app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
    app.use((req, res, next) => {
        logger.info(`Video Service: Received ${req.method} request for ${req.url}`);
        logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
        logger.info(`Request body: ${JSON.stringify(req.body)}`);
        next();
    });
  
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'Video Service is healthy' });
    });

    // Generate video endpoint
    app.post('/generate', async (req, res) => {
      logger.info('Video Service: Handling /generate request');
      const requestTimeout = setTimeout(() => {
        logger.error('Video Service: Request timed out');
        res.status(504).json({ error: 'Request timed out' });
      }, 900000); // 15 minutes timeout

      try {
        const { imagePath, videoPrompt, cameraMovement, aspectRatio, sceneIndex } = req.body;
        logger.info(`Video Service: Request body: ${JSON.stringify(req.body)}`);
        
        if (!imagePath || !videoPrompt || !cameraMovement || !aspectRatio || sceneIndex === undefined) {
          throw new Error('Missing required parameters');
        }
  
        logger.info(`Video Service: Generating video for scene ${sceneIndex}`);
        
        const result = await videoServiceInterface.process(imagePath, videoPrompt, cameraMovement, aspectRatio, sceneIndex, false);
        
        clearTimeout(requestTimeout);
        logger.info('Video Service: Video generated successfully');
        res.json({ 
          message: 'Video generated successfully',
          result: result
        });
      } catch (error) {
        clearTimeout(requestTimeout);
        logger.error('Video Service: Error generating video:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    // Catch-all route for unhandled requests
    app.use('*', (req, res) => {
      logger.warn(`Video Service: Received unhandled request: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist.' });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      logger.error(`Video Service: Unhandled error: ${err.stack}`);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    });

    return app;
}

module.exports = createServer;