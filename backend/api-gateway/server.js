const express = require('express');
const axios = require('axios');
const logger = require('../shared/utils/logger');
const config = require('../shared/utils/config');
const assemblyRoutes = require('../services/assembly-service/server');
const path = require('path');
const authTestRoutes = require('../../tests/auth/auth-test');
const serviceAuthMiddleware = require('./middleware/serviceAuth');
const { verifyAuth0Token, checkPermission } = require('../services/auth-service/middleware/auth0-verify.middleware');
const authRoutes = require('./routes/auth');
const docsRoutes = require('./routes/docs');

console.log('Current Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  isDefined: process.env.NODE_ENV !== undefined,
  type: typeof process.env.NODE_ENV
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  logger.info(`API Gateway: Received ${req.method} request for ${req.url}`);
  logger.info(`Request headers: ${JSON.stringify(req.headers)}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// Health check endpoint for API Gateway
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is healthy' });
});

// LLM Service route
app.post('/api/llm/generate', 
  verifyAuth0Token, 
  checkPermission('create_video'), 
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
    logger.info(`Received response from LLM service: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`LLM request error: ${error.message}`);
    res.status(error.response?.status || 500).json({
      error: 'LLM request failed',
      details: error.response?.data?.details || error.message
    });
  }
});

// Voice Service route
app.post('/api/voice/generate', 
  verifyAuth0Token, 
  checkPermission('create_video'), 
  serviceAuthMiddleware, 
  async (req, res) => {
  try {
    logger.info('Forwarding request to Voice service');
    const response = await axios.post(`${config.services.voice.url}/generate`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000  // 2 minutes timeout
    });
    logger.info(`Received response from Voice service: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Voice request error: ${error.message}`);
    res.status(500).json({ error: 'Voice request failed', details: error.message });
  }
});

// Image Service route
app.post('/api/image/generate', 
  verifyAuth0Token, 
  checkPermission('create_video'), 
  serviceAuthMiddleware, 
  async (req, res) => {
  try {
    logger.info('Forwarding request to Image service');
    const response = await axios.post(`${config.services.image.url}/generate`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 300000  // 5 minutes timeout
    });
    logger.info(`Received response from Image service: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Image request error: ${error.message}`);
    res.status(500).json({ error: 'Image request failed', details: error.message });
  }
});

// Music Service route
app.post('/api/music/generate', 
  verifyAuth0Token, 
  checkPermission('create_video'), 
  serviceAuthMiddleware, 
  async (req, res) => {
  try {
    logger.info('Forwarding request to Music service');
    const response = await axios.post(`${config.services.music.url}/generate`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 600000  // 10 minutes timeout
    });
    logger.info(`Received response from Music service: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Music request error: ${error.message}`);
    res.status(500).json({ error: 'Music request failed', details: error.message });
  }
});

// Animation Service route
app.post('/api/animation/generate', 
  verifyAuth0Token, 
  checkPermission('create_video'), 
  serviceAuthMiddleware, 
  async (req, res) => {
  try {
    logger.info('Forwarding request to Animation service');
    const response = await axios.post(`${config.services.animation.url}/generate`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 300000  // 5 minutes timeout
    });
    logger.info(`Received response from Animation service: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Animation request error: ${error.message}`);
    res.status(500).json({ error: 'Animation request failed', details: error.message });
  }
});

// Video Service route
app.post('/api/video/generate', 
  verifyAuth0Token, 
  checkPermission('create_video'), 
  serviceAuthMiddleware, 
  async (req, res) => {
  try {
    logger.info('Forwarding request to Video service');
    const response = await axios.post(`${config.services.video.url}/generate`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 600000  // 10 minutes timeout
    });
    logger.info(`Received response from Video service: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Video request error: ${error.message}`);
    res.status(500).json({ error: 'Video request failed', details: error.message });
  }
});

// Assembly Service routes
app.post('/api/assembly/assemble', 
  verifyAuth0Token, 
  checkPermission('create_video'), 
  serviceAuthMiddleware, 
  async (req, res) => {
  try {
    logger.info('Forwarding request to Assembly service');
    const response = await axios.post(`${config.services.assembly.url}/assemble`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 600000  // 10 minutes timeout
    });
    logger.info(`Received response from Assembly service: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Assembly request error: ${error.message}`);
    res.status(error.response?.status || 500).json({
      error: 'Assembly request failed',
      details: error.response?.data?.details || error.message
    });
  }
});

app.get('/api/assembly/status/:jobId', serviceAuthMiddleware, async (req, res) => {
  try {
    logger.info(`Forwarding assembly status request for jobId: ${req.params.jobId}`);
    const response = await axios.get(`${config.services.assembly.url}/status/${req.params.jobId}`, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000  // 30 seconds timeout
    });
    logger.info(`Received assembly status response: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Assembly status request error: ${error.message}`);
    res.status(error.response?.status || 500).json({
      error: 'Assembly status request failed',
      details: error.response?.data?.details || error.message
    });
  }
});

app.get('/api/assembly/validate/:jobId', serviceAuthMiddleware, async (req, res) => {
  try {
    logger.info(`Forwarding assembly validation request for jobId: ${req.params.jobId}`);
    const response = await axios.get(`${config.services.assembly.url}/validate/${req.params.jobId}`, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000  // 30 seconds timeout
    });
    logger.info(`Received assembly validation response: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Assembly validation request error: ${error.message}`);
    res.status(error.response?.status || 500).json({
      error: 'Assembly validation request failed',
      details: error.response?.data?.details || error.message
    });
  }
});

// Job Service routes
app.post('/api/job/generate', 
  verifyAuth0Token, 
  checkPermission('create_job'), 
  serviceAuthMiddleware, 
  async (req, res) => {
  try {
    logger.info('Forwarding request to Job service');
    const response = await axios.post(`${config.services.job.url}/generate`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 1800000  // 30 minutes timeout
    });
    logger.info(`Received response from Job service: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Job request error: ${error.message}`);
    res.status(500).json({ error: 'Job request failed', details: error.message });
  }
});

app.get('/api/job/jobs/:jobId', 
  verifyAuth0Token, 
  checkPermission('create_job'), 
  serviceAuthMiddleware, 
  async (req, res) => {
  try {
    logger.info(`Forwarding job status request for jobId: ${req.params.jobId}`);
    const response = await axios.get(`${config.services.job.url}/jobs/${req.params.jobId}`, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000  // 30 seconds timeout
    });
    logger.info(`Received job status response: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Job status request error: ${error.message}`);
    res.status(500).json({ error: 'Job status request failed', details: error.message });
  }
});

app.get('/api/job/jobs', 
  verifyAuth0Token, 
  checkPermission('create_job'), 
  serviceAuthMiddleware, 
  async (req, res) => {
  try {
    logger.info('Forwarding request to get all jobs');
    const response = await axios.get(`${config.services.job.url}/jobs`, {
      params: req.query,  // Forward any query parameters
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000  // 30 seconds timeout
    });
    logger.info(`Received jobs list response: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Jobs list request error: ${error.message}`);
    res.status(500).json({ error: 'Jobs list request failed', details: error.message });
  }
});

// Add media serving endpoint
app.use('/media', serviceAuthMiddleware, express.static(path.join(__dirname, '../../data/output')));

// Add test routes
app.use('/api/auth-test', authTestRoutes);

// Protected routes with permission checks
app.get('/api/templates', 
  verifyAuth0Token, 
  checkPermission('use_templates'), 
  async (req, res) => {
    // Template access code
});

app.post('/api/v1/*', 
  verifyAuth0Token, 
  checkPermission('api_access'), 
  async (req, res) => {
    // API access code
});

// Mount auth routes
app.use('/api/auth', authRoutes);

// Documentation routes
app.use('/docs', docsRoutes);

// Catch-all route for unhandled requests
app.use('*', (req, res) => {
  logger.warn(`Received unhandled request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.stack}`);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`Documentation available at http://localhost:${PORT}/docs`);
  
  // Auth routes
  logger.info('  /api/auth/social -> Auth0 social login');
  logger.info('  /api/auth/register-callback -> Auth0 register callback');
  logger.info('  /api/auth/register -> Auth0 register');
  logger.info('  /api/auth/login -> Auth0 login');
  logger.info('  /api/auth/forgot-password -> Auth0 forgot password');
  logger.info('  /api/auth/reset-password -> Auth0 reset password');
  logger.info('  /api/auth/profile -> Get user profile');
  logger.info('  /api/auth/refresh -> Auth0 refresh token');
  logger.info('  /api/auth/logout -> Auth0 logout');
  
  // LLM Service
  logger.info(`  /api/llm/generate -> ${config.services.llm.url}/generate`);
  
  // Image Service
  logger.info(`  /api/image/generate -> ${config.services.image.url}/generate`);
  
  // Voice Service
  logger.info(`  /api/voice/generate -> ${config.services.voice.url}/generate`);
  
  // Animation Service
  logger.info(`  /api/animation/generate -> ${config.services.animation.url}/generate`);
  
  // Video Service
  logger.info(`  /api/video/generate -> ${config.services.video.url}/generate`);
  
  // Music Service
  logger.info(`  /api/music/generate -> ${config.services.music.url}/generate`);
  
  // Assembly Service
  logger.info(`  /api/assembly/assemble -> ${config.services.assembly.url}/assemble`);
  logger.info(`  /api/assembly/status/:jobId -> ${config.services.assembly.url}/status`);
  logger.info(`  /api/assembly/validate/:jobId -> ${config.services.assembly.url}/validate`);
  
  // Job Service
  logger.info(`  /api/job/generate -> ${config.services.job.url}/generate`);
  logger.info(`  /api/job/jobs -> ${config.services.job.url}/jobs`);
  logger.info(`  /api/job/jobs/:jobId -> ${config.services.job.url}/jobs/:jobId`);
  
  // Media Service
  logger.info(`  /media/* -> Serving static files from ${path.join(__dirname, '../../data/output')}`);
});

module.exports = app;