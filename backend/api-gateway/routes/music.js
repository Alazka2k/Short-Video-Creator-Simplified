const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const serviceAuthMiddleware = require('../middleware/serviceAuth');

/**
 * @route POST /api/music/generate
 * @description Generate music using music service
 * @access Protected - requires create:music permission
 */
router.post('/generate',
  verifyAuth0Token,
  checkPermission('/api/music/generate'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Forwarding request to Music service');
      const { jobId, title, prompt, style, instrumental } = req.body;

      // Basic validation
      if (!jobId) {
        throw new Error('Missing required parameter: jobId');
      }
      if (!prompt) {
        throw new Error('Missing required parameter: prompt');
      }

      const response = await axios.post(`${config.services.music.url}/generate`, {
        jobId,
        title,
        prompt,
        style,
        instrumental
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 600000  // 10 minutes timeout
      });

      logger.info('Received response from Music service:', {
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Music generation error:', {
        error: error.message,
        stack: error.stack,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Music generation failed',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

/**
 * @route GET /api/music/status/:jobId
 * @description Get status of a music generation job
 * @access Protected - requires read:music permission
 */
router.get('/status/:jobId',
  verifyAuth0Token,
  checkPermission('/api/music/status'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      const response = await axios.get(`${config.services.music.url}/status/${req.params.jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Music status check:', {
        jobId: req.params.jobId,
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Music status check error:', {
        jobId: req.params.jobId,
        error: error.message,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Failed to get music status',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

module.exports = router; 