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
  
    // Generate video endpoint, called by image-service
    app.post('/generate', async (req, res) => {
      logger.info('Video Service: Handling /generate request from image-service');
      try {
        const { imageUrl, videoPrompt, sceneId, jobId, parameters } = req.body;

        if (!imageUrl || !jobId || sceneId === undefined) {
          logger.error('Video Service: Invalid request to /generate. Missing imageUrl, jobId, or sceneId.');
          return res.status(400).json({ error: 'Invalid request', details: 'Missing imageUrl, jobId, or sceneId.' });
        }

        logger.info(`Video Service: Generating video for job ${jobId}, scene ${sceneId}`);
        // This is now fire-and-forget from the perspective of the image-service
        videoServiceInterface.process(
          imageUrl,
          videoPrompt,
          parameters?.cameraMovement,
          parameters?.aspectRatio,
          sceneId,
          jobId
        );

        res.status(202).json({ message: 'Video generation started' });
      } catch (error) {
        logger.error('Video Service: Error in /generate endpoint:', {
          message: error.message,
          jobId: req.body.jobId,
          sceneId: req.body.sceneId,
        });
        res.status(500).json({ error: 'Video generation failed', details: error.message });
      }
    });

    // Health check endpoint
    app.get('/health', async (req, res) => {
      try {
        const isHealthy = await videoServiceInterface.isHealthy();
        res.json({ status: 'Video Service is healthy' });
      } catch (error) {
        logger.error('Video Service: Health check failed', error);
        res.status(500).json({ status: 'Video Service is not healthy', details: error.message });
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