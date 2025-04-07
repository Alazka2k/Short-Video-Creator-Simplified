const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../../shared/utils/logger');
const config = require('../../shared/utils/config');
const { authMiddleware, checkPermission } = require('../middleware/auth0');

// Get all available batch jobs
router.get('/batches', authMiddleware, checkPermission('read:batch'), async (req, res) => {
  try {
    const batchServiceUrl = config.services.batch.url;
    const response = await axios.get(`${batchServiceUrl}/api/batch/batches`);
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching batch jobs:', error);
    res.status(500).json({ error: 'Failed to fetch batch jobs' });
  }
});

// Run a specific batch
router.post('/batches/:batchId/run', authMiddleware, checkPermission('start:batch'), async (req, res) => {
  try {
    const { batchId } = req.params;
    const parameters = req.body || {};
    
    const batchServiceUrl = config.services.batch.url;
    const response = await axios.post(`${batchServiceUrl}/api/batch/batches/${batchId}/run`, parameters);
    
    res.json(response.data);
  } catch (error) {
    logger.error(`Error running batch job ${req.params.batchId}:`, error);
    res.status(500).json({ error: 'Failed to run batch job' });
  }
});

// Get batch status
router.get('/batches/:batchId/status', authMiddleware, checkPermission('read:batch'), async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const batchServiceUrl = config.services.batch?.url;
    const response = await axios.get(`${batchServiceUrl}/api/batch/batches/${batchId}/status`);
    
    res.json(response.data);
  } catch (error) {
    logger.error(`Error getting batch status for ${req.params.batchId}:`, error);
    res.status(500).json({ error: 'Failed to get batch status' });
  }
});

// Get batch history
router.get('/batches/:batchId/history', authMiddleware, checkPermission('read:batch'), async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const batchServiceUrl = config.services.batch?.url;
    const response = await axios.get(`${batchServiceUrl}/api/batch/batches/${batchId}/history`);
    
    res.json(response.data);
  } catch (error) {
    logger.error(`Error getting batch history for ${req.params.batchId}:`, error);
    res.status(500).json({ error: 'Failed to get batch history' });
  }
});

// Get batch logs
router.get('/batches/:batchId/logs', authMiddleware, checkPermission('read:batch'), async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const batchServiceUrl = config.services.batch?.url;
    const response = await axios.get(`${batchServiceUrl}/api/batch/batches/${batchId}/logs`);
    
    res.json(response.data);
  } catch (error) {
    logger.error(`Error getting batch logs for ${req.params.batchId}:`, error);
    res.status(500).json({ error: 'Failed to get batch logs' });
  }
});

module.exports = router; 