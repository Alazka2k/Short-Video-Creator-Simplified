const express = require('express');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

function createServer(animationServiceInterface) {
    const app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
    app.use((req, res, next) => {
        logger.info(`Animation Service: Received ${req.method} request for ${req.url}`);
        logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
        logger.info(`Request body: ${JSON.stringify(req.body)}`);
        next();
    });
  
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'Animation Service is healthy' });
    });

    // Generate animation endpoint
    app.post('/generate', async (req, res) => {
        logger.info('Animation Service: Handling /generate request');
        const requestTimeout = setTimeout(() => {
          logger.error('Animation Service: Request timed out');
          res.status(504).json({ error: 'Request timed out' });
        }, 300000); // 5 minutes timeout
      
        try {
          const { imagePath, description, sceneIndex, jobId, options } = req.body;
          logger.info(`Animation Service: Request body: ${JSON.stringify(req.body)}`);
          
          if (!imagePath || !description || sceneIndex === undefined || !jobId) {
            throw new Error('Missing required parameters: imagePath, description, sceneIndex, or jobId');
          }
      
          logger.info(`Animation Service: Generating animation for description "${description}", scene ${sceneIndex}, jobId ${jobId}`);
          
          const result = await animationServiceInterface.process(
            imagePath, 
            description, 
            sceneIndex, 
            jobId,
            options, 
            false // false for production
          );
          
          clearTimeout(requestTimeout);
          logger.info('Animation Service: Animation generated successfully');
          res.json({ 
            message: 'Animation generated successfully',
            result: result
          });
        } catch (error) {
          clearTimeout(requestTimeout);
          logger.error('Animation Service: Error generating animation:', error);
          res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

    // Database query endpoints
    app.get('/animations/job/:jobId', async (req, res) => {
      try {
        const { jobId } = req.params;
        const animations = await animationServiceInterface.getAnimationsForJob(jobId);
        res.json(animations);
      } catch (error) {
        logger.error('Error fetching animations for job:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    app.get('/animations/scene/:sceneId', async (req, res) => {
      try {
        const { sceneId } = req.params;
        const animation = await animationServiceInterface.getAnimationForScene(sceneId);
        if (!animation) {
          return res.status(404).json({ error: 'Animation not found' });
        }
        res.json(animation);
      } catch (error) {
        logger.error('Error fetching animation for scene:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    // Catch-all route for unhandled requests
    app.use('*', (req, res) => {
      logger.warn(`Animation Service: Received unhandled request: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist.' });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      logger.error(`Animation Service: Unhandled error: ${err.stack}`);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    });

    return app;
}

module.exports = createServer;