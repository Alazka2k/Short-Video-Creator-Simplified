const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const { verifyAuth0Token, checkPermission } = require('../../services/auth-service/middleware/auth0-verify.middleware');
const serviceAuthMiddleware = require('../middleware/serviceAuth');

/**
 * @route POST /api/assembly/assemble
 * @description Assemble video from generated content
 * @access Protected - requires create:assembly permission
 */
router.post('/assemble',
  verifyAuth0Token,
  checkPermission('/api/assembly/assemble'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      logger.info('Forwarding request to Assembly service');
      const { jobId, scenes } = req.body;

      // Basic validation
      if (!jobId) {
        throw new Error('Missing required parameter: jobId');
      }

      if (!scenes || !Array.isArray(scenes)) {
        throw new Error('Missing required parameter: scenes (must be an array)');
      }

      // Validate each scene has required fields
      const invalidScenes = scenes.filter(scene => 
        !scene.sceneId || 
        typeof scene.duration !== 'number' || 
        scene.duration <= 0
      );

      if (invalidScenes.length > 0) {
        throw new Error('Invalid scene configuration: Each scene must have a sceneId and positive duration');
      }

      const response = await axios.post(`${config.services.assembly.url}/assemble`, {
        jobId,
        scenes
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 600000  // 10 minutes timeout
      });

      logger.info('Received response from Assembly service:', {
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Assembly request error:', {
        error: error.message,
        stack: error.stack,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Assembly request failed',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

/**
 * @route GET /api/assembly/status/:jobId
 * @description Get status of an assembly job
 * @access Protected - requires read:assembly permission
 */
router.get('/status/:jobId',
  verifyAuth0Token,
  checkPermission('/api/assembly/status'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        throw new Error('Missing required parameter: jobId');
      }

      const response = await axios.get(`${config.services.assembly.url}/status/${jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Assembly status check:', {
        jobId: req.params.jobId,
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Assembly status check error:', {
        jobId: req.params.jobId,
        error: error.message,
        status: error.response?.status
      });

      if (error.response?.status === 404) {
        res.status(404).json({
          error: 'Not Found',
          details: 'Assembly job not found'
        });
      } else {
        res.status(error.response?.status || 500).json({
          error: 'Failed to get assembly status',
          details: error.response?.data?.details || error.message
        });
      }
    }
  }
);

/**
 * @route GET /api/assembly/validate/:jobId
 * @description Validate assembly prerequisites for a job
 * @access Protected - requires read:assembly permission
 */
router.get('/validate/:jobId',
  verifyAuth0Token,
  checkPermission('/api/assembly/validate'),
  serviceAuthMiddleware,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        throw new Error('Missing required parameter: jobId');
      }

      const response = await axios.get(`${config.services.assembly.url}/validate/${jobId}`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Assembly validation check:', {
        jobId: req.params.jobId,
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Assembly validation error:', {
        jobId: req.params.jobId,
        error: error.message,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Failed to validate assembly prerequisites',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

module.exports = router; 