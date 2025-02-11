const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const serviceAuthMiddleware = require('../middleware/serviceAuth');

/**
 * @route POST /api/animation/generate
 * @description Generate animation using animation service
 * @access Protected - requires create:animation permission
 */
router.post('/generate',
  verifyAuth0Token,
  checkPermission('/api/animation/generate'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Forwarding request to Animation service');
      const { imageUrl, videoPrompt, sceneIndex, jobId, parameters = {}, animationLength } = req.body;

      // Basic validation
      if (!imageUrl) {
        throw new Error('Missing required parameter: imageUrl');
      }
      if (sceneIndex === undefined) {
        throw new Error('Missing required parameter: sceneIndex');
      }
      if (!jobId) {
        throw new Error('Missing required parameter: jobId');
      }
      if (!videoPrompt) {
        throw new Error('Missing required parameter: videoPrompt');
      }

      // Structure parameters properly
      const requestBody = {
        imageUrl,
        videoPrompt,
        sceneIndex,
        jobId,
        parameters: {
          ...parameters,
          animationLength: animationLength || parameters.animationLength || 5
        }
      };

      const response = await axios.post(`${config.services.animation.url}/generate`, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300000  // 5 minutes timeout
      });

      logger.info('Received response from Animation service:', {
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Animation generation error:', {
        error: error.message,
        stack: error.stack,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Animation generation failed',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

/**
 * @route GET /api/animation/status/:jobId
 * @description Get status of an animation generation job
 * @access Protected - requires read:animation permission
 */
router.get('/status/:jobId',
  verifyAuth0Token,
  checkPermission('/api/animation/status'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      const response = await axios.get(`${config.services.animation.url}/status/${req.params.jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Animation status check:', {
        jobId: req.params.jobId,
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Animation status check error:', {
        jobId: req.params.jobId,
        error: error.message,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Failed to get animation status',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

module.exports = router;