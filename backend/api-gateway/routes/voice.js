const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const jwtAuth = require('../middleware/jwtAuth');

/**
 * @route POST /api/voice/generate
 * @description Generate voice using voice service
 * @access User
 */
router.post('/generate', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      logger.info('Forwarding request to Voice service');
      const { text, voice, jobId, sceneIndex } = req.body;
      const { user_id: userId } = req.user;

      // Basic validation
      if (!text) {
        return res.status(400).json({ error: 'Missing required parameter: text' });
      }
      if (!voice) {
        return res.status(400).json({ error: 'Missing required parameter: voice' });
      }
      if (!jobId) {
        return res.status(400).json({ error: 'Missing required parameter: jobId' });
      }
      if (sceneIndex === undefined) {
        return res.status(400).json({ error: 'Missing required parameter: sceneIndex' });
      }
      
      const response = await axios.post(`${config.services.voice.url}/generate`, {
        text,
        voice,
        jobId,
        sceneIndex,
        userId // Pass user context
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300000  // 5 minutes timeout
      });

      logger.info('Received response from Voice service:', {
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
 * @route GET /api/voice/voices
 * @description Get available voices from voice service
 * @access User
 */
router.get('/voices', jwtAuth({ requireUser: true }), async (req, res) => {
    try {
      logger.info('Forwarding request for available voices');

      const response = await axios.get(`${config.services.voice.url}/voices`, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000  // 30 seconds timeout
      });

      logger.info('Voice list check complete:', {
        status: response.status,
        hasData: !!response.data
      });

      res.json(response.data);
    } catch (error) {
      logger.error('Error fetching voices:', {
        error: error.message,
        status: error.response?.status
      });

      res.status(error.response?.status || 500).json({
        error: 'Failed to fetch voices',
        details: error.response?.data?.details || error.message
      });
    }
  }
);

module.exports = router; 