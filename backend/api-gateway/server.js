const express = require('express');
const axios = require('axios');
const logger = require('../shared/utils/logger');
const config = require('../shared/utils/config');
const assemblyRoutes = require('../services/assembly-service/server');
const path = require('path');
// Commented out auth-related imports
// const authController = require('../services/auth-service/auth-controller');
// const authMiddleware = require('../services/auth-service/auth-middleware');

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
app.post('/api/llm/generate', async (req, res) => {
  try {
    logger.info('Forwarding request to LLM service');
    const { inputPrompt, llmGenParams } = req.body;

    // Basic validation
    if (!inputPrompt || !llmGenParams) {
      throw new Error('Missing required parameters: inputPrompt, llmGenParams');
    }

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
    res.status(500).json({ error: 'LLM request failed', details: error.message });
  }
});

// Voice Service route
app.post('/api/voice/generate', async (req, res) => {
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
app.post('/api/image/generate', async (req, res) => {
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
app.post('/api/music/generate', async (req, res) => {
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
app.post('/api/animation/generate', async (req, res) => {
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
app.post('/api/video/generate', async (req, res) => {
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

// Job Service routes
app.post('/api/job/generate', async (req, res) => {
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

app.get('/api/job/jobs/:jobId', async (req, res) => {
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

app.get('/api/job/jobs', async (req, res) => {
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

// Add assembly routes
app.use('/api/assembly', assemblyRoutes);

// Commented out Auth Service routes
// app.post('/api/auth/register', authController.register);
// app.post('/api/auth/login', authController.login);
// app.post('/api/auth/social', authController.loginWithSocial);

// Commented out example of a protected route
// app.get('/api/protected', authMiddleware, (req, res) => {
//   res.json({ message: 'This is a protected route', user: req.user });
// });

// Add media serving endpoint
app.use('/media', express.static(path.join(__dirname, '../../data/output')));

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
  logger.info('Configured routes:');
  logger.info(`  /api/llm/generate -> ${config.services.llm.url}/generate`);
  logger.info(`  /api/image/generate -> ${config.services.image.url}/generate`);
  logger.info(`  /api/voice/generate -> ${config.services.voice.url}/generate`);
  logger.info(`  /api/music/generate -> ${config.services.music.url}/generate`);
  logger.info(`  /api/animation/generate -> ${config.services.animation.url}/generate`);
  logger.info(`  /api/video/generate -> ${config.services.video.url}/generate`);
  logger.info(`  /api/job/generate -> ${config.services.job.url}/generate`);
  logger.info(`  /api/job/jobs -> ${config.services.job.url}/jobs`);
  logger.info(`  /api/assembly -> /api/assembly`);
});

module.exports = app;