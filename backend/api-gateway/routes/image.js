const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const jwtAuth = require('../middleware/jwtAuth');

/**
 * @route POST /api/image/generate
 * @description Generate images using image service
 * @access User
 */
router.post('/generate', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      logger.info('Forwarding request to Image service');
      const { prompt, sceneIndex, jobId } = req.body;
      const { user_id: userId } = req.user;

      // Basic validation
      if (!prompt) {
        return res.status(400).json({ error: 'Missing required parameter: prompt' });
      }

      const response = await axios.post(`${config.services.image.url}/generate`, {
        prompt,
        sceneIndex,
        jobId,
        userId // Pass user context
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300000  // 5 minutes timeout
      });

      logger.info('Received response from Image service:', {
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Image generation error:', {
        error: error.message,
        stack: error.stack,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Image generation failed',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

/**
 * @route GET /api/image/status/:jobId
 * @description Get status of an image generation job
 * @access User
 */
router.get('/status/:jobId', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      const { jobId } = req.params;
      const { user_id: userId } = req.user;
      
      // TODO: Add ownership check here as well.
      logger.info('Image status check for job', { jobId, userId });

      const response = await axios.get(`${config.services.image.url}/status/${jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Image status check complete:', {
        jobId: jobId,
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Image status check error:', {
        jobId: req.params.jobId,
        error: error.message,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Failed to get image status',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

module.exports = router;