const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const jwtAuth = require('../middleware/jwtAuth');

/**
 * @route POST /api/music/generate
 * @description Generate music using music service
 * @access User
 */
router.post('/generate', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      logger.info('Forwarding request to Music service');
      const { jobId, title, prompt, style, instrumental } = req.body;
      const { user_id: userId } = req.user;

      // Basic validation
      if (!jobId) {
        return res.status(400).json({ error: 'Missing required parameter: jobId' });
      }
      if (!prompt) {
        return res.status(400).json({ error: 'Missing required parameter: prompt' });
      }

      const response = await axios.post(`${config.services.music.url}/generate`, {
        jobId,
        title,
        prompt,
        style,
        instrumental,
        userId // Pass user context
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
 * @access User
 */
router.get('/status/:jobId', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      const { jobId } = req.params;
      const { user_id: userId } = req.user;

      // TODO: Add ownership check
      logger.info('Music status check for job', { jobId, userId });

      const response = await axios.get(`${config.services.music.url}/status/${jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Music status check complete:', {
        jobId: jobId,
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