/**
 * Batch Processing Service Routes
 * 
 * This file defines the API routes for batch job management.
 */

const express = require('express');
const router = express.Router();

function batchRoutes(batchLauncher, batchRepository) {
  // Get all available batch
  router.get('/batches', async (req, res) => {
    try {
      const batches = await batchLauncher.getAvailableBatches();
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get status of a specific batch
  router.get('/batches/:batchId/status', async (req, res) => {
    try {
      const status = await batchLauncher.getBatchStatus(req.params.batchId);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Run a specific batch
  router.post('/batches/:batchId/run', async (req, res) => {
    try {
      const result = await batchLauncher.runBatch(req.params.batchId, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get batch execution history
  router.get('/batches/:batchId/history', async (req, res) => {
    try {
      const history = await batchRepository.getBatchHistory(req.params.batchId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get batch execution logs
  router.get('/batches/:batchId/logs', async (req, res) => {
    try {
      const logs = await batchRepository.getBatchLogs(req.params.batchId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = batchRoutes; 