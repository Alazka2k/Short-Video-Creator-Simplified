const express = require('express');
const axios = require('axios');
const logger = require('../shared/utils/logger');
const config = require('../shared/utils/config');

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
    const response = await axios.post(`${config.services.llm.url}/generate`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000  // 2 minutes timeout
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

// Network connection test route
app.get('/test-network-connection', async (req, res) => {
  try {
    const llmResponse = await axios.get(`${config.services.llm.url}/health`, { timeout: 5000 });
    const voiceResponse = await axios.get(`${config.services.voice.url}/health`, { timeout: 5000 });
    res.json({ 
      status: 'success', 
      llm: llmResponse.data,
      voice: voiceResponse.data
    });
  } catch (error) {
    logger.error(`Network connection error: ${error.message}`);
    res.status(500).json({ status: 'error', message: `Network connection failed: ${error.message}` });
  }
});

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
  logger.info(`  /api/voice/generate -> ${config.services.voice.url}/generate`);
});

module.exports = app;