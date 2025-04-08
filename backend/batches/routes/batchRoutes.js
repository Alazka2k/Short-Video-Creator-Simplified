/**
 * Batch Processing Service Routes
 * 
 * This file defines the API routes for batch job management.
 */

const express = require('express');
const router = express.Router();
const logger = require('../../shared/utils/logger');

function batchRoutes(batchLauncher, batchRepository) {
  // Get all available batch
  router.get('/batches', async (req, res) => {
    try {
      logger.info('Fetching all available batch jobs');
      const batches = await batchLauncher.getAvailableBatches();
      logger.info(`Found ${batches.length} available batch jobs`);
      res.json(batches);
    } catch (error) {
      logger.error('Error fetching available batch jobs:', {
        message: error.message,
        stack: error.stack
      });
      res.status(500).json({ 
        error: 'Failed to fetch available batch jobs',
        details: {
          message: error.message,
          type: error.name
        }
      });
    }
  });

  // Get status of a specific batch
  router.get('/batches/:batchId/status', async (req, res) => {
    try {
      const { batchId } = req.params;
      logger.info(`Getting status for batch job: ${batchId}`);
      const status = await batchLauncher.getBatchStatus(batchId);
      res.json({
        success: true,
        batchId,
        status,
        checkedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error getting status for batch job ${req.params.batchId}:`, {
        message: error.message,
        stack: error.stack
      });
      res.status(500).json({ 
        error: 'Failed to get batch job status',
        details: {
          message: error.message,
          type: error.name
        }
      });
    }
  });

  // Run a specific batch
  router.post('/batches/:batchId/run', async (req, res) => {
    try {
      const { batchId } = req.params;
      const parameters = req.body || {};
      logger.info(`Starting batch job ${batchId} with parameters:`, parameters);
      
      const jobId = await batchLauncher.runBatch(batchId, parameters);
      
      logger.info(`Batch job ${batchId} started with jobId: ${jobId}`);
      res.json({ 
        success: true, 
        message: `Batch job ${batchId} started successfully`,
        jobId,
        startedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error starting batch job ${req.params.batchId}:`, {
        message: error.message,
        stack: error.stack,
        parameters: req.body
      });
      res.status(500).json({ 
        error: `Failed to start batch job ${req.params.batchId}`,
        details: {
          message: error.message,
          type: error.name
        }
      });
    }
  });

  // Get batch execution history
  router.get('/batches/:batchId/history', async (req, res) => {
    try {
      const { batchId } = req.params;
      logger.info(`Getting history for batch job: ${batchId}`);
      const history = await batchRepository.getBatchHistory(batchId);
      res.json({
        success: true,
        batchId,
        history,
        retrievedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error getting history for batch job ${req.params.batchId}:`, {
        message: error.message,
        stack: error.stack
      });
      res.status(500).json({ 
        error: 'Failed to get batch job history',
        details: {
          message: error.message,
          type: error.name
        }
      });
    }
  });

  // Get batch execution logs
  router.get('/batches/:batchId/logs', async (req, res) => {
    try {
      const { batchId } = req.params;
      logger.info(`Getting logs for batch job: ${batchId}`);
      const logs = await batchRepository.getBatchLogs(batchId);
      res.json({
        success: true,
        batchId,
        logs,
        retrievedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error getting logs for batch job ${req.params.batchId}:`, {
        message: error.message,
        stack: error.stack
      });
      res.status(500).json({ 
        error: 'Failed to get batch job logs',
        details: {
          message: error.message,
          type: error.name
        }
      });
    }
  });

  return router;
}

module.exports = batchRoutes; 