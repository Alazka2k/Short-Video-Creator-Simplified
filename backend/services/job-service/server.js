// backend/services/job-service/server.js

const express = require('express');
const logger = require('../../shared/utils/logger');

function createServer(jobService) {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use((req, res, next) => {
    logger.info(`Job Service: Received ${req.method} request for ${req.url}`);
    logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'Job Service is healthy' });
  });

  // Generate content endpoint
  app.post('/generate', async (req, res) => {
    const requestTimeout = setTimeout(() => {
      logger.error('Job Service: Request timed out');
      res.status(504).json({ error: 'Request timed out' });
    }, 1800000); // 30 minutes timeout

    try {
      const { prompt, parameters, visualizationType, userId } = req.body;
      
      if (!prompt) {
        throw new Error('prompt is required');
      }

      logger.info(`Job Service: Starting content generation for prompt: ${prompt}`, { userId });
      const result = await jobService.process(prompt, parameters, visualizationType, userId);
      
      clearTimeout(requestTimeout);

      // Check if job completed successfully or with service failures
      if (result.status === 'failed') {
        return res.status(207).json({  // 207 Multi-Status
          message: 'Content generation completed with some service failures',
          result
        });
      }

      res.json({
        message: 'Content generation completed successfully',
        result
      });
    } catch (error) {
      clearTimeout(requestTimeout);
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