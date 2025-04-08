/**
 * Batch Processing Service Admin Routes
 * 
 * This file defines the API routes for admin-specific batch job operations.
 */

const express = require('express');
const router = express.Router();
const logger = require('../../shared/utils/logger');
const { authMiddleware, checkPermission } = require('../../api-gateway/middleware/auth0');

function adminRoutes(batchLauncher, batchRepository) {
  // Apply Auth0 middleware to all admin routes
  router.use(authMiddleware);
  router.use(checkPermission('manage:batch'));

  // Run Create Payments Batch
  router.post('/batches/run/create-payments', async (req, res) => {
    try {
      const { force } = req.body;
      logger.info('Starting Create Payments batch job with params:', { force });
      
      // Pass the authorization token to the batch job
      const result = await batchLauncher.runBatch('create-payments', { 
        force,
        authorization: req.headers.authorization
      });
      
      logger.info(`Create Payments batch job started with result:`, result);
      res.status(200).json({ 
        success: true, 
        batchId: result.batchId,
        message: 'Create Payments batch job started successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error starting Create Payments batch job:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to start Create Payments batch job',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Run Collect Payments Batch
  router.post('/batches/run/collect-payments', async (req, res) => {
    try {
      const { force } = req.body;
      logger.info('Starting Collect Payments batch job with params:', { force });
      
      // Pass the authorization token to the batch job
      const result = await batchLauncher.runBatch('collect-payments', { 
        force,
        authorization: req.headers.authorization
      });
      
      logger.info(`Collect Payments batch job started with result:`, result);
      res.status(200).json({ 
        success: true, 
        batchId: result.batchId,
        message: 'Collect Payments batch job started successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error starting Collect Payments batch job:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to start Collect Payments batch job',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Run Process Pending Cancellations Batch
  router.post('/batches/run/process-pending-cancellations', async (req, res) => {
    try {
      const { force } = req.body;
      logger.info('Starting Process Pending Cancellations batch job with params:', { force });
      
      // Pass the authorization token to the batch job
      const result = await batchLauncher.runBatch('process-pending-cancellations', { 
        force,
        authorization: req.headers.authorization
      });
      
      logger.info(`Process Pending Cancellations batch job started with result:`, result);
      res.status(200).json({ 
        success: true, 
        batchId: result.batchId,
        message: 'Process Pending Cancellations batch job started successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error starting Process Pending Cancellations batch job:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to start Process Pending Cancellations batch job',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Run Subscription Renewals Batch
  router.post('/batches/run/subscription-renewals', async (req, res) => {
    try {
      const { force } = req.body;
      logger.info('Starting Subscription Renewals batch job with params:', { force });
      
      // Pass the authorization token to the batch job
      const result = await batchLauncher.runBatch('subscription-renewals', { 
        force,
        authorization: req.headers.authorization
      });
      
      logger.info(`Subscription Renewals batch job started with result:`, result);
      res.status(200).json({ 
        success: true, 
        batchId: result.batchId,
        message: 'Subscription Renewals batch job started successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error starting Subscription Renewals batch job:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to start Subscription Renewals batch job',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Run Retry Failed Payments Batch
  router.post('/batches/run/retry-failed-payments', async (req, res) => {
    try {
      const { force } = req.body;
      logger.info('Starting Retry Failed Payments batch job with params:', { force });
      
      // Pass the authorization token to the batch job
      const result = await batchLauncher.runBatch('retry-failed-payments', { 
        force,
        authorization: req.headers.authorization
      });
      
      logger.info(`Retry Failed Payments batch job started with result:`, result);
      res.status(200).json({ 
        success: true, 
        batchId: result.batchId,
        message: 'Retry Failed Payments batch job started successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error starting Retry Failed Payments batch job:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to start Retry Failed Payments batch job',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get Batch Job Status
  router.get('/batches/:batchId/status', async (req, res) => {
    try {
      const { batchId } = req.params;
      logger.info(`Getting status for batch job: ${batchId}`);
      
      const status = await batchLauncher.getBatchStatus(batchId);
      
      res.status(200).json({ 
        success: true, 
        status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting batch job status:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to get batch job status',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Cancel Batch Job
  router.post('/batches/:batchId/cancel', async (req, res) => {
    try {
      const { batchId } = req.params;
      logger.info(`Cancelling batch job: ${batchId}`);
      
      await batchLauncher.cancelBatch(batchId);
      
      res.status(200).json({ 
        success: true, 
        message: 'Batch job cancelled successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error cancelling batch job:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to cancel batch job',
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}

module.exports = adminRoutes; 