const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const jwtAuth = require('../middleware/jwtAuth');

/**
 * @route POST /api/animation/generate
 * @description Generate animation using animation service
 * @access User
 */
router.post('/generate', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      logger.info('Forwarding request to Animation service');
      const { imageUrl, videoPrompt, sceneIndex, jobId, parameters = {}, animationLength } = req.body;

      // Basic validation
      if (!imageUrl) {
        return res.status(400).json({ error: 'Missing required parameter: imageUrl' });
      }
      if (sceneIndex === undefined) {
        return res.status(400).json({ error: 'Missing required parameter: sceneIndex' });
      }
      if (!jobId) {
        return res.status(400).json({ error: 'Missing required parameter: jobId' });
      }
      if (!videoPrompt) {
        return res.status(400).json({ error: 'Missing required parameter: videoPrompt' });
      }

      // Structure parameters properly
      const requestBody = {
        imageUrl,
        videoPrompt,
        sceneIndex,
        jobId,
        userId: req.user.user_id, // Pass user context
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
 * @access User
 */
router.get('/status/:jobId', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      const { user_id: userId } = req.user;
      const { jobId } = req.params;

      // TODO: Add ownership check to ensure user can only check their own job status.
      // This would require a call to the job-service to get job owner.
      // For now, any authenticated user can check any job's animation status.
      logger.info('Animation status check for job', { jobId, userId });

      const response = await axios.get(`${config.services.animation.url}/status/${jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Animation status check complete:', {
        jobId: jobId,
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