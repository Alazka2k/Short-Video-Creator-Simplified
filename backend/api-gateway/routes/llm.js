const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const jwtAuth = require('../middleware/jwtAuth');

/**
 * @route POST /api/llm/generate
 * @description Generate text using LLM service
 * @access User
 */
router.post('/generate', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      logger.info('Forwarding request to LLM service');
      const { prompt, jobId, sceneIndex } = req.body;
      const { user_id: userId } = req.user;

      // Basic validation
      if (!prompt) {
        return res.status(400).json({ error: 'Missing required parameter: prompt' });
      }

      const response = await axios.post(`${config.services.llm.url}/generate`, {
        prompt,
        jobId,
        sceneIndex,
        userId // Pass user context
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 600000  // 10 minutes timeout
      });

      logger.info('Received response from LLM service:', {
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('LLM generation error:', {
        error: error.message,
        stack: error.stack,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'LLM generation failed',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

/**
 * @route GET /api/llm/status/:jobId
 * @description Get status of an LLM generation job
 * @access User
 */
router.get('/status/:jobId', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      const { jobId } = req.params;
      const { user_id: userId } = req.user;

      // TODO: Add ownership check
      logger.info('LLM status check for job', { jobId, userId });

      const response = await axios.get(`${config.services.llm.url}/status/${jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('LLM status check complete:', {
        jobId,
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('LLM status check error:', {
        jobId: req.params.jobId,
        error: error.message,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Failed to get LLM status',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

module.exports = router; 