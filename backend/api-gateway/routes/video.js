const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const serviceAuthMiddleware = require('../middleware/serviceAuth');

/**
 * @route POST /api/video/generate
 * @description Generate video using video service
 * @access Protected - requires create:video permission
 */
router.post('/generate',
  verifyAuth0Token,
  checkPermission('/api/video/generate'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Forwarding request to Video service');
      const { imageUrl, videoPrompt, cameraMovement, aspectRatio, jobId, sceneIndex } = req.body;

      // Basic validation
      if (!imageUrl) {
        throw new Error('Missing required parameter: imageUrl');
      }
      if (!videoPrompt) {
        throw new Error('Missing required parameter: videoPrompt');
      }
      if (!cameraMovement) {
        throw new Error('Missing required parameter: cameraMovement');
      }
      if (!aspectRatio) {
        throw new Error('Missing required parameter: aspectRatio');
      }
      if (!jobId) {
        throw new Error('Missing required parameter: jobId');
      }
      if (sceneIndex === undefined) {
        throw new Error('Missing required parameter: sceneIndex');
      }

      const response = await axios.post(`${config.services.video.url}/generate`, {
        imageUrl,
        videoPrompt,
        cameraMovement,
        aspectRatio,
        jobId,
        sceneIndex
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 600000  // 10 minutes timeout
      });

      logger.info('Received response from Video service:', {
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Video generation error:', {
        error: error.message,
        stack: error.stack,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Video generation failed',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

/**
 * @route GET /api/video/status/:jobId
 * @description Get status of a video generation job
 * @access Protected - requires read:video permission
 */
router.get('/status/:jobId',
  verifyAuth0Token,
  checkPermission('/api/video/status'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      const response = await axios.get(`${config.services.video.url}/status/${req.params.jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Video status check:', {
        jobId: req.params.jobId,
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Video status check error:', {
        jobId: req.params.jobId,
        error: error.message,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Failed to get video status',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

module.exports = router; 