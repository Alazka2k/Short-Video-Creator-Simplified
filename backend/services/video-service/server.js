const express = require('express');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const StorageUrlHelper = require('../../shared/utils/storage-url-helper');

function createServer(videoServiceInterface) {
    const app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
    app.use((req, res, next) => {
        logger.info(`Video Service: Received ${req.method} request for ${req.url}`);
        //logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
        //logger.info(`Request body: ${JSON.stringify(req.body)}`);
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
        res.status(504).json({ 
          error: 'Service timeout', 
          message: 'The video generation request took too long to process. Please try again.' 
        });
      }, 900000); // 15 minutes timeout

      try {
        const { 
          imageUrl, 
          videoPrompt, 
          cameraMovement, 
          aspectRatio, 
          sceneIndex,
          jobId,
          model = config.videoGen.model
        } = req.body;

        logger.info(`Video Service: Request body: ${JSON.stringify(req.body)}`);
        
        // Basic validation
        if (!imageUrl) {
          throw new Error('Missing required parameter: imageUrl');
        }
        if (!jobId) {
          throw new Error('Missing required parameter: jobId');
        }
        if (sceneIndex === undefined) {
          throw new Error('Missing required parameter: sceneIndex');
        }

        // Additional validation for ray-1.5
        if (model === 'ray-1.5') {
          if (!videoPrompt) {
            throw new Error('Missing required parameter for ray-1.5: videoPrompt');
          }
          if (!cameraMovement) {
            throw new Error('Missing required parameter for ray-1.5: cameraMovement');
          }
          if (!aspectRatio) {
            throw new Error('Missing required parameter for ray-1.5: aspectRatio');
          }
        }
  
        logger.info(`Video Service: Generating video for scene ${sceneIndex}, job ${jobId} with model ${model}`);
        
        const result = await videoServiceInterface.process(
          imageUrl,
          videoPrompt,
          cameraMovement,
          aspectRatio,
          sceneIndex,
          jobId,
          false,  // isTest = false for production
          model
        );
        
        clearTimeout(requestTimeout);
        logger.info('Video Service: Video generated successfully');
        
        res.json({ 
          message: 'Video generated successfully',
          result: await StorageUrlHelper.refreshUrlsInObject(result)
        });
      } catch (error) {
        clearTimeout(requestTimeout);
        logger.error('Video Service: Error generating video:', {
          error: error.message,
          stack: error.stack,
          details: error.response?.data || error
        });

        // Handle specific error types
        if (error.response?.data?.failure_reason === 'NOT_ENOUGH_FUNDS') {
          return res.status(503).json({
            error: 'Service temporarily unavailable',
            message: 'The video service is currently unavailable. Our team has been notified and is working to resolve this issue. Please try again later.'
          });
        }

        // Handle other known error types
        const errorMapping = {
          'Missing required parameters': 400,
          'Video generation timed out': 504,
          'Video generation failed': 500,
          'Failed to download video': 500,
          'Failed to upload to storage': 500
        };

        // Extract the base error message without additional details
        const baseErrorMessage = error.message.split(':')[0];
        const statusCode = errorMapping[baseErrorMessage] || 500;

        // Provide user-friendly messages based on the error type
        const userMessages = {
          400: error.message, // For validation errors, show the actual message
          504: 'The video generation process took too long. Please try again.',
          500: 'An unexpected error occurred while generating the video. Please try again later.'
        };

        res.status(statusCode).json({
          error: statusCode === 400 ? 'Invalid request' : 'Internal server error',
          message: userMessages[statusCode] || userMessages[500]
        });
      }
    });

    // Get videos by job ID
    app.get('/videos/job/:jobId', async (req, res) => {
      try {
        const { jobId } = req.params;
        const videos = await videoServiceInterface.getVideosByJobId(jobId);
        
        // Refresh URLs in all video objects
        const refreshedVideos = await Promise.all(
          videos.map(video => StorageUrlHelper.refreshUrlsInObject(video))
        );
        
        res.json(refreshedVideos);
      } catch (error) {
        logger.error('Error fetching videos for job:', error);
        res.status(500).json({ 
          error: 'Internal server error', 
          message: 'Failed to fetch videos. Please try again later.' 
        });
      }
    });

    // Get video by scene ID
    app.get('/videos/scene/:sceneId', async (req, res) => {
      try {
        const { sceneId } = req.params;
        const video = await videoServiceInterface.getVideoBySceneId(sceneId);
        if (!video) {
          return res.status(404).json({ error: 'Video not found' });
        }
        
        // Refresh URLs in video object
        const refreshedVideo = await StorageUrlHelper.refreshUrlsInObject(video);
        
        res.json(refreshedVideo);
      } catch (error) {
        logger.error('Error fetching video for scene:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    // Update video metadata
    app.patch('/videos/:videoId/metadata', async (req, res) => {
      try {
        const { videoId } = req.params;
        const { metadata } = req.body;
        
        if (!metadata) {
          return res.status(400).json({ error: 'Metadata is required' });
        }

        const updatedVideo = await videoServiceInterface.updateVideoMetadata(videoId, metadata);
        res.json(updatedVideo);
      } catch (error) {
        logger.error('Error updating video metadata:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    // Delete video
    app.delete('/videos/:videoId', async (req, res) => {
      try {
        const { videoId } = req.params;
        await videoServiceInterface.deleteVideo(videoId);
        res.json({ message: 'Video deleted successfully' });
      } catch (error) {
        logger.error('Error deleting video:', error);
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