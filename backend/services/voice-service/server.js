const express = require('express');
const path = require('path');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');

function createServer(voiceServiceInterface) {
    const app = express();
    app.use(express.json());
  
    app.use((req, res, next) => {
      logger.info(`Voice Service: Received ${req.method} request for ${req.url}`);
      next();
    });
  
    const router = express.Router();
  
    router.post('/generate', async (req, res) => {
      logger.info('Voice Service: Handling /generate request');
      try {
        const { text, voiceId } = req.body;
        logger.info(`Voice Service: Request body: ${JSON.stringify(req.body)}`);
        
        if (!text) {
          throw new Error('text is missing or undefined');
        }
  
        // Generate a unique filename for this request
        const filename = `voice_${Date.now()}.mp3`;
        const outputPath = path.join(config.voiceGen.outputDirectory, filename);
  
        logger.info(`Voice Service: Generating voice with input text length: ${text.length}`);
        
        const result = await voiceServiceInterface.process(text, outputPath, voiceId);
        
        logger.info('Voice Service: Voice generated successfully');
        res.json({ 
          message: 'Voice generated successfully',
          filePath: result
        });
      } catch (error) {
        logger.error('Voice Service: Error generating voice:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });

    router.get('/voices', async (req, res) => {
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

    // Use the router with the /api/voice prefix
    app.use('/api/voice', router);

    // Catch-all for undefined routes
    app.use((req, res) => {
      logger.warn(`Voice Service: Received request for undefined route: ${req.method} ${req.url}`);
      res.status(404).json({ error: 'Not Found' });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      logger.error(`Voice Service: Unhandled error: ${err.stack}`);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    });

    return app;
}

module.exports = createServer;