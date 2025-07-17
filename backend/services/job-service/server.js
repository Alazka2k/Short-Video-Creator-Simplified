// backend/services/job-service/server.js

const express = require('express');
const logger = require('../../shared/utils/logger');
const progressTracker = require('./utils/progress-tracker');

function createServer(jobService) {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Request logging middleware with rate limiting
  const lastLogged = new Map(); // Keep track of when paths were last logged
  const progressCheckTimes = new Map(); // Keep track of when progress was last checked
  
  app.use((req, res, next) => {
    const path = req.path;
    const now = Date.now();
    const pollingEndpoints = ['/jobs/:jobId/progress', '/jobs/:jobId'];
    
    // For polling endpoints like progress and status, only log once per 30 seconds
    if (pollingEndpoints.some(pattern => {
      return new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`).test(path);
    })) {
      const lastTime = lastLogged.get(path) || 0;
      if (now - lastTime < 30000) { // 30 seconds
        return next(); // Skip logging
      }
      lastLogged.set(path, now);
    }
    
    // Log the request with minimal info
    logger.info(`Job Service: Received ${req.method} request for ${req.path}`);
    next();
  });
  
  // Additional middleware to log request body and headers only for non-GET requests
  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      //logger.info('Request headers:', req.headers);
      //logger.info('Request body:', req.body);
    }
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'Job Service is healthy' });
  });

  // Generate content endpoint
  app.post('/generate', async (req, res) => {
    try {
      const { prompt, parameters, visualizationType, userId } = req.body;
      
      if (!prompt) {
        throw new Error('prompt is required');
      }

      logger.info(`Job Service: Starting content generation for prompt: ${prompt}`, { userId });
      
      // First create a job and get the job ID that we can return immediately
      const { jobId } = await jobService.createInitialJob(prompt, parameters, visualizationType, userId);
      
      // Send the response with the job ID immediately
      res.json({
        message: 'Job created successfully and is now processing',
        jobId: jobId,
        status: 'in_progress'
      });
      
      // Continue with processing the job in the background
      jobService.processJobInBackground(jobId, prompt, parameters, visualizationType, userId)
        .catch(error => {
          logger.error(`Background job processing error for job ${jobId}:`, error);
        });
        
    } catch (error) {
      logger.error('Job Service: Error generating content:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error.message,
        jobId: error.jobId  // Include jobId if available
      });
    }
  });

  // Get job status endpoint
  app.get('/jobs/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await jobService.getJobStatus(jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.json(job);
    } catch (error) {
      logger.error('Error fetching job status:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Get job progress endpoint
  app.get('/jobs/:jobId/progress', (req, res) => {
    try {
      const { jobId } = req.params;
      const now = Date.now();
      
      // Rate limit progress checks to once every 1 second per job (was 2 seconds)
      const lastCheck = progressCheckTimes.get(jobId) || 0;
      if (now - lastCheck < 1000) {
        // Return last progress result instead of 429 error
        const lastProgressResult = jobService.getJobProgress(jobId);
        if (lastProgressResult) {
          return res.json(lastProgressResult);
        }
        
        return res.status(429).json({ 
          error: 'Too many requests', 
          message: 'Please wait before checking progress again' 
        });
      }
      progressCheckTimes.set(jobId, now);
      
      // Check if we have this progress info cached to reduce logging
      const progress = jobService.getJobProgress(jobId);
      
      if (!progress) {
        // Only log if explicitly requested
        if (req.headers['x-log-progress'] === 'true') {
          logger.info(`Job progress not found for ${jobId}`);
        }
        return res.status(404).json({ error: 'Job progress not found' });
      }
      
      // Only log significant changes or status changes
      if (req.headers['x-log-progress'] === 'true' || 
          (progress.overallProgress % 25 === 0 && progress.status === 'in_progress') || // Log at 0%, 25%, 50%, 75%, 100%
          progress.status !== 'in_progress') {  // Always log on status change
        logger.info(`Job progress for ${jobId}: ${progress.overallProgress}% (${progress.status})`);
      }
      
      res.json(progress);
    } catch (error) {
      logger.error('Error fetching job progress:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Get all jobs endpoint
  app.get('/jobs', async (req, res) => {
    try {
      const filters = req.query;
      const jobs = await jobService.getAllJobs(filters);
      res.json(jobs);
    } catch (error) {
      logger.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // New endpoint for receiving real-time progress updates from other services
  app.post('/progress/update', (req, res) => {
    const { jobId, sceneId, service, status, progress, metadata } = req.body;
    logger.info(`Job Service: Received progress update for ${jobId}/${service}`, { sceneId, status, progress });
    try {
      if (sceneId !== undefined && sceneId !== null) {
        progressTracker.updateSceneProgress(jobId, sceneId, service, progress, status, metadata);
      } else {
        progressTracker.updateServiceProgress(jobId, service, progress, status, metadata);
      }
      res.status(200).json({ message: 'Progress updated' });
    } catch (error) {
      logger.error('Job Service: Failed to update progress', { jobId, error: error.message });
      res.status(500).json({ error: 'Failed to update progress' });
    }
  });

  // Internal endpoint for services to report back results
  app.post('/internal/job/:jobId/scene/:sceneId/result', async (req, res) => {
    const { jobId, sceneId } = req.params;
    const { service, data, status } = req.body;

    if (!service || !data) {
      logger.error('Internal result endpoint called with missing service or data', { jobId, sceneId });
      return res.status(400).json({ error: 'Missing service name or result data' });
    }

    try {
      logger.info(`Received result for job ${jobId}, scene ${sceneId} from ${service} service.`);
      await jobService.addResultToScene(jobId, parseInt(sceneId), service, status, data);
      res.status(200).json({ message: 'Result processed successfully' });
    } catch (error) {
      logger.error(`Error processing result for job ${jobId}, scene ${sceneId}`, { 
        service,
        error: error.message 
      });
      res.status(500).json({ error: 'Failed to process result' });
    }
  });

  // Catch-all for any other routes
  app.use('*', (req, res) => {
    logger.warn(`Job Service: Unhandled request for ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist.' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error(`Job Service: Unhandled error: ${err.stack}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });

  return app;
}

module.exports = createServer;