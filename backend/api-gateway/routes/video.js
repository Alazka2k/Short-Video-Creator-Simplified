const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const jwtAuth = require('../middleware/jwtAuth');

/**
 * @route POST /api/video/generate
 * @description Generate video using video service
 * @access User
 */
router.post('/generate', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      logger.info('Forwarding request to Video service');
      const { imageUrl, videoPrompt, cameraMovement, aspectRatio, jobId, sceneIndex, model = config.videoGen.model } = req.body;
      const { user_id: userId } = req.user;

      // Basic validation
      if (!imageUrl) {
        return res.status(400).json({ error: 'Missing required parameter: imageUrl' });
      }
      if (!jobId) {
        return res.status(400).json({ error: 'Missing required parameter: jobId' });
      }
      if (sceneIndex === undefined) {
        return res.status(400).json({ error: 'Missing required parameter: sceneIndex' });
      }

      // Additional validation for ray-1.5
      if (model === 'ray-1.5') {
        if (!videoPrompt) {
          return res.status(400).json({ error: 'Missing required parameter for ray-1.5: videoPrompt' });
        }
        if (!cameraMovement) {
          return res.status(400).json({ error: 'Missing required parameter for ray-1.5: cameraMovement' });
        }
        if (!aspectRatio) {
          return res.status(400).json({ error: 'Missing required parameter for ray-1.5: aspectRatio' });
        }
      }

      // Prepare request payload based on model
      const requestPayload = {
        imageUrl,
        jobId,
        sceneIndex,
        model,
        userId // Pass user context
      };

      // Add additional parameters for ray-1.5
      if (model === 'ray-1.5') {
        Object.assign(requestPayload, {
          videoPrompt,
          cameraMovement,
          aspectRatio
        });
      }

      const response = await axios.post(`${config.services.video.url}/generate`, requestPayload, {
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
 * @access User
 */
router.get('/status/:jobId', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      const { jobId } = req.params;
      const { user_id: userId } = req.user;

      // TODO: Add ownership check
      logger.info('Video status check for job', { jobId, userId });

      const response = await axios.get(`${config.services.video.url}/status/${jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Video status check complete:', {
        jobId,
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