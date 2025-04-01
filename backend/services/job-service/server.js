// backend/services/job-service/server.js

const express = require('express');
const logger = require('../../shared/utils/logger');

function createServer(jobService) {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Request logging middleware with rate limiting
  const lastLogged = new Map(); // Keep track of when paths were last logged
  
  app.use((req, res, next) => {
    const path = req.path;
    const now = Date.now();
    const pollingEndpoints = ['/jobs/:jobId/progress', '/jobs/:jobId'];
    
    // For polling endpoints like progress and status, only log once per 10 seconds
    if (pollingEndpoints.some(pattern => {
      return new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`).test(path);
    })) {
      const lastTime = lastLogged.get(path) || 0;
      if (now - lastTime < 10000) { // 10 seconds
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
      logger.info('Request headers:', req.headers);
      logger.info('Request body:', req.body);
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
      
      // Check if we have this progress info cached to reduce logging
      const progress = jobService.getJobProgress(jobId);
      
      if (!progress) {
        logger.info(`Job progress not found for ${jobId}`);
        return res.status(404).json({ error: 'Job progress not found' });
      }
      
      // Only log if significant change in progress or status change
      if (req.headers['x-log-progress'] === 'true' || 
          progress.overallProgress % 10 === 0 || // Log at 0%, 10%, 20%, etc.
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

  // Catch-all route for unhandled requests
  app.use('*', (req, res) => {
    logger.warn(`Job Service: Received unhandled request: ${req.method} ${req.originalUrl}`);
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