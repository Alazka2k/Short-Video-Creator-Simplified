const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const serviceAuthMiddleware = require('../middleware/serviceAuth');

/**
 * @route POST /api/job/generate
 * @description Generate a new job
 * @access Protected - requires create:job permission
 */
router.post('/generate',
  verifyAuth0Token,
  checkPermission('/api/job/generate'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Forwarding request to Job service');
      const { prompt, parameters, visualizationType } = req.body;

      // Basic validation
      if (!prompt) {
        throw new Error('Missing required parameter: prompt');
      }

      const response = await axios.post(`${config.services.job.url}/generate`, {
        prompt,
        parameters,
        visualizationType
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 1800000  // 30 minutes timeout
      });

      logger.info('Received response from Job service:', {
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Job generation error:', {
        error: error.message,
        stack: error.stack,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Job generation failed',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

/**
 * @route GET /api/job/jobs/:jobId
 * @description Get details of a specific job
 * @access Protected - requires read:job permission
 */
router.get('/jobs/:jobId',
  verifyAuth0Token,
  checkPermission('/api/job/jobs'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info(`Forwarding job status request for jobId: ${req.params.jobId}`);
      const response = await axios.get(`${config.services.job.url}/jobs/${req.params.jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Job status check:', {
        jobId: req.params.jobId,
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Job status check error:', {
        jobId: req.params.jobId,
        error: error.message,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Failed to get job status',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

/**
 * @route GET /api/job/jobs
 * @description Get list of all jobs
 * @access Protected - requires read:job permission
 */
router.get('/jobs',
  verifyAuth0Token,
  checkPermission('/api/job/jobs'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Forwarding request to get all jobs');
      const response = await axios.get(`${config.services.job.url}/jobs`, {
        params: req.query,  // Forward any query parameters
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Jobs list retrieved:', {
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
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
  }
);

module.exports = router; 