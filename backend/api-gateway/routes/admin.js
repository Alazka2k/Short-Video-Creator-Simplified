const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');
const jwtAuth = require('../middleware/jwtAuth');

// All routes in this file require admin access
router.use(jwtAuth({ requireAdmin: true }));

// Admin-specific endpoints (e.g. to run batch jobs)

// Create Payments batch job
router.post('/batches/run/create-payments', async (req, res) => {
  try {
    logger.info('Forwarding create-payments batch job request to batch service');
    const batchServiceUrl = config.services.batch.url;
    // Note: The downstream service is protected by serviceAuth, so we don't pass user auth.
    const response = await axios.post(`${batchServiceUrl}/api/admin/batches/run/create-payments`, req.body);
    res.json(response.data);
  } catch (error) {
    logger.error('Failed to run Create Payments batch job:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    res.status(error.response?.status || 500).json({
      error: 'Failed to run Create Payments batch job',
      details: error.response?.data || error.message
    });
  }
});

// Collect Payments batch job
router.post('/batches/run/collect-payments', async (req, res) => {
  try {
    logger.info('Forwarding collect-payments batch job request to batch service');
    const batchServiceUrl = config.services.batch.url;
    const response = await axios.post(`${batchServiceUrl}/api/admin/batches/run/collect-payments`, req.body);
    res.json(response.data);
  } catch (error) {
    logger.error('Failed to run Collect Payments batch job:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    res.status(error.response?.status || 500).json({
      error: 'Failed to run Collect Payments batch job',
      details: error.response?.data || error.message
    });
  }
});

// Process Pending Cancellations batch job
router.post('/batches/run/process-pending-cancellations', async (req, res) => {
  try {
    logger.info('Forwarding process-pending-cancellations batch job request to batch service');
    const batchServiceUrl = config.services.batch.url;
    const response = await axios.post(`${batchServiceUrl}/api/admin/batches/run/process-pending-cancellations`, req.body);
    res.json(response.data);
  } catch (error) {
    logger.error('Failed to run Process Pending Cancellations batch job:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    res.status(error.response?.status || 500).json({
      error: 'Failed to run Process Pending Cancellations batch job',
      details: error.response?.data || error.message
    });
  }
});

// Subscription Renewals batch job
router.post('/batches/run/subscription-renewals', async (req, res) => {
  try {
    logger.info('Forwarding subscription-renewals batch job request to batch service');
    const batchServiceUrl = config.services.batch.url;
    const response = await axios.post(`${batchServiceUrl}/api/admin/batches/run/subscription-renewals`, req.body);
    res.json(response.data);
  } catch (error) {
    logger.error('Failed to run Subscription Renewals batch job:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    res.status(error.response?.status || 500).json({
      error: 'Failed to run Subscription Renewals batch job',
      details: error.response?.data || error.message
    });
  }
});

// Retry Failed Payments batch job
router.post('/batches/run/retry-failed-payments', async (req, res) => {
  try {
    logger.info('Forwarding retry-failed-payments batch job request to batch service');
    const batchServiceUrl = config.services.batch.url;
    const response = await axios.post(`${batchServiceUrl}/api/admin/batches/run/retry-failed-payments`, req.body);
    res.json(response.data);
  } catch (error) {
    logger.error('Failed to run Retry Failed Payments batch job:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    res.status(error.response?.status || 500).json({
      error: 'Failed to run Retry Failed Payments batch job',
      details: error.response?.data || error.message
    });
  }
});

// Get Batch Job Status
router.get('/batches/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const batchServiceUrl = config.services.batch.url;
    const response = await axios.get(`${batchServiceUrl}/batches/status/${jobId}`);
    
    res.json(response.data);
  } catch (error) {
    logger.error(`Error getting batch job status for ${req.params.jobId}:`, error);
    res.status(500).json({ error: 'Failed to get batch job status' });
  }
});

// Cancel Batch Job
router.post('/batches/cancel/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const batchServiceUrl = config.services.batch.url;
    await axios.post(`${batchServiceUrl}/batches/cancel/${jobId}`);
    
    res.json({
      success: true,
      message: 'Batch job cancelled successfully',
      jobId,
      cancelledAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error cancelling batch job ${req.params.jobId}:`, error);
    res.status(500).json({ error: 'Failed to cancel batch job' });
  }
});

module.exports = router; 