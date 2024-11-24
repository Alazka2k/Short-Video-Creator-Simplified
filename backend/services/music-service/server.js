const express = require('express');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

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
      logger.info('Music Service: Handling /generate request');
      const requestTimeout = setTimeout(() => {
        logger.error('Music Service: Request timed out');
        res.status(504).json({ error: 'Request timed out' });
      }, 600000); // 10 minutes timeout

      try {
        const { jobId, title, lyrics, tags, instrumental } = req.body;
        logger.info(`Music Service: Request body: ${JSON.stringify(req.body)}`);
        
        if (!jobId) {
          throw new Error('jobId is required');
        }

        if (!title || !tags) {
          throw new Error('title and tags are required');
        }

        const musicData = {
          title,
          lyrics,
          tags,
          instrumental: instrumental ?? true
        };

        logger.info(`Music Service: Generating music for job ${jobId}`);
        
        const result = await musicServiceInterface.process(jobId, musicData);
        
        clearTimeout(requestTimeout);
        logger.info('Music Service: Music generated successfully');
        res.json({ 
          message: 'Music generated successfully',
          result: result
        });
      } catch (error) {
        clearTimeout(requestTimeout);
        logger.error('Music Service: Error generating music:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
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
        res.json(music);
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

    // Get quota info endpoint
    app.get('/quota', async (req, res) => {
      try {
        const quotaInfo = await musicServiceInterface.getQuotaInfo();
        res.json(quotaInfo);
      } catch (error) {
        logger.error('Music Service: Error getting quota info:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    // Check cookie validity endpoint
    app.get('/check-cookie', async (req, res) => {
      try {
        const isValid = await musicServiceInterface.checkCookieValidity();
        res.json({ isValid });
      } catch (error) {
        logger.error('Music Service: Error checking cookie validity:', error);
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