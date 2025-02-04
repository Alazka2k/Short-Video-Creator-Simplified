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
          res.status(504).json({ 
            error: 'Service timeout', 
            message: 'The animation generation request took too long to process. Please try again.' 
          });
        }, 300000); // 5 minutes timeout
      
        try {
          const { imageUrl, sceneIndex, jobId, options } = req.body;
          logger.info(`Animation Service: Request body: ${JSON.stringify(req.body)}`);
          
          if (!imageUrl) {
            throw new Error('Missing required parameter: imageUrl');
          }
          if (sceneIndex === undefined) {
            throw new Error('Missing required parameter: sceneIndex');
          }
          if (!jobId) {
            throw new Error('Missing required parameter: jobId');
          }
          if (!options?.videoPrompt) {
            throw new Error('Missing required parameter: options.videoPrompt');
          }
      
          logger.info(`Animation Service: Generating animation for scene ${sceneIndex}, jobId ${jobId} with prompt "${options.videoPrompt}"`);
          
          const result = await animationServiceInterface.process(
            imageUrl,
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

          // Handle specific error types
          if (error.response?.status === 402 && error.response?.data?.errorCode === 'NOT_ENOUGH_FUNDS') {
            return res.status(503).json({
              error: 'Service temporarily unavailable',
              message: 'The animation service is currently unavailable. Our team has been notified and is working to resolve this issue. Please try again later.'
            });
          }

          // Handle other known error types
          const errorMapping = {
            'Missing required parameters': 400,
            'Video prompt is required': 400,
            'Animation Generation Service not initialized': 503,
            'No animation pattern available': 503,
            'Failed to download animation': 503,
            'No download URL provided': 503
          };

          const statusCode = errorMapping[error.message] || 500;
          const userMessage = statusCode === 400 
            ? error.message 
            : 'An unexpected error occurred while generating the animation. Please try again later.';

          res.status(statusCode).json({ 
            error: statusCode === 400 ? 'Invalid request' : 'Internal server error',
            message: userMessage
          });
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