const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const serviceAuthMiddleware = require('../middleware/serviceAuth');

/**
 * @route POST /api/voice/generate
 * @description Generate voice audio using voice service
 * @access Protected - requires create:voice permission
 */
router.post('/generate',
  verifyAuth0Token,
  checkPermission('/api/voice/generate'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Forwarding request to voice service');
      const { text, sceneIndex, jobId, elevenlabsVoiceId } = req.body;

      // Basic validation
      if (!text) {
        throw new Error('Missing required parameter: text');
      }

      if (!jobId) {
        throw new Error('Missing required parameter: jobId');
      }

      const response = await axios.post(`${config.services.voice.url}/generate`, {
        text,
        sceneIndex,
        jobId,
        elevenlabsVoiceId
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300000  // 5 minutes timeout
      });

      logger.info('Received response from voice service:', {
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Voice generation error:', {
        error: error.message,
        stack: error.stack,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Voice generation failed',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

/**
 * @route GET /api/voice/status/:jobId
 * @description Get status of a voice generation job
 * @access Protected - requires read:voice permission
 */
router.get('/status/:jobId',
  verifyAuth0Token,
  checkPermission('/api/voice/status'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      const response = await axios.get(`${config.services.voice.url}/status/${req.params.jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Voice status check:', {
        jobId: req.params.jobId,
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Voice status check error:', {
        jobId: req.params.jobId,
        error: error.message,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Failed to get voice status',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

module.exports = router; 