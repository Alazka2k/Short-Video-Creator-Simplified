const express = require('express');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const axios = require('axios');
const assemblyDataAccess = require('./data/assemblyDataAccess');
const storageService = require('../../shared/utils/storage');
const path = require('path');
const fs = require('fs');

function createServer(assemblyServiceInterface, storageService) {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use((req, res, next) => {
    logger.info(`Assembly Service: Received ${req.method} request for ${req.url}`);
    logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Assemble video endpoint
  app.post('/assemble', async (req, res) => {
    try {
      logger.info('Assembly Service: Handling /assemble request');
      logger.info('Assembly Service: Request body:', req.body);

      const { jobId, templateId } = req.body;

      // Validate required fields
      if (!jobId || !templateId) {
        return res.status(400).json({ 
          error: 'Missing required parameters', 
          details: 'jobId and templateId are required' 
        });
      }

      logger.info(`Assembly Service: Assembling video for job: ${jobId} with template: ${templateId}`);

      try {
        const result = await assemblyServiceInterface.generateContent(jobId, templateId);
        res.json(result);
      } catch (error) {
        logger.error('Error generating content:', error);
        res.status(500).json({
          error: 'Assembly generation failed',
          details: error.message
        });
      }
    } catch (error) {
      logger.error('Assembly Service: Error handling request:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  });

  // Get assembly status endpoint
  app.get('/status/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        return res.status(400).json({
          error: 'Bad Request',
          details: 'jobId is required'
        });
      }

      const status = await assemblyServiceInterface.getStatus(jobId);
      res.json({ status });
    } catch (error) {
      logger.error('Assembly Service: Error getting status:', error);
      
      if (error.message.includes('No assembly found')) {
        res.status(404).json({
          error: 'Not Found',
          details: error.message
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          details: error.message
        });
      }
    }
  });

  // Validate assembly prerequisites endpoint
  app.get('/validate/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        return res.status(400).json({
          error: 'Bad Request',
          details: 'jobId is required'
        });
      }

      const validation = await assemblyServiceInterface.validateAssets(jobId);
      res.json(validation);
    } catch (error) {
      logger.error('Assembly Service: Error validating assembly prerequisites:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  });

  // Webhook endpoint for Creatomate render status updates
  app.post('/webhook', async (req, res) => {
    try {
      logger.info('Assembly Service: Processing webhook:', req.body);
      const { render_id, status, error, metadata, url } = req.body;
      const { assemblyId, jobId } = JSON.parse(metadata || '{}');

      if (!assemblyId) {
        logger.error('No assemblyId found in webhook metadata');
        return res.status(400).json({ error: 'Missing assemblyId in metadata' });
      }

      switch (status) {
        case 'succeeded':
          if (url) {
            try {
              // Stream video from Creatomate to S3
              const response = await axios({
                method: 'get',
                url: url,
                responseType: 'stream'
              });

              // Format date as YYYY-MM-DD
              const date = new Date().toISOString().split('T')[0];
              const storageKey = `assembly/${date}/${jobId}/final.mp4`;
              
              logger.info('Generated storage key:', { storageKey });

              // Download video to temp location first
              const tempDir = path.join(process.env.TEMP || '/tmp', 'assembly-downloads');
              logger.info('Creating temporary directory:', { tempDir });
              await fs.promises.mkdir(tempDir, { recursive: true });
              
              const tempPath = path.join(tempDir, `${jobId}-final.mp4`);
              logger.info('Starting video download to temp file:', { tempPath });
              
              // Stream to temp file
              const writer = fs.createWriteStream(tempPath);
              response.data.pipe(writer);
              
              await new Promise((resolve, reject) => {
                writer.on('finish', () => {
                  logger.info('Video download completed successfully:', { tempPath });
                  resolve();
                });
                writer.on('error', (err) => {
                  logger.error('Error downloading video:', err);
                  reject(err);
                });
              });

              // Upload using storage service and get signed URL
              logger.info('Starting upload to S3:', { tempPath, serviceType: 'assembly' });
              const { url: signedUrl, storageKey: finalStorageKey } = await storageService.uploadFile(tempPath, 'assembly');
              logger.info('Upload to S3 completed:', { 
                storageKey: finalStorageKey,
                signedUrl: signedUrl
              });

              // Clean up temp file
              logger.info('Cleaning up temporary file:', { tempPath });
              await fs.promises.unlink(tempPath);
              logger.info('Temporary file deleted successfully');

              logger.info('Video processing completed successfully:', { 
                jobId,
                assemblyId,
                storageKey: finalStorageKey,
                duration: req.body.duration,
                resolution: `${req.body.width}x${req.body.height}`,
                frameRate: req.body.frame_rate
              });

              // Update assembly output record
              await assemblyDataAccess.updateAssemblyOutput(assemblyId, {
                status: 'completed',
                storage_key: finalStorageKey,
                public_url: signedUrl,
                metadata: {
                  renderId: render_id,
                  completedAt: new Date().toISOString(),
                  duration: req.body.duration,
                  fileSize: req.body.file_size,
                  resolution: {
                    width: req.body.width,
                    height: req.body.height
                  },
                  frameRate: req.body.frame_rate
                }
              });

              logger.info('Assembly completed successfully:', {
                assemblyId,
                jobId,
                storageKey: finalStorageKey,
                renderId: render_id
              });

              return res.json({
                status: 'completed',
                assemblyId,
                storageKey: finalStorageKey
              });
            } catch (error) {
              logger.error('Error storing assembled video:', error);
              await assemblyDataAccess.updateAssemblyOutput(assemblyId, {
                status: 'failed',
                metadata: {
                  error: error.message,
                  errorStack: error.stack,
                  failedAt: new Date().toISOString()
                }
              });
              throw error;
            }
          }
          break;

        case 'failed':
          logger.error('Render failed:', {
            assemblyId,
            jobId,
            renderId: render_id,
            error
          });

          await assemblyDataAccess.updateAssemblyOutput(assemblyId, {
            status: 'failed',
            metadata: {
              error: error || 'Unknown render error',
              failedAt: new Date().toISOString()
            }
          });

          return res.json({
            status: 'failed',
            assemblyId,
            error
          });

        default:
          logger.info('Received status update:', {
            assemblyId,
            jobId,
            status,
            renderId: render_id
          });

          await assemblyDataAccess.updateAssemblyOutput(assemblyId, {
            status: status,
            metadata: {
              renderId: render_id,
              updatedAt: new Date().toISOString()
            }
          });

          return res.json({
            status: status,
            assemblyId
          });
      }
    } catch (error) {
      logger.error('Error processing webhook:', error);
      return res.status(500).json({ error: 'Failed to process webhook' });
    }
  });

  // Catch-all route for unhandled requests
  app.use('*', (req, res) => {
    logger.warn(`Assembly Service: Received unhandled request: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource does not exist.'
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error('Assembly Service Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message
    });
  });

  return app;
}

module.exports = createServer;