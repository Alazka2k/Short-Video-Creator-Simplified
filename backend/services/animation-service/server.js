const express = require('express');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const StorageUrlHelper = require('../../shared/utils/storage-url-helper');

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
          const { imagePath, imageUrl, sceneIndex, jobId, options } = req.body;
          logger.info(`Animation Service: Request body: ${JSON.stringify(req.body)}`);
          
          // Use imageUrl if provided, fall back to imagePath
          const imageSource = imageUrl || imagePath;
          
          if (!imageSource || sceneIndex === undefined || !jobId) {
            throw new Error('Missing required parameters: image source, sceneIndex, or jobId');
          }
      
          if (!options?.videoPrompt) {
            throw new Error('Video prompt is required in options');
          }
      
          logger.info(`Animation Service: Generating animation for scene ${sceneIndex}, jobId ${jobId} with prompt "${options.videoPrompt}"`);
          
          const result = await animationServiceInterface.process(
            imageSource,
            jobId,
            sceneIndex,
            jobId,
            options,
            false
          );
          
          clearTimeout(requestTimeout);
          logger.info('Animation Service: Animation generated successfully');

          // Transform response to use storage information
          const response = {
            message: 'Animation generated successfully',
            result: {
              ...result,
              url: undefined
            }
          };
          
          res.json(response);
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
        
        // Transform response to use storage URLs
        const transformedAnimations = animations.map(animation => ({
          ...animation,
          storage_key: animation.storage_key,
          public_url: animation.public_url
        }));
        
        res.json(transformedAnimations);
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
        
        // Refresh any URLs in the response
        const refreshedAnimation = await StorageUrlHelper.refreshUrlsInObject(animation);
        
        res.json(refreshedAnimation);
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