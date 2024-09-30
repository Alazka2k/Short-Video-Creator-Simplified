const express = require('express');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

function createServer(voiceServiceInterface) {
    const app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
    app.use((req, res, next) => {
        logger.info(`Voice Service: Received ${req.method} request for ${req.url}`);
        logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
        logger.info(`Request body: ${JSON.stringify(req.body)}`);
        next();
    });
  
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'Voice Service is healthy' });
    });

    // Generate voice endpoint
    app.post('/generate', async (req, res) => {
      logger.info('Voice Service: Handling /generate request');
      const requestTimeout = setTimeout(() => {
        logger.error('Voice Service: Request timed out');
        res.status(504).json({ error: 'Request timed out' });
      }, 300000); // 5 minutes timeout

      try {
        const { text, sceneIndex, voiceId } = req.body;
        logger.info(`Voice Service: Request body: ${JSON.stringify(req.body)}`);
        
        if (!text) {
          throw new Error('text is missing or undefined');
        }
  
        logger.info(`Voice Service: Generating voice with input text length: ${text.length}`);
        
        const result = await voiceServiceInterface.process(text, sceneIndex || 0, voiceId);
        
        clearTimeout(requestTimeout);
        logger.info('Voice Service: Voice generated successfully');
        res.json({ 
          message: 'Voice generated successfully',
          result: result
        });
      } catch (error) {
        clearTimeout(requestTimeout);
        logger.error('Voice Service: Error generating voice:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    app.get('/voices', async (req, res) => {
      logger.info('Voice Service: Handling /voices request');
      try {
        const voices = await voiceServiceInterface.listVoices();
        logger.info(`Voice Service: Retrieved ${voices.length} voices`);
        res.json(voices);
      } catch (error) {
        logger.error('Voice Service: Error listing voices:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    // Add this at the end of your routes, but before any error handling middleware
    app.use((req, res, next) => {
    logger.warn(`Voice Service: Unhandled ${req.method} request for ${req.url}`);
    next();
    });

    // Catch-all route for unhandled requests
    app.use('*', (req, res) => {
      logger.warn(`Voice Service: Received unhandled request: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist.' });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      logger.error(`Voice Service: Unhandled error: ${err.stack}`);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    });

    return app;
}

module.exports = createServer;