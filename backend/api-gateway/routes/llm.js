const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const serviceAuthMiddleware = require('../middleware/serviceAuth');

/**
 * @route POST /api/llm/generate
 * @description Generate content using LLM service
 * @access Protected - requires create:llm permission
 */
router.post('/generate',
  verifyAuth0Token,
  checkPermission('/api/llm/generate'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Forwarding request to LLM service');
      const { inputPrompt, llmGenParams } = req.body;

      // Basic validation
      if (!inputPrompt) {
        throw new Error('Missing required parameter: inputPrompt');
      }

      if (!llmGenParams || !llmGenParams.general) {
        throw new Error('Missing required llmGenParams structure: must include general section');
      }

      // Validate only the truly required general parameters
      const requiredGeneralParams = ['sceneAmount', 'lengthDescription'];
      for (const param of requiredGeneralParams) {
        if (!llmGenParams.general[param]) {
          throw new Error(`Missing required parameter: general.${param}`);
        }
      }

      // Ensure all optional objects exist even if empty
      llmGenParams.script = llmGenParams.script || {};
      llmGenParams.image = llmGenParams.image || {};
      llmGenParams.general.generalDescription = llmGenParams.general.generalDescription || '';

      const response = await axios.post(`${config.services.llm.url}/generate`, {
        inputPrompt,
        llmGenParams,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300000  // 5 minutes timeout
      });

      logger.info('Received response from LLM service:', {
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('LLM request error:', {
        error: error.message,
        stack: error.stack,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'LLM request failed',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

/**
 * @route GET /api/llm/status/:jobId
 * @description Get status of an LLM generation job
 * @access Protected - requires read:llm permission
 */
router.get('/status/:jobId',
  verifyAuth0Token,
  checkPermission('/api/llm/status'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      const response = await axios.get(`${config.services.llm.url}/status/${req.params.jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('LLM status check:', {
        jobId: req.params.jobId,
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