const express = require('express');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const axios = require('axios');

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
    res.json({ status: 'Assembly Service is healthy' });
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

              const storageKey = `assembly/${assemblyId}.mp4`;
              await storageService.s3.upload({
                Bucket: storageService.bucket,
                Key: storageKey,
                Body: response.data,
                ContentType: 'video/mp4'
              }).promise();

              const publicUrl = await storageService.getSignedUrl(storageKey, 3600);

              // Update assembly record with storage information
              await assemblyServiceInterface.service.assemblyDataAccess.updateAssemblyOutput(assemblyId, {
                status: 'completed',
                storage_key: storageKey,
                public_url: publicUrl,
                metadata: {
                  completedAt: new Date().toISOString(),
                  renderId: render_id,
                  creatomateUrl: url
                },
                updated_at: new Date()
              });

              logger.info('Assembly completed successfully:', { 
                assemblyId, 
                jobId,
                renderId: render_id,
                storageKey, 
                publicUrl 
              });
            } catch (storageError) {
              logger.error('Error storing assembled video:', storageError);
              await assemblyServiceInterface.service.assemblyDataAccess.updateAssemblyOutput(assemblyId, {
                status: 'error',
                error_message: `Failed to store assembled video: ${storageError.message}`,
                updated_at: new Date()
              });
            }
          } else {
            logger.error('No video URL provided in webhook for completed render');
            await assemblyServiceInterface.service.assemblyDataAccess.updateAssemblyOutput(assemblyId, {
              status: 'error',
              error_message: 'No video URL provided in webhook',
              updated_at: new Date()
            });
          }
          break;

        case 'failed':
          await assemblyServiceInterface.service.assemblyDataAccess.updateAssemblyOutput(assemblyId, {
            status: 'error',
            error_message: error || 'Render failed',
            updated_at: new Date()
          });
          logger.error('Assembly failed:', { jobId, assemblyId, renderId: render_id, error });
          break;

        default:
          logger.info('Assembly status update:', { jobId, assemblyId, renderId: render_id, status });
          await assemblyServiceInterface.service.assemblyDataAccess.updateAssemblyOutput(assemblyId, {
            status: status === 'processing' ? 'processing' : 'pending',
            updated_at: new Date()
          });
      }

      res.json({ message: 'Webhook processed successfully' });
    } catch (error) {
      logger.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
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