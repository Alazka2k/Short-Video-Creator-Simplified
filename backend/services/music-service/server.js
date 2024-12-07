const express = require('express');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const StorageUrlHelper = require('../../shared/utils/storage-url-helper');

const MAX_PROMPT_LENGTH = 200;

function createServer(musicServiceInterface) {
    const app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    app.use((req, res, next) => {
        logger.info(`Music Service: Received ${req.method} request for ${req.url}`);
        logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
        logger.info(`Request body: ${JSON.stringify(req.body)}`);
        next();
    });
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'Music Service is healthy' });
    });

    // Generate music endpoint
    app.post('/generate', async (req, res) => {
      let requestTimeout;
      try {
        requestTimeout = setTimeout(() => {
          logger.error('Music Service: Request timed out');
          res.status(504).json({ error: 'Request timed out' });
        }, 600000); // 10 minutes timeout

        const { jobId, title, prompt, style, instrumental, lyric, custom } = req.body;
        logger.info(`Music Service: Request body: ${JSON.stringify(req.body)}`);
        
        if (!jobId) {
          throw new Error('jobId is required');
        }

        if (!prompt) {
          throw new Error('prompt is required');
        }

        if (prompt.length > MAX_PROMPT_LENGTH) {
          throw new Error(`prompt must be less than or equal ${MAX_PROMPT_LENGTH} characters`);
        }

        const musicData = {
          title: title,
          prompt: prompt.substring(0, MAX_PROMPT_LENGTH),
          style: style || '',
          instrumental: instrumental ?? true,
          lyric: lyric,
          custom: custom ?? false
        };

        logger.info(`Music Service: Generating music for job ${jobId}`);
        
        const result = await musicServiceInterface.process(jobId, musicData);
        
        clearTimeout(requestTimeout);
        requestTimeout = null;

        logger.info('Music Service: Music generated successfully');
        res.json({ 
          message: 'Music generated successfully',
          result: await StorageUrlHelper.refreshUrlsInObject(result)
        });
      } catch (error) {
        if (requestTimeout) {
          clearTimeout(requestTimeout);
        }

        const statusCode = error.response?.status || 500;
        const errorMessage = error.message || 'Internal server error';

        logger.error('Music Service: Error generating music:', {
          message: errorMessage,
          status: statusCode
        });

        res.status(statusCode).json({ 
          error: statusCode === 504 ? 'Gateway timeout' : 'Internal server error',
          details: errorMessage
        });
      }
    });

    // Get music by job ID endpoint
    app.get('/music/job/:jobId', async (req, res) => {
      try {
        const { jobId } = req.params;
        const music = await musicServiceInterface.getMusicByJobId(jobId);
        if (!music) {
          return res.status(404).json({ error: 'Music not found' });
        }
        
        // Refresh URLs in music object
        const refreshedMusic = await StorageUrlHelper.refreshUrlsInObject(music);
        
        res.json(refreshedMusic);
      } catch (error) {
        logger.error('Error fetching music for job:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    // Update music metadata endpoint
    app.patch('/music/:musicId/metadata', async (req, res) => {
      try {
        const { musicId } = req.params;
        const { metadata } = req.body;
        
        if (!metadata) {
          return res.status(400).json({ error: 'Metadata is required' });
        }

        const updatedMusic = await musicServiceInterface.updateMusicMetadata(musicId, metadata);
        res.json(updatedMusic);
      } catch (error) {
        logger.error('Error updating music metadata:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    // Delete music endpoint
    app.delete('/music/:musicId', async (req, res) => {
      try {
        const { musicId } = req.params;
        await musicServiceInterface.deleteMusic(musicId);
        res.json({ message: 'Music deleted successfully' });
      } catch (error) {
        logger.error('Error deleting music:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    // Catch-all route for unhandled requests
    app.use('*', (req, res) => {
      logger.warn(`Music Service: Received unhandled request: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist.' });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      logger.error(`Music Service: Unhandled error: ${err.stack}`);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    });

    return app;
}

module.exports = createServer;