const express = require('express');
const router = express.Router();
const config = require('../../shared/utils/config');
const jwtAuth = require('../middleware/jwtAuth');
const axios = require('axios');
const logger = require('../../shared/utils/logger');

/**
 * @route POST /api/job/generate
 * @description Generate a new job
 * @access User
 */
router.post('/generate', jwtAuth({ requireUser: true }), async (req, res) => {
  try {
    const { userId, email: userEmail } = req.user;

    logger.info('Processing job generation with user context', {
      userId,
      userEmail,
    });

    const { prompt, parameters, visualizationType } = req.body;

    // Basic validation
    if (!prompt) {
      return res.status(400).json({ error: 'Missing required parameter: prompt' });
    }

    logger.info('Forwarding request to Job service:', {
      url: `${config.services.job.url}/generate`,
      userId,
      prompt: prompt.substring(0, 100) + '...'
    });

    // Create job request payload
    const jobPayload = {
      prompt,
      parameters: parameters || {},
      userId: userId,
      visualizationType: visualizationType || 'video',
    };

    // Send job to job-service
    const response = await axios.post(`${config.services.job.url}/generate`, jobPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000  // 120 seconds timeout
    });

    logger.info('Job response received:', { 
      status: response.status, 
      jobId: response.data.jobId || response.data.result?.jobId,
      hasResult: !!response.data
    });

    // Return the job results
    res.json({
      message: 'Job submitted successfully and is now processing',
      jobId: response.data.jobId || response.data.result?.jobId,
      status: 'in_progress',
      ...response.data
    });

  } catch (error) {
    logger.error('Job error:', { 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    
    res.status(status).json({
      error: 'Job generation failed',
      message,
      details: error.response?.data || error.message
    });
  }
});

/**
 * @route GET /api/job/jobs/:jobId
 * @description Get details of a specific job
 * @access User or Admin
 */
router.get('/jobs/:jobId', jwtAuth({ requireUser: true }), async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;

    logger.info(`Fetching job details for jobId: ${req.params.jobId}`, {
      userId,
      isAdmin
    });

    const response = await axios.get(`${config.services.job.url}/jobs/${req.params.jobId}`, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    logger.info('Job response data:', {
      jobId: req.params.jobId,
      responseUserId: response.data.user_id,
      requestUserId: userId,
      isAdmin
    });

    // If not admin, verify job belongs to user
    if (!isAdmin && response.data.user_id?.toString() !== userId?.toString()) {
      logger.warn('Access denied to job:', {
        jobId: req.params.jobId,
        jobUserId: response.data.user_id,
        requestUserId: userId,
        isAdmin
      });
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this job'
      });
    }

    logger.info('Job details retrieved:', {
      jobId: req.params.jobId,
      status: response.status,
      hasData: !!response.data,
      userId,
      isAdmin
    });

    res.json(response.data);
  } catch (error) {
    logger.error('Job details error:', {
      jobId: req.params.jobId,
      error: error.message,
      status: error.response?.status
    });

    res.status(error.response?.status || 500).json({
      error: 'Failed to get job details',
      details: error.response?.data?.details || error.message
    });
  }
});

/**
 * @route GET /api/job/jobs
 * @description Get list of all jobs with pagination and filtering
 * @access User or Admin
 */
router.get('/jobs', jwtAuth({ requireUser: true }), async (req, res) => {
  try {
    const { userId, isAdmin, email: userEmail } = req.user;

    logger.info('Processing get jobs request', {
      userId,
      isAdmin,
      userEmail,
      query: req.query
    });

    // Extract query parameters
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      services,
      status
    } = req.query;

    // Build filters object
    const filters = {
      page,
      limit,
      sortBy,
      sortOrder,
      status
    };

    // Handle services parameter
    if (services) {
      if (typeof services === 'string') {
        filters.services = [services];
      } else if (Array.isArray(services)) {
        filters.services = services;
      }
    }

    // Add user ID if not admin
    if (!isAdmin) {
      filters.userId = userId.toString();
    }

    logger.info('Making request to job service:', {
      url: `${config.services.job.url}/jobs`,
      filters,
      userId,
      isAdmin
    });

    const response = await axios.get(`${config.services.job.url}/jobs`, {
      params: filters,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    logger.info('Jobs list retrieved:', {
      status: response.status,
      hasData: !!response.data,
      userId,
      isAdmin,
      jobCount: response.data?.data?.length || 0,
      pagination: response.data?.pagination
    });

    // Process URLs in the response data
    const StorageUrlHelper = require('../../shared/utils/storage-url-helper');
    const processedData = await Promise.all(response.data.data.map(async job => {
      if (job.metadata?.scenes) {
        for (const scene of job.metadata.scenes) {
          if (scene.image) {
            scene.image = await StorageUrlHelper.refreshUrlsInObject(scene.image);
          }
          if (scene.video) {
            scene.video = await StorageUrlHelper.refreshUrlsInObject(scene.video);
          }
          if (scene.voice) {
            scene.voice = await StorageUrlHelper.refreshUrlsInObject(scene.voice);
          }
        }
        if (job.metadata.music) {
          job.metadata.music = await StorageUrlHelper.refreshUrlsInObject(job.metadata.music);
        }
      }
      return job;
    }));

    res.json({
      data: processedData,
      pagination: response.data.pagination
    });
  } catch (error) {
    logger.error('Jobs list request error:', {
      error: error.message,
      stack: error.stack,
      status: error.response?.status
    });

    res.status(error.response?.status || 500).json({
      error: 'Failed to get jobs list',
      details: error.response?.data?.details || error.message
    });
  }
});

/**
 * @route GET /api/job/jobs/:jobId/progress
 * @description Get progress of a specific job
 * @access User or Admin
 */
router.get('/jobs/:jobId/progress', jwtAuth({ requireUser: true }), async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;
    const { jobId } = req.params;
    
    logger.info(`Fetching progress for job ${jobId}`, { userId, isAdmin });
    
    // First get job details to verify ownership
    const jobResponse = await axios.get(`${config.services?.job?.url}/jobs/${jobId}`, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    // If not admin, verify job belongs to user
    if (!isAdmin && jobResponse.data.user_id?.toString() !== userId?.toString()) {
      logger.warn('Access denied to job progress:', {
        jobId: jobId,
        jobUserId: jobResponse.data.user_id,
        requestUserId: userId,
        isAdmin
      });
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this job'
      });
    }
    
    // Get the actual progress
    const response = await axios.get(`${config.services?.job?.url}/jobs/${jobId}/progress`);
    
    logger.info('Job progress retrieved:', {
      jobId: jobId,
      status: response.status,
      hasData: !!response.data,
      progress: response.data?.overallProgress,
      jobStatus: response.data?.status
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Job progress error:', {
      jobId: req.params.jobId,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    res.status(error.response?.status || 500).json({
      error: 'Failed to get job progress',
      details: error.response?.data?.details || error.message
    });
  }
});

/**
 * @route   POST /api/job/stats
 * @desc    Get user's content creation statistics
 * @access  Private
 */
router.post('/stats', jwtAuth({ requireUser: true }), async (req, res) => {
  try {
    const { userId } = req.user;
    const JOB_SERVICE_URL = config.services?.job?.url;

    const response = await axios.post(`${JOB_SERVICE_URL}/stats`, 
      { userId },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-service-auth': process.env.SERVICE_AUTH_TOKEN,
        },
        timeout: 30000
      }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error('Error getting user content stats:', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    const status = error.response?.status || 500;
    res.status(status).json({
      error: 'Failed to get content stats',
      message: error.response?.data?.message || error.message
    });
  }
});

module.exports = router; 