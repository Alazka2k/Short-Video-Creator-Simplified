const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const serviceAuthMiddleware = require('../middleware/serviceAuth');

/**
 * @route POST /api/image/generate
 * @description Generate images using image service
 * @access Protected - requires create:image permission
 */
router.post('/generate',
  verifyAuth0Token,
  checkPermission('/api/image/generate'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Forwarding request to Image service');
      const { prompt, sceneIndex, jobId } = req.body;

      // Basic validation
      if (!prompt) {
        throw new Error('Missing required parameter: prompt');
      }

      const response = await axios.post(`${config.services.image.url}/generate`, {
        prompt,
        sceneIndex,
        jobId
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
 * @access Protected - requires read:image permission
 */
router.get('/status/:jobId',
  verifyAuth0Token,
  checkPermission('/api/image/status'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      const response = await axios.get(`${config.services.image.url}/status/${req.params.jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Image status check:', {
        jobId: req.params.jobId,
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