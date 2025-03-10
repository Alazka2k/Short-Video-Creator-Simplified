const express = require('express');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const axios = require('axios');
const assemblyDataAccess = require('./data/assemblyDataAccess');
const storageService = require('../../shared/utils/storage');
const path = require('path');
const fs = require('fs');
const knex = require('knex')(require('../../../knexfile')[process.env.NODE_ENV]);
const { AssemblyServiceInterface } = require('./index');

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
        
        // Return enhanced response
        res.json({
          message: "Video assembly started",
          assemblyId: result.assemblyId,
          jobId,
          templateId,
          creatomateId: result.creatomateId,
          status: "processing"
        });
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
      logger.info('Assembly Service: Processing webhook:', {
        id: req.body.id,
        status: req.body.status,
        hasUrl: !!req.body.url,
        hasError: !!req.body.error,
        metadata: req.body.metadata
      });
      
      const { id: creatomateId, status, error, metadata, url } = req.body;
      let parsedMetadata = {};
      
      try {
        parsedMetadata = JSON.parse(metadata || '{}');
        logger.info('Parsed webhook metadata:', parsedMetadata);
      } catch (parseError) {
        logger.error('Error parsing webhook metadata:', {
          error: parseError.message,
          metadata
        });
        return res.status(400).json({ error: 'Invalid metadata format' });
      }
      
      const { assemblyId, jobId, templateId } = parsedMetadata;

      if (!assemblyId) {
        logger.error('No assemblyId found in webhook metadata');
        return res.status(400).json({ error: 'Missing assemblyId in metadata' });
      }

      // Get the current assembly data
      const assemblyData = await assemblyDataAccess.getAssemblyOutput(assemblyId);
      if (!assemblyData) {
        logger.error('Assembly not found for webhook update:', { assemblyId });
        return res.status(404).json({ error: 'Assembly not found' });
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
              const uploadResult = await storageService.uploadFile(tempPath, 'assembly');
              const { url: signedUrl, storageKey: finalStorageKey } = uploadResult;
              
              logger.info('Upload to S3 completed:', { 
                storageKey: finalStorageKey,
                signedUrl: signedUrl
              });

              // Clean up temp file
              logger.info('Cleaning up temporary file:', { tempPath });
              await fs.promises.unlink(tempPath);
              logger.info('Temporary file deleted successfully');

              // Get scene count from assembly data
              const sceneCount = assemblyData.metadata?.jobData?.scenes || 0;

              logger.info('Video processing completed successfully:', { 
                jobId,
                assemblyId,
                storageKey: finalStorageKey,
                publicUrl: signedUrl,
                duration: req.body.duration,
                resolution: `${req.body.width}x${req.body.height}`,
                frameRate: req.body.frame_rate
              });

              // Update assembly output record with completion data
              await assemblyDataAccess.updateAssemblyOutput(assemblyId, {
                status: 'completed',
                storage_key: finalStorageKey,
                public_url: signedUrl,
                creatomate_id: creatomateId,
                template_id: templateId,
                metadata: {
                  jobData: {
                    id: jobId,
                    scenes: sceneCount,
                    status: assemblyData.metadata?.jobData?.status || 'completed'
                  },
                  duration: req.body.duration,
                  fileSize: req.body.file_size,
                  frameRate: req.body.frame_rate,
                  resolution: {
                    width: req.body.width,
                    height: req.body.height
                  },
                  templateInfo: assemblyData.metadata?.templateInfo || {}
                }
              });

              // Verify the update was successful by retrieving the latest record
              const updatedAssembly = await assemblyDataAccess.getAssemblyOutput(assemblyId);
              logger.info('Verified assembly status after update:', {
                assemblyId,
                status: updatedAssembly.status,
                expectedStatus: 'completed',
                statusMatch: updatedAssembly.status === 'completed'
              });

              // If status wasn't updated correctly, log a warning but don't force it
              if (updatedAssembly.status !== 'completed') {
                logger.warn('Assembly status not updated to completed as expected', {
                  assemblyId,
                  currentStatus: updatedAssembly.status,
                  expectedStatus: 'completed'
                });
              }

              logger.info('Assembly completed successfully:', {
                assemblyId,
                jobId,
                templateId,
                storageKey: finalStorageKey,
                creatomateId,
                status: 'completed'
              });

              return res.json({
                status: 'completed',
                assemblyId,
                jobId,
                templateId,
                creatomateId,
                storageKey: finalStorageKey,
                publicUrl: signedUrl,
                metadata: {
                  duration: req.body.duration,
                  resolution: `${req.body.width}x${req.body.height}`,
                  frameRate: req.body.frame_rate
                }
              });
            } catch (error) {
              logger.error('Error storing assembled video:', error);
              
              // Update assembly record with error status
              await assemblyDataAccess.updateAssemblyOutput(assemblyId, {
                status: 'failed',
                creatomate_id: creatomateId,
                metadata: {
                  error: error.message,
                  errorStack: error.stack,
                  failedAt: new Date().toISOString(),
                  stage: 'video_processing'
                }
              });

              return res.status(500).json({
                status: 'failed',
                error: 'Failed to process assembled video',
                details: error.message
              });
            }
          }
          break;

        case 'failed':
          logger.error('Render failed:', {
            assemblyId,
            jobId,
            creatomateId: creatomateId,
            error
          });

          await assemblyDataAccess.updateAssemblyOutput(assemblyId, {
            status: 'failed',
            creatomate_id: creatomateId,
            metadata: {
              error: error || 'Unknown render error',
              failedAt: new Date().toISOString(),
              stage: 'creatomate_render'
            }
          });

          return res.json({
            status: 'failed',
            assemblyId,
            creatomateId,
            error,
            stage: 'creatomate_render'
          });

        default:
          logger.info('Received status update:', {
            assemblyId,
            jobId,
            status,
            creatomateId: creatomateId
          });

          // Get the current assembly data to check status
          const currentAssembly = await assemblyDataAccess.getAssemblyOutput(assemblyId);
          
          // Only update status if not already completed
          const newStatus = status === 'processing' ? 'processing' : 'pending';
          const shouldUpdateStatus = currentAssembly.status !== 'completed';
          
          logger.info('Processing webhook status update:', {
            assemblyId,
            currentStatus: currentAssembly.status,
            incomingStatus: status,
            proposedNewStatus: newStatus,
            willUpdateStatus: shouldUpdateStatus
          });

          const updateData = {
            creatomate_id: creatomateId,
            metadata: {
              renderId: creatomateId,
              lastStatusUpdate: new Date().toISOString(),
              currentStatus: status
            }
          };
          
          // Only include status in the update if it should be updated
          if (shouldUpdateStatus) {
            updateData.status = newStatus;
          }

          await assemblyDataAccess.updateAssemblyOutput(assemblyId, updateData);

          return res.json({
            status: currentAssembly.status === 'completed' ? 'completed' : status,
            assemblyId,
            creatomateId: creatomateId,
            lastUpdate: new Date().toISOString()
          });
      }
    } catch (error) {
      logger.error('Error processing webhook:', error);
      
      // Try to update assembly status if we have the ID
      if (req.body?.metadata) {
        try {
          const { assemblyId } = JSON.parse(req.body.metadata);
          if (assemblyId) {
            await assemblyDataAccess.updateAssemblyOutput(assemblyId, {
              status: 'failed',
              metadata: {
                error: error.message,
                errorStack: error.stack,
                failedAt: new Date().toISOString(),
                stage: 'webhook_processing'
              }
            });
          }
        } catch (updateError) {
          logger.error('Failed to update assembly status:', updateError);
        }
      }
      
      return res.status(500).json({
        status: 'failed',
        error: 'Failed to process webhook',
        details: error.message
      });
    }
  });

  // Endpoint to get all assembly outputs with pagination and filtering
  app.get('/videos', async (req, res) => {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'desc',
        status: req.query.status,
        userId: req.query.userId,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      logger.info('Getting assembly outputs with filters:', filters);
      const result = await assemblyServiceInterface.getAllAssemblyOutputs(filters);
      res.json(result);
    } catch (error) {
      logger.error('Error in /videos endpoint:', error);
      res.status(500).json({ error: error.message });
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